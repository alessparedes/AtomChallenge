import { Injectable } from '@nestjs/common';
import * as autos from '../data-json/autos_normalized.json';
import * as faq from '../data-json/faq.json';

@Injectable()
export class InventoryServiceTsService {
    // Tool para el Agente Especialista de Catálogo
    findCars(budget?: number, type?: string) {
        return autos.filter(car =>
            (!budget || car.precio <= budget) &&
            (!type || car.tipo_de_combustible.toLowerCase() === type.toLowerCase())
        );
    }

    // Tool para el Agente de Consultas Generales (RAG simple)
    findFaq(question: string) {
        // Aquí puedes usar una búsqueda simple por palabras clave 
        // o comparativa de texto para simular la IA buscando en el manual.
        return {} // faq.find(f => question.toLowerCase().includes(f.preguntas.toLowerCase()));
    }
}
