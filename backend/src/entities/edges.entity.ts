import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('edges')
export class EdgeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    source: string; // sourceNodeId

    @Column()
    target: string; // targetNodeId

    @ManyToOne(() => Workflow, (w) => w.edges)
    workflow: Workflow;
}