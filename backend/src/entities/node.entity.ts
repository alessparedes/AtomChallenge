import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Workflow } from './workflow.entity';
import { NodeType } from './nodetype.entity';

@Entity('nodes')
export class NodeEntity {
    @PrimaryColumn()
    id: string;

    @Column({ name: 'typeCode' })
    typeCode: string;

    @ManyToOne(() => NodeType)
    @JoinColumn({ name: 'typeCode' })
    nodeType: NodeType;

    @Column({ type: 'jsonb', nullable: true })
    config: any;

    @Column('float')
    positionX: number;

    @Column('float')
    positionY: number;

    @ManyToOne(() => Workflow, (w) => w.nodes)
    workflow: Workflow;
}