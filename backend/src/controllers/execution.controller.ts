import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ExecutionService } from '../services/execution.service';

@Controller('execute')
export class ExecutionController {
    constructor(private readonly executionService: ExecutionService) { }

    @Post(':agentId')
    async execute(
        @Param('agentId') agentId: string,
        @Body() body: { message: string; sessionId?: string }
    ) {
        return await this.executionService.execute(agentId, body.message, body.sessionId);
    }
}
