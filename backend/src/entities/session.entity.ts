import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('sessions')
export class Session {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Workflow)
    workflow: Workflow;

    @Column({ type: 'jsonb', default: {} })
    memory: any;

    @CreateDateColumn()
    createdAt: Date;
}
