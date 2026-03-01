import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getPostgresConfig } from './config/database.conf';
import { InventoryServiceTsService } from './services/inventory.service';
import { WorkflowService } from './services/workflow.service';
import { WorkflowsController } from './controllers/workflows.controller';
import { Workflow } from './entities/workflow.entity';
import { NodeEntity } from './entities/node.entity';
import { EdgeEntity } from './entities/edges.entity';
import { NodeType } from './entities/nodetype.entity';
import { ChatService } from './services/chat.service';
import { TelegramService } from './services/telegram.service';
import { MemoryService } from './services/memory.service';
import { ConversationMemory } from './entities/memory.entity';
import { WorkflowOrchestratorService } from './services/workflow-orchestrator.service';
import { TelegramController } from './controllers/telegram.controller';
import { WorkflowEngineService } from './services/workflow-engine.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      getPostgresConfig()
    ),
    TypeOrmModule.forFeature([Workflow, NodeEntity, EdgeEntity, NodeType, ConversationMemory])
  ],
  controllers: [AppController, WorkflowsController, TelegramController],
  providers: [AppService, InventoryServiceTsService, WorkflowService, ChatService, TelegramService, MemoryService, WorkflowOrchestratorService, WorkflowEngineService],
})
export class AppModule { }
