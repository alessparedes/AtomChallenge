import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateWorkflowDto } from 'src/dtos/createWorkflow.dto';
import { WorkflowService } from 'src/services/workflow.service';

@Controller('workflows')
export class WorkflowsController {
    constructor(private readonly workflowService: WorkflowService) { }

    @Post()
    async create(@Body() createWorkflowDto: CreateWorkflowDto) {
        return await this.workflowService.create(createWorkflowDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.workflowService.findOne(id);
    }
}
