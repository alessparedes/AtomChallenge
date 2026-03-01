import { AgentFlow } from '../models/flow.model';

export const MOCK_FLOWS: AgentFlow[] = [
    {
        id: 'f1',
        name: 'Asesor de Ventas - Catálogo',
        description: 'Agente especializado en buscar y recomendar vehículos del catálogo.',
        createdAt: new Date('2026-02-15T10:00:00'),
        lastModified: new Date('2026-02-28T14:30:00'),
        status: 'Published',
        isActive: true,
        DateDeploy: new Date('2026-02-28T15:00:00'),
        nodes: [],
        edges: []
    },
    {
        id: 'f2',
        name: 'Soporte General - FAQs',
        description: 'Agente conversacional que responde dudas generales leyendo faq.json.',
        createdAt: new Date('2026-03-01T08:00:00'),
        lastModified: new Date('2026-03-01T09:15:00'),
        status: 'Draft',
        isActive: true,
        nodes: [],
        edges: []
    },
    {
        id: 'f3',
        name: 'Gestor de Citas Automotriz',
        description: 'Programa y verifica slots en dates.json para servicios.',
        createdAt: new Date('2026-02-20T11:00:00'),
        lastModified: new Date('2026-02-25T16:45:00'),
        status: 'Published',
        isActive: true,
        DateDeploy: new Date('2026-02-26T10:00:00'),
        nodes: [],
        edges: []
    },
    {
        id: 'f4',
        name: 'Test Agent V2',
        description: 'Agente en pruebas para nuevas validaciones.',
        createdAt: new Date('2026-03-01T10:00:00'),
        lastModified: new Date('2026-03-01T10:30:00'),
        status: 'Draft',
        isActive: true,
        nodes: [],
        edges: []
    }
];
