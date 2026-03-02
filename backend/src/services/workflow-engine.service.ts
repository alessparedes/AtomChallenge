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
        const workflow = await this.workflowService.findOne(workflowId);
        let history = await this.getHistory(chatId); // Recupera historial de Postgres

        // 2. Punto de inicio: Buscamos el nodo tipo 'input'
        let currentNode = workflow.nodes.find(n => n.type === 'input');
        let finalResponse = "";
        if (!currentNode) {
            throw new Error("No se encontró el nodo de inicio");
        }

        // 3. RECORRIDO DINÁMICO DEL GRAFO
        while (currentNode) {
            console.log(`>>> Procesando Nodo: ${currentNode.id} (${currentNode.type})`);

            // --- LÓGICA POR TIPO DE NODO ---

            if (currentNode.type === 'orchestrator') {
                // El orquestador analiza el historial y decide si avanzar o pedir datos
                finalResponse = await this.runOrchestrator(currentNode, userMessage, history, workflow);

                // Si el orquestador NO da la señal de "EJECUTAR_TOOL", se detiene para hablar con el usuario
                if (!finalResponse.includes("EJECUTAR_TOOL")) {
                    console.log("--- Validación pendiente: Deteniendo flujo para solicitar datos ---");
                    break;
                }
            }

            if (currentNode.type === 'specialist' && finalResponse.includes("EJECUTAR_TOOL")) {
                // El especialista carga el JSON indicado en el nodo (RAG)
                const toolData = this.getToolData(currentNode.data.tool);
                finalResponse = await this.runSpecialistAI(currentNode, toolData, userMessage, history);
                console.log("--- Especialista ejecutado con éxito ---");
            }

            if (currentNode.type === 'log') {
                // Nodo de auditoría usando TypeORM
                await this.writeExecutionLog(workflowId, chatId, currentNode, userMessage, finalResponse);
            }

            // --- NAVEGACIÓN POR EDGES (EL SALTO) ---
            // Buscamos la flecha donde el origen sea el nodo actual
            const nextEdge = workflow.edges.find(edge => edge.source === currentNode?.id);

            if (nextEdge) {
                // Movemos el puntero al nodo destino de la flecha
                currentNode = workflow.nodes.find(node => node.id === nextEdge.target);
            } else {
                // Si no hay más flechas, terminamos el recorrido
                currentNode = undefined;
            }
        }

        // 4. PERSISTENCIA FINAL
        // Guardamos la interacción en la tabla chat_history para que la memoria sea persistente
        await this.saveHistory(chatId, userMessage, finalResponse);

        return finalResponse;
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
