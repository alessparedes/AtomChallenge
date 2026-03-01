import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CreateWorkflowDto } from 'src/dtos/createWorkflow.dto';
import { WorkflowService } from 'src/services/workflow.service';

@Controller('workflows')
export class WorkflowsController {
    constructor(private readonly workflowService: WorkflowService) { }

    @Post()
    async create(@Body() createWorkflowDto: CreateWorkflowDto) {
        return await this.workflowService.create(createWorkflowDto);
    }

    @Get()
    async findAll() {
        return await this.workflowService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.workflowService.findOne(id);
    }

    @Post(':id/duplicate')
    async duplicate(@Param('id') id: string) {
        return await this.workflowService.duplicate(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateWorkflowDto: CreateWorkflowDto
    ) {
        return this.workflowService.update(id, updateWorkflowDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.workflowService.remove(id);
    }
}
