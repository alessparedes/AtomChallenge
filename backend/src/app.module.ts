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

@Module({
  imports: [
    TypeOrmModule.forRoot(
      getPostgresConfig()
    ),
    TypeOrmModule.forFeature([Workflow, NodeEntity])
  ],
  controllers: [AppController, WorkflowsController],
  providers: [AppService, InventoryServiceTsService, WorkflowService],
})
export class AppModule { }
