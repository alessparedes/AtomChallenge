import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWorkflowDto } from 'src/dtos/createWorkflow.dto';
import { EdgeEntity } from 'src/entities/edges.entity';
import { NodeEntity } from 'src/entities/node.entity';
import { NodeType } from 'src/entities/nodetype.entity';
import { Workflow } from 'src/entities/workflow.entity';
import { Repository } from 'typeorm';
import { Deploy } from 'src/entities/deploy.entity';

@Injectable()
export class WorkflowService {
    constructor(
        @InjectRepository(Workflow) private repo: Repository<Workflow>,
        @InjectRepository(NodeEntity) private nodeRepo: Repository<NodeEntity>,
        @InjectRepository(EdgeEntity) private edgeRepo: Repository<EdgeEntity>,
        @InjectRepository(Deploy) private deployRepo: Repository<Deploy>
    ) { }

    async create(dto: CreateWorkflowDto) {
        // 1. Creamos la cabecera del workflow primero para obtener su ID
        const newWorkflow = this.repo.create({
            name: dto.name,
            isActive: dto.isActive
        });
        const savedWorkflow = await this.repo.save(newWorkflow);

        const count = await this.repo.count({ where: { isActive: true } });
        // 2. Ahora creamos los nodos asignándoles ese workflowId
        const nodes = dto.nodes.map(n => ({
            id: `${n.id}_${count}`, // "node_input_1"
            workflow: savedWorkflow, // Aquí vinculamos la llave compuesta
            nodeType: { code: n.type },
            config: n.data,
            positionX: n.position.x,
            positionY: n.position.y
        }));

        // 3. Mapear Edges vinculándolos al workflow
        const edges = dto.edges.map((e) => ({
            workflow: savedWorkflow,
            source: `${e.source}_${count}`,
            target: `${e.target}_${count}`,
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

    async duplicate(id: string) {
        // 1. Fetch original including relations
        const original = await this.repo.findOne({
            where: { id },
            relations: ['nodes', 'nodes.nodeType', 'edges']
        });

        if (!original) {
            throw new NotFoundException(`Flujo con id ${id} no encontrado`);
        }

        // 2. Create the duplicated workflow container
        const duplicatedWorkflow = this.repo.create({
            name: `${original.name} (copia)`,
            isActive: original.isActive
        });
        const savedWorkflow = await this.repo.save(duplicatedWorkflow);

        // 3. Generate a safe unique suffix for relations inside this copy
        const suffix = Date.now().toString().slice(-6);

        // Map original node IDs to new duplicate IDs so edges can still link them together
        const idMap = new Map<string, string>();

        // 4. Duplicate Nodes
        if (original.nodes && original.nodes.length > 0) {
            const duplicatedNodes = original.nodes.map(n => {
                // n.id is usually Semantic + suffix in DB, e.g. "node_input_1_xxxx"
                const newId = `${n.id}_copy_${suffix}`;
                idMap.set(n.id, newId);

                return this.nodeRepo.create({
                    id: newId,
                    workflow: savedWorkflow,
                    nodeType: n.nodeType,
                    config: n.config,
                    positionX: n.positionX,
                    positionY: n.positionY
                });
            });
            await this.nodeRepo.save(duplicatedNodes);
        }

        // 5. Duplicate Edges maintaining relations
        if (original.edges && original.edges.length > 0) {
            const duplicatedEdges = original.edges.map(e => {
                return this.edgeRepo.create({
                    workflow: savedWorkflow,
                    source: idMap.get(e.source) || `${e.source}_copy_${suffix}`,
                    target: idMap.get(e.target) || `${e.target}_copy_${suffix}`
                });
            });
            await this.edgeRepo.save(duplicatedEdges);
        }

        // Return the full newly duplicated flow
        return await this.findOne(savedWorkflow.id);
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

    async rename(id: string, name: string) {
        const workflow = await this.repo.findOne({ where: { id } });
        if (!workflow) throw new NotFoundException('Workflow no encontrado');

        workflow.name = name;
        await this.repo.save(workflow);

        return this.findOne(id);
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
        await this.nodeRepo.delete({ workflow: { id: workflow.id } });
        await this.edgeRepo.delete({ workflow: { id: workflow.id } });

        // Generamos un sufijo único de timestamp para que las IDs enviadas desde 
        // el frontend no colisionen al reinsertarse en esta misma transacción.
        const suffix = Date.now().toString().slice(-6);

        // 4. Mapear los nuevos Nodos
        const newNodes = dto.nodes.map((n) => {
            const nodeId = n.id || `temp_${suffix}_${Math.random()}`;
            return {
                id: nodeId.includes('_') ? nodeId : `${nodeId}_${suffix}`,
                workflow: updatedWorkflow,
                nodeType: { code: n.type },
                config: n.data, // Mantenemos el mapeo data -> config
                positionX: n.position.x,
                positionY: n.position.y,
            };
        });

        // 5. Mapear los nuevos Edges
        const newEdges = dto.edges.map((e) => ({
            workflow: updatedWorkflow,
            source: e.source.includes('_') ? e.source : `${e.source}_${suffix}`,
            target: e.target.includes('_') ? e.target : `${e.target}_${suffix}`,
        }));

        // 6. Guardar la nueva estructura
        await this.nodeRepo.save(newNodes);
        await this.edgeRepo.save(newEdges);

        // Retornamos el workflow actualizado con su nuevo formato
        return this.findOne(updatedWorkflow.id);
    }

    async getPublished() {
        const deployments = await this.deployRepo.find({
            where: { isActive: true },
            relations: ['workflow']
        });

        return deployments.map(d => ({
            id: d.workflow.id,
            name: d.workflow.name,
            versionId: d.versionId,
            deployedAt: d.deployedAt,
        }));
    }

    async publish(id: string) {
        const workflow = await this.repo.findOne({
            where: { id },
            relations: ['nodes', 'edges']
        });
        if (!workflow) throw new NotFoundException('Workflow no encontrado');

        const versionId = (globalThis as any).crypto?.randomUUID() || `v_${Date.now()}`;

        // Deactivate previous active deployments for this workflow
        await this.deployRepo.update({ workflowId: id }, { isActive: false });

        // Create new deployment record
        const deployment = this.deployRepo.create({
            workflowId: id,
            versionId,
            isActive: true,
            configSnapshot: {
                nodes: workflow.nodes,
                edges: workflow.edges
            }
        });
        await this.deployRepo.save(deployment);

        // Also update the main workflow status for the dashboard
        workflow.status = 'published';
        await this.repo.save(workflow);

        return this.findOne(id);
    }
    async getActiveDeployment(workflowId: string) {
        return await this.deployRepo.findOne({
            where: { workflowId, isActive: true },
            relations: ['workflow']
        });
    }
}
