import { Injectable } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PostgresChatMessageHistory } from '@langchain/community/stores/message/postgres';
import { AIMessage, HumanMessage } from 'langchain';
import { Pool } from 'pg';
import { envs } from 'src/config/envs.conf';
import * as vehiculosData from '../data-json/autos_normalized.json';
import * as faqData from '../data-json/faq.json';
@Injectable()
export class WorkflowEngineService {
    // Declaramos el modelo (el "this.model" que preguntabas)
    private pool: Pool;
    private model = new ChatOpenAI({
        apiKey: envs.OPENAI_API_KEY,
        modelName: "gpt-4o-mini",
        temperature: 0 // Temperatura 0 para que sea preciso en la clasificación
    });

    constructor(private readonly workflowService: WorkflowService) {
        this.pool = new Pool({
            connectionString: envs.DATABASE_URL,
        });
    }

    async executeStep(workflowId: string, userMessage: string, chatId: string) {
        // 1. Check for active deployment (SNAPSHOT)
        const deployment = await this.workflowService.getActiveDeployment(workflowId);
        const logs: string[] = [];

        let nodes: any[] = [];
        let edges: any[] = [];

        if (deployment?.configSnapshot) {
            logs.push(`[LOG] Usando flujo publicado v${deployment.versionId}`);
            // Determine type: check nodeType.code, explicit type, typeCode column, OR infer from ID
            nodes = deployment.configSnapshot.nodes.map((n: any) => {
                const inferredTypeFromId = n.id && n.id.startsWith('node_') ? n.id.split('_')[1] : null;
                const finalType = n.nodeType?.code || n.type || n.typeCode || (n as any).typeCode || inferredTypeFromId;

                return {
                    id: n.id,
                    type: finalType,
                    data: n.config || n.data
                };
            });
            edges = deployment.configSnapshot.edges;
        } else {
            logs.push(`[LOG] No se encontró publicación activa. Usando borrador.`);
            // Fallback to draft
            const draft = await this.workflowService.findOne(workflowId);
            nodes = draft.nodes;
            edges = draft.edges;
        }

        const history = await this.getHistory(chatId);

        // 2. Entry point: Find 'input' or 'trigger' node
        let currentNode = nodes.find(n => n.type === 'input' || n.type === 'trigger');
        let finalResponse = "";

        if (!currentNode) {
            const foundTypes = nodes.map(n => n.type).join(', ');
            logs.push(`[ERROR] Nodo de entrada no encontrado. Tipos detectados: ${foundTypes}`);
            throw new Error(`Nodo inicial no encontrado (buscaba 'input' o 'trigger'). Detectados: ${foundTypes}`);
        }
        logs.push(`[LOG] Iniciando ejecución desde ${currentNode.id}`);

        // 3. Graph traversal
        while (currentNode) {
            const edge = edges.find(e => e.source === currentNode?.id);
            if (!edge) break;

            currentNode = nodes.find(n => n.id === edge.target);
            logs.push(`[LOG] Avanzando a nodo: ${currentNode?.type} (${currentNode?.id})`);

            if (currentNode?.type === 'orchestrator') {
                logs.push(`[LOG] Llamando a Orquestador...`);
                finalResponse = await this.runOrchestrator(currentNode, userMessage, history, { nodes, edges });
                logs.push(`[IA] Orquestador respondió: "${finalResponse.slice(0, 50)}..."`);
                if (!finalResponse.includes("EJECUTAR_TOOL")) break;
            }

            if (currentNode?.type === 'specialist' && finalResponse.includes("EJECUTAR_TOOL")) {
                const tool = currentNode?.data.tool;
                logs.push(`[LOG] Ejecutando Especialista con herramienta: ${tool}`);
                const toolData = this.getToolData(tool);
                finalResponse = await this.runSpecialistAI(currentNode, toolData, userMessage, history);
                logs.push(`[IA] Especialista respondió: "${finalResponse.slice(0, 50)}..."`);
                break;
            }

            if (currentNode?.type === 'log') {
                await this.writeExecutionLog(workflowId, chatId, currentNode, userMessage, finalResponse);
            }
        }

        // 4. Persistencia en DB (Memoria + Log)
        await this.saveHistory(chatId, userMessage, finalResponse);
        return {
            response: finalResponse,
            sessionId: chatId,
            logs: logs
        };
    }

    // --- MÉTODOS DE APOYO ---

    private async runOrchestrator(node: any, input: string, history: any, workflow: any) {
        // Obtenemos los campos del validador conectado por un edge
        const validator = workflow.nodes.find(n => n.type === 'validator');
        const fields = validator?.data.fields.join(", ") || "";

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `${node.data.systemPrompt} 
            REGLA: Valida estos campos: ${fields}. Si están completos, responde 'EJECUTAR_TOOL'.`],
            new MessagesPlaceholder("history"),
            ["human", "{input}"]
        ]);

        const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
        return await chain.invoke({ input, history });
    }

    private async runSpecialistAI(node: any, data: any, input: string, history: any) {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `Eres un especialista. Usa estos datos JSON para responder: ${JSON.stringify(data)}`],
            new MessagesPlaceholder("history"),
            ["human", "{input}"]
        ]);

        const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
        return await chain.invoke({ input, history });
    }

    private getToolData(toolName: string) {
        // Mapeo dinámico de archivos
        const tools = {
            'catalogo_autos_api': vehiculosData,
            'faq_api': faqData
        };
        return tools[toolName];
    }

    private async getHistory(chatId: string) {
        const history = new PostgresChatMessageHistory({
            tableName: "chat_history",
            sessionId: chatId,
            pool: this.pool
        });
        return await history.getMessages();
    }

    private async saveHistory(chatId: string, user: string, ai: string) {
        const history = new PostgresChatMessageHistory({
            tableName: "chat_history",
            sessionId: chatId,
            pool: this.pool
        });
        await history.addMessage(new HumanMessage(user));
        await history.addMessage(new AIMessage(ai));
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    private async writeExecutionLog(
        workflowId: string,
        chatId: string,
        node: any,
        input: string,
        output: string
    ) {
        const query = `
        INSERT INTO execution_logs 
        (workflow_id, session_id, node_id, node_type, input_received, output_generated)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;

        const values = [
            workflowId,
            chatId,
            node.id,
            node.type,
            input,
            output
        ];

        try {
            await this.pool.query(query, values);
            console.log(`[LOG] Nodo ${node.id} registrado exitosamente para la sesión ${chatId}`);
        } catch (error) {
            console.error('Error al escribir en execution_logs:', error);
        }
    }
}
