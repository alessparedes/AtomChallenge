import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getPostgresConfig } from './config/database.conf';
import { WorkflowService } from './services/workflow.service';
import { WorkflowsController } from './controllers/workflows.controller';
import { Workflow } from './entities/workflow.entity';
import { NodeEntity } from './entities/node.entity';
import { EdgeEntity } from './entities/edges.entity';
import { NodeType } from './entities/nodetype.entity';
import { TelegramService } from './services/telegram.service';
import { ConversationMemory } from './entities/memory.entity';
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
  controllers: [AppController, WorkflowsController, TelegramController],
  providers: [AppService, WorkflowService, TelegramService, WorkflowEngineService],
})
export class AppModule { }
