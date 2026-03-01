import { Body, Controller, Param, Post } from '@nestjs/common';
import { TelegramService } from 'src/services/telegram.service';
import { WorkflowEngineService } from 'src/services/workflow-engine.service';

@Controller('telegram')
export class TelegramController {
    constructor(private readonly engine: WorkflowEngineService) { }

    @Post(':workflowId')
    async handleUpdate(
        @Param('workflowId') workflowId: string,
        @Body() body: { message: string, sessionId: string }) {
        return this.engine.executeStep(workflowId, body.message, body.sessionId);
    }
}
