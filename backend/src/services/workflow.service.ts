import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWorkflowDto } from 'src/dtos/createWorkflow.dto';
import { EdgeEntity } from 'src/entities/edges.entity';
import { NodeEntity } from 'src/entities/node.entity';
import { NodeType } from 'src/entities/nodetype.entity';
import { Workflow } from 'src/entities/workflow.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkflowService {
    constructor(
        @InjectRepository(Workflow) private repo: Repository<Workflow>,
        @InjectRepository(NodeEntity) private nodeRepo: Repository<NodeEntity>,
        @InjectRepository(EdgeEntity)
        private readonly edgeRepo: Repository<EdgeEntity>
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

        // 3. Mapear Edges vinculándolos al workflow
        const edges = dto.edges.map((e) => ({
            workflow: savedWorkflow,
            source: e.source,
            target: e.target,
        }));
        // 3. Guardamos los nodos (puedes usar el repo de NodeEntity directamente)
        await this.nodeRepo.save(nodes);
        await this.edgeRepo.save(edges);


        return this.findOne(savedWorkflow.id);
    }

    async findAll() {
        return await this.repo.find({
            where: { isActive: true },
            relations: ['nodes', 'nodes.nodeType', 'edges'],
        });
    }

    async findOne(id: string) {
        const workflow = await this.repo.findOne({
            where: { id, isActive: true },
            relations: ['nodes', 'nodes.nodeType', 'edges'],
        });

        if (!workflow) {
            throw new NotFoundException(`Workflow con ID ${id} no encontrado`);
        }

        // Formateo manual para que coincida exactamente con tu JSON esperado en el frontend
        return {
            id: workflow.id,
            name: workflow.name,
            isActive: workflow.isActive,
            nodes: workflow.nodes.map((n) => ({
                id: n.id,
                type: n.nodeType.code, // Retornamos el código del tipo (ej: 'orchestrator')
                position: { x: n.positionX, y: n.positionY },
                data: n.config,
            })),
            edges: workflow.edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
            })),
        };
    }

    async remove(id: string) {
        const workflow = await this.repo.findOne({ where: { id } });
        if (!workflow) throw new NotFoundException('Workflow no encontrado');

        workflow.isActive = false;
        await this.repo.save(workflow);

        return {
            message: 'Workflow desactivado correctamente',
            id: workflow.id
        };
    }

    /**
       * Actualiza un workflow completo: sincroniza nodos y edges.
       */
    async update(id: string, dto: CreateWorkflowDto) {
        // 1. Verificar que el workflow exista
        const workflow = await this.repo.findOne({
            where: { id },
            relations: ['nodes', 'edges'],
        });

        if (!workflow) {
            throw new NotFoundException(`Workflow con ID ${id} no encontrado`);
        }

        // 2. Actualizar datos básicos de la cabecera
        workflow.name = dto.name;
        workflow.isActive = dto.isActive ?? workflow.isActive;
        const updatedWorkflow = await this.repo.save(workflow);

        // 3. Limpiar nodos y edges anteriores para evitar duplicados o huérfanos
        // Al usar llaves compuestas, es más seguro resetear el estado del flujo
        await this.nodeRepo.delete({ workflow });
        await this.edgeRepo.delete({ workflow });

        // 4. Mapear los nuevos Nodos
        const newNodes = dto.nodes.map((n) => ({
            id: n.id,
            workflow: updatedWorkflow,
            typeCode: n.type,
            config: n.data, // Mantenemos el mapeo data -> config
            positionX: n.position.x,
            positionY: n.position.y,
        }));

        // 5. Mapear los nuevos Edges
        const newEdges = dto.edges.map((e) => ({
            workflow: updatedWorkflow,
            source: e.source,
            target: e.target,
        }));

        // 6. Guardar la nueva estructura
        await this.nodeRepo.save(newNodes);
        await this.edgeRepo.save(newEdges);

        // Retornamos el workflow actualizado con su nuevo formato
        return this.findOne(updatedWorkflow.id);
    }
}
