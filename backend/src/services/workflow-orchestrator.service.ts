import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowOrchestratorService {
    async execute(input: {
        userId: string;
        message: string;
        context: any;
    }) {
        const { message, context } = input;

        let response = '';
        const updatedContext = { ...context };

        if (message.toLowerCase().includes('carro')) {
            updatedContext.intent = 'vehicle_search';
            response = '¿Qué tipo de vehículo buscas? SUV, Sedán o Pickup?';
        } else if (context.intent === 'vehicle_search') {
            response = `Perfecto, buscando ${message} disponibles...`;
        } else {
            response = 'Hola 👋 ¿En qué puedo ayudarte?';
        }

        return { response, updatedContext };
    }
}
