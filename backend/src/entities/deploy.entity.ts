import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('deploy')
export class Deploy {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workflow_id' })
    workflowId: string;

    @ManyToOne(() => Workflow)
    @JoinColumn({ name: 'workflow_id' })
    workflow: Workflow;

    @Column({ name: 'version_id' })
    versionId: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'deployed_at' })
    deployedAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    configSnapshot: any; // Optional: store a snapshot of the graph at deployment time
}
