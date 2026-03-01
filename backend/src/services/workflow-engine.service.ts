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
        // 1. Cargamos TODO el flujo desde la DB
        const workflow = await this.workflowService.findOne(workflowId);

        // 2. Buscamos el nodo actual (empezando por el Orquestador)
        const orchestratorNode = workflow.nodes.find(n => n.type === 'orchestrator');

        if (!orchestratorNode) {
            throw new Error('Orchestrator node not found');
        }


        // 2. Preparamos el contexto de conocimiento (RAG Básico)
        // Esto inyecta tus JSONs para que la IA los use como "Especialista"
        const knowledgeContext = `
    CATALOGO_VEHICULOS: ${JSON.stringify(vehiculosData).replace(/{/g, '{{').replace(/}/g, '}}')}
    PREGUNTAS_FRECUENTES: ${JSON.stringify(faqData).replace(/{/g, '{{').replace(/}/g, '}}')}
`;


        // 3. Creación del Prompt Dinámico
        // Combinamos el systemPrompt de la DB con las reglas de negocio y los datos JSON
        const dynamicPrompt = ChatPromptTemplate.fromMessages([
            [
                "system",
                `${orchestratorNode.data.systemPrompt}
        
        ### FUENTE DE DATOS (JSON):
        ${knowledgeContext}
        
        ### REGLAS DE NEGOCIO POR CASO:
        - Si detectas CASO_GENERAL: Valida antes de responder si es cliente nuevo, asalariado y su edad.
        - Si detectas CATALOGO: Valida presupuesto, estado (nuevo/usado) y tipo de vehículo.
        - Si detectas AGENDAMIENTO: Valida nombre, fecha y motivo.
        
        Instrucción: Si faltan datos de validación, solicítalos. Si están completos, usa los arreglos de objetos anteriores para dar una respuesta precisa.`
            ],
            new MessagesPlaceholder("history"),
            ["human", "{input}"],
        ]);

        // 4. Tubería de ejecución
        const chain = dynamicPrompt.pipe(this.model).pipe(new StringOutputParser());

        // 5. Recuperar historial previo (Memoria Persistente +5 pts)
        const historyMessages = await this.getHistory(chatId);

        // 6. Ejecución de la IA
        const result = await chain.invoke({
            input: userMessage,
            history: historyMessages
        });

        // 7. Guardar en PostgreSQL para persistencia entre sesiones
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
