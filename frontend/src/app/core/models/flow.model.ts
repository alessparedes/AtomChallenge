export type FlowStatus = 'Draft' | 'Published' | 'Archived';

export interface AgentFlow {
    id: string;
    name: string;
    description: string;
    DateCreate: Date;
    lastModified: Date;
    status: FlowStatus;
    DateDeploy?: Date;
    // Metadata for the designer
    graphJSON?: string;
}
