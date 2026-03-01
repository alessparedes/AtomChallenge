import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    nombre: string;

    @Column()
    fecha: string;

    @Column()
    hora: string;

    @Column()
    motivo: string;

    @Column()
    vehiculo: string;

    @CreateDateColumn()
    createdAt: Date;
}