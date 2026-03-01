import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ChatService } from './chat.service';
import { envs } from 'src/config/envs.conf';
import TelegramBot from 'node-telegram-bot-api';
import { WorkflowEngineService } from './workflow-engine.service';

@Injectable()
export class TelegramService implements OnModuleInit {
    private bot: TelegramBot;
    // ID del flujo que configuraste en tu editor visual
    private readonly WORKFLOW_ID = '51585965-d486-4e5c-a676-101a9eea233f';
    constructor(private readonly engine: WorkflowEngineService) {
        this.bot = new Telegraf(envs.TELEGRAM_TOKEN);
    }

    onModuleInit() {
        this.bot.on('text', async (ctx) => {
            const userMessage = ctx.message.text;
            const chatId = ctx.chat.id.toString();

            try {
                // Ejecutamos el flujo dinámico (IA + DB + Memoria)
                const aiResponse = await this.engine.executeStep(
                    this.WORKFLOW_ID,
                    userMessage,
                    chatId
                );

                await ctx.reply(aiResponse);
            } catch (error) {
                console.error('Error en el engine:', error);
                await ctx.reply('Lo siento, tuve un problema procesando tu solicitud.');
            }
        });

        this.bot.launch();
    }

    // Este método lo llama el controlador
    handleWebhookUpdate(update: any) {
        return this.bot.handleUpdate(update);
    }
}
