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
        // 1. Cargar el Grafo (Nodos y Edges)
        const workflow = await this.workflowService.findOne(workflowId);
        const history = await this.getHistory(chatId);

        // 2. Punto de entrada: Buscamos el nodo tipo 'input'
        let currentNode = workflow.nodes.find(n => n.type === 'input');
        let finalResponse = "";

        if (!currentNode) {
            throw new Error('Nodo inicial no encontrado');
        }

        //console.log(workflow);

        // 3. Recorrido del Grafo basado en Edges
        while (currentNode) {
            // Buscamos la conexión (edge) que sale del nodo actual
            const edge = workflow.edges.find(e => e.source === currentNode?.id);
            if (!edge) break;
            console.log("****", edge);

            // Movemos el puntero al siguiente nodo
            currentNode = workflow.nodes.find(n => n.id === edge.target);
            console.log("****", currentNode);
            // --- LÓGICA POR TIPO DE NODO ---

            if (currentNode?.type === 'orchestrator') {
                // El orquestador decide si falta info o si vamos a una tool
                finalResponse = await this.runOrchestrator(currentNode, userMessage, history, workflow);

                // Si el orquestador pide datos (Validator), detenemos el ciclo para responder al usuario
                if (!finalResponse.includes("EJECUTAR_TOOL")) break;
            }

            if (currentNode?.type === 'specialist' && finalResponse.includes("EJECUTAR_TOOL")) {
                // Si la IA decidió usar una herramienta, cargamos el JSON dinámicamente
                const toolData = this.getToolData(currentNode?.data.tool);
                finalResponse = await this.runSpecialistAI(currentNode, toolData, userMessage, history);
                break; // El especialista genera la respuesta final
            }

            if (currentNode?.type === 'log') {
                await this.writeExecutionLog(workflowId, chatId, currentNode, userMessage, finalResponse);
                // Después de loguear, buscamos el siguiente nodo si existe
            }
        }

        // 4. Persistencia en DB (Memoria + Log)
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
