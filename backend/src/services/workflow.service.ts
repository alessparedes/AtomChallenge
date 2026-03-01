import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWorkflowDto } from 'src/dtos/createWorkflow.dto';
import { NodeEntity } from 'src/entities/node.entity';
import { Workflow } from 'src/entities/workflow.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkflowService {
    constructor(
        @InjectRepository(Workflow) private repo: Repository<Workflow>,
        @InjectRepository(NodeEntity) private nodeRepo: Repository<NodeEntity>,
    ) { }

    async create(dto: CreateWorkflowDto) {
        // 1. Creamos la cabecera del workflow primero para obtener su ID
        const newWorkflow = this.repo.create({
            name: dto.name,
            isActive: dto.isActive
        });
        const savedWorkflow = await this.repo.save(newWorkflow);



        // 2. Ahora creamos los nodos asignándoles ese workflowId
        const nodes = dto.nodes.map(n => ({
            id: n.id, // "node_input_1"
            workflow: savedWorkflow, // Aquí vinculamos la llave compuesta
            nodeType: { code: n.type },
            config: n.data,
            positionX: n.position.x,
            positionY: n.position.y
        }));
        console.log(nodes);
        // 3. Guardamos los nodos (puedes usar el repo de NodeEntity directamente)
        await this.nodeRepo.save(nodes);

        return this.findOne(savedWorkflow.id);
    }

    async findOne(id: string) {
        const w = await this.repo.findOne({
            where: { id },
            relations: ['nodes', 'edges']
        });

        // Formateamos para que coincida exactamente con tu JSON esperado
        return {
            id: w?.id,
            name: w?.name,
            isActive: w?.isActive,
            nodes: w?.nodes.map(n => ({
                id: n.id,
                type: n?.nodeType?.code,
                position: { x: n.positionX, y: n.positionY },
                data: n.config
            })),
            edges: w?.edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target
            }))
        };
    }
}
