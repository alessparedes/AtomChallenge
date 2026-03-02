import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { envs } from './envs.conf';
import { Appointment } from 'src/entities/appointment.entity';
import { EdgeEntity } from 'src/entities/edges.entity';
import { ConversationMemory } from 'src/entities/memory.entity';
import { NodeEntity } from 'src/entities/node.entity';
import { Workflow } from 'src/entities/workflow.entity';
import { NodeType } from 'src/entities/nodetype.entity';
import { ExecutionLog } from 'src/entities/execution-log.entity';
import { Deploy } from 'src/entities/deploy.entity';
import { Session } from 'src/entities/session.entity';

export const getPostgresConfig = (): TypeOrmModuleOptions => {
    return {
        type: 'postgres',
        host: envs.PG_HOST,
        port: envs.PG_PORT,
        username: envs.PG_USER,
        password: envs.PG_PASSWORD,
        database: envs.PG_DB,
        entities: [Appointment, EdgeEntity, ConversationMemory, NodeEntity, Workflow, NodeType, ExecutionLog, Deploy, Session],
        autoLoadEntities: true,
        synchronize: true,
        // Mostrar consultas SQL
        // 👇 AGREGA ESTO: AUMENTAR EL POOL
        extra: {
            max: 50, // "Abre 50 cajas registradoras en lugar de 10"
            connectionTimeoutMillis: 5000, // Si en 5s no hay caja, da error (mejor que esperar 13s)
            timezone: 'America/Guatemala',
            options: '-c timezone=America/Guatemala'
        },
        logging: envs.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    };
};