import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { NodeEntity } from "./node.entity";

@Entity('node_types')
export class NodeType {
    @PrimaryColumn()
    code: string; // Ej: 'orchestrator', 'memory', 'tool'

    @Column()
    label: string; // Ej: 'Agente Orquestador'

    @Column({ nullable: true })
    icon: string; // Clase de icono o URL

    @Column({ type: 'jsonb', nullable: true })
    defaultConfig: any; // La estructura inicial del campo 'data'

    @OneToMany(() => NodeEntity, (node) => node.nodeType)
    nodes: NodeEntity[];
}