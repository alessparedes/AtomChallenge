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
import { Session } from './entities/session.entity';
import { ExecutionController } from './controllers/execution.controller';
import { ExecutionService } from './services/execution.service';
import { Deploy } from './entities/deploy.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      getPostgresConfig()
    ),
    TypeOrmModule.forFeature([Workflow, NodeEntity, EdgeEntity, NodeType, ConversationMemory, Session, Deploy])
  ],
  controllers: [AppController, WorkflowsController, TelegramController, ExecutionController],
  providers: [AppService, InventoryServiceTsService, WorkflowService, ChatService, TelegramService, MemoryService, WorkflowOrchestratorService, WorkflowEngineService, ExecutionService],
})
export class AppModule { }
