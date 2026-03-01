import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { NodeEntity } from './node.entity';
import { EdgeEntity } from './edges.entity';

@Entity('workflows')
export class Workflow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => NodeEntity, (node) => node.workflow, { cascade: true })
    nodes: NodeEntity[];

    @OneToMany(() => EdgeEntity, (edge) => edge.workflow, { cascade: true })
    edges: EdgeEntity[];
}