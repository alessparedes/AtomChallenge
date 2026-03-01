import { Injectable } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PostgresChatMessageHistory } from '@langchain/community/stores/message/postgres';
import { AIMessage, HumanMessage } from 'langchain';
import { Pool } from 'pg';
import { envs } from 'src/config/envs.conf';

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
        // 1. Cargamos TODO el flujo desde la DB
        const workflow = await this.workflowService.findOne(workflowId);

        // 2. Buscamos el nodo actual (empezando por el Orquestador)
        const orchestratorNode = workflow.nodes.find(n => n.type === 'orchestrator');

        if (!orchestratorNode) {
            throw new Error('Orchestrator node not found');
        }

        console.log(orchestratorNode);

        // 3. CREACIÓN DEL PROMPT DINÁMICO
        // En lugar de texto fijo, usamos la data que viene de la DB
        const dynamicPrompt = ChatPromptTemplate.fromMessages([
            ["system", orchestratorNode.data.systemPrompt], // <--- Viene de config en DB
            new MessagesPlaceholder("history"),
            ["human", "{input}"],
        ]);

        // 3. La "Chain" (Tubería de ejecución)
        const chain = dynamicPrompt.pipe(this.model).pipe(new StringOutputParser());

        // 4. Ejecución con historial persistente en Postgres
        const result = await chain.invoke({
            input: userMessage,
            history: await this.getHistory(chatId) // Recupera contexto previo
        });

        // 5. GUARDAR el nuevo mensaje en la historia (Importante para que no se pierda)
        const history = new PostgresChatMessageHistory({
            tableName: "chat_history",
            sessionId: chatId,
            pool: this.pool,
        });
        await history.addMessage(new HumanMessage(userMessage));
        await history.addMessage(new AIMessage(result));

        return result;
    }

    private async getHistory(chatId: string) {
        const history = new PostgresChatMessageHistory({
            tableName: "chat_history",
            sessionId: chatId,
            pool: this.pool, // El Pool de pg que configuramos antes
        });

        // Retorna los mensajes en un formato que el MessagesPlaceholder entiende
        return await history.getMessages();
    }

    async onModuleDestroy() {
        await this.pool.end();
    }
}
