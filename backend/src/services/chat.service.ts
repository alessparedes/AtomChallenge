import { Injectable } from '@nestjs/common';

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { WorkflowService } from './workflow.service';
import { MemoryService } from './memory.service';
import { WorkflowOrchestratorService } from './workflow-orchestrator.service';

@Injectable()
export class ChatService {
    private model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 });

    constructor(
        private readonly workflowService: WorkflowService,
        private readonly memoryService: MemoryService,
        private readonly orchestrator: WorkflowOrchestratorService) { }

    async processMessage(userId: string, message: string) {
        // 1️⃣ Obtener memoria
        const memory = await this.memoryService.get(userId);

        const context = memory?.context ?? {};

        // 2️⃣ Ejecutar workflow
        const result = await this.orchestrator.execute({
            userId,
            message,
            context,
        });

        // 3️⃣ Guardar nueva memoria
        await this.memoryService.save(userId, result.updatedContext);

        return result.response;
    }
}
