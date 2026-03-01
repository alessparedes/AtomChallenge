import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConversationMemory } from 'src/entities/memory.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MemoryService {
    constructor(
        @InjectRepository(ConversationMemory) private readonly converRepo: Repository<ConversationMemory>) { }

    async get(userId: string) {
        return this.converRepo.findOne({
            where: { userId },
        });
    }

    async save(userId: string, context: any) {
        return this.converRepo.upsert(
            { userId, context },
            { conflictPaths: ['userId'] }
        );
    }
}
