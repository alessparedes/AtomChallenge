import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'execution_logs' }) //
export class ExecutionLog {
    @PrimaryGeneratedColumn()
    id: number; //

    @Column({ name: 'workflow_id', type: 'text' })
    workflowId: string; //

    @Column({ name: 'session_id', type: 'text' })
    sessionId: string; //

    @Column({ name: 'node_id', type: 'text' })
    nodeId: string; //

    @Column({ name: 'node_type', type: 'text' })
    nodeType: string; //

    @Column({ name: 'input_received', type: 'text', nullable: true })
    inputReceived: string; //

    @Column({ name: 'output_generated', type: 'text', nullable: true })
    outputGenerated: string; //

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date; //
}