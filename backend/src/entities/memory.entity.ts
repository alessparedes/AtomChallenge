import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('conversation_memory')
export class ConversationMemory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    workflowId: string;

    @Column({ type: 'jsonb', nullable: true })
    context: any;

    @UpdateDateColumn()
    updatedAt: Date;
}