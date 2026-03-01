import { Injectable } from '@nestjs/common';
import * as autos from '../data-json/autos_normalized.json';
import * as faqData from '../data-json/faq.json';

@Injectable()
export class InventoryServiceTsService {
    getFaqResponse(questionId: number): string {
        // Buscamos en todas las categorías del JSON
        for (const categoria of faqData) {
            const preguntaEncontrada = categoria.preguntas.find(p => p.id === questionId);

            if (preguntaEncontrada) {
                return preguntaEncontrada.respuesta; // Retorna la respuesta real del JSON
            }
        }

        return "Lo siento, no encontré una respuesta específica para esa consulta.";
    }

    // Caso de Uso 2: Catálogo de Vehículos
    async searchCatalog(filters: { maxPrice?: number, segment?: string }) {
        return autos.filter(carro => {
            const matchPrice = filters.maxPrice ? carro.precio <= filters.maxPrice : true;
            const matchSegment = filters.segment ? carro.segmento === filters.segment : true;
            return matchPrice && matchSegment;
        });
    }
}
