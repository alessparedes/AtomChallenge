import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import * as autosData from '../data-json/autos.json';
import * as faqData from '../data-json/faq.json';
import * as datesData from '../data-json/dates.json';

@Injectable()
export class ExecutionService {
    constructor(private readonly workflowService: WorkflowService) { }

    async execute(agentId: string, message: string, sessionId?: string) {
        // 1. Fetch the published flow
        const workflow = await this.workflowService.findOne(agentId);
        if (workflow.isActive === false) {
            throw new NotFoundException('Agente no activo');
        }

        const logs: string[] = [];
        logs.push(`[Agent: ${workflow.name}] -> Start session: ${sessionId || 'new'}`);

        // 2. Identify the core intent (mocking Orchestrator logic)
        logs.push(`[Agent: ${workflow.name}] -> Executing Node: Orchestrator`);

        let response = "";
        const lowerMsg = message.toLowerCase();

        // 3. Simulation Logic
        if (workflow.name.toLowerCase().includes('faq')) {
            logs.push(`[Agent: ${workflow.name}] -> Result: Intent 'FAQSearch'`);
            const entry = (faqData as any).find(f => lowerMsg.includes(f.pregunta.toLowerCase()) || f.pregunta.toLowerCase().includes(lowerMsg));
            response = entry ? entry.respuesta : "Lo siento, no encontré información sobre esa pregunta frecuente.";
            logs.push(`[Agent: ${workflow.name}] -> Executing Node: Specialist (Knowledge Base)`);
        } else if (workflow.name.toLowerCase().includes('venta') || workflow.name.toLowerCase().includes('autos')) {
            logs.push(`[Agent: ${workflow.name}] -> Result: Intent 'CatalogSearch'`);
            logs.push(`[Agent: ${workflow.name}] -> Executing Node: Validator -> Extracting criteria...`);

            // Mock validator extraction
            const autos = (autosData as any);
            const matches = autos.filter(a => lowerMsg.includes(a.marca.toLowerCase()) || lowerMsg.includes(a.modelo.toLowerCase())).slice(0, 3);

            if (matches.length > 0) {
                response = `He encontrado estos autos que podrían interesarte: ${matches.map(m => `${m.marca} ${m.modelo} (${m.precio})`).join(', ')}.`;
            } else {
                response = "Actualmente no tenemos autos que coincidan con esa búsqueda, pero te sugiero ver nuestro catálogo completo.";
            }
            logs.push(`[Agent: ${workflow.name}] -> Executing Node: Specialist (Inventory)`);
        } else if (workflow.name.toLowerCase().includes('cita') || workflow.name.toLowerCase().includes('agenda')) {
            logs.push(`[Agent: ${workflow.name}] -> Result: Intent 'AppointmentBooking'`);
            logs.push(`[Agent: ${workflow.name}] -> Executing Node: Validator -> Validating availability...`);

            const dates = (datesData as any);
            const available = dates.find(d => d.disponible === true);
            response = available ? `Tenemos disponibilidad el ${available.fecha} a las ${available.hora}. ¿Te anoto?` : "Por ahora no tenemos citas disponibles próximamente.";
            logs.push(`[Agent: ${workflow.name}] -> Executing Node: Tool (Scheduler)`);
        } else {
            // Default Fallback
            logs.push(`[Agent: ${workflow.name}] -> Result: Intent 'GenericConversation'`);
            response = `Hola! Soy ${workflow.name}. Recibí tu mensaje: "${message}". ¿En qué puedo ayudarte hoy?`;
        }

        return {
            response,
            logs,
            sessionId: sessionId || `sess_${Date.now()}`
        };
    }
}
