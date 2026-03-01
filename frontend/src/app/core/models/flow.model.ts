export type FlowStatus = 'Draft' | 'Published' | 'Archived';

// Maps exactly to Workflow Entity
export interface AgentFlow {
    id: string; // UUID from DB
    name: string;
    isActive: boolean; // Map to true from DB
    createdAt: Date;
    nodes: NodeEntity[];
    edges: EdgeEntity[];

    // Frontend specific flags for UI compatibility
    status?: FlowStatus;
    DateDeploy?: Date;
    lastModified?: Date;
    description?: string;
}

export interface NodeEntity {
    id: string; // Internal id given by the Ngx-Graph/CDK
    positionX: number;
    positionY: number;
    config: any; // JSONB config
    nodeType: {
        typeCode: string;
    } | string; 
    // ^ string to easily pass typeCode to DB when creating, 
    // or object when retrieving from relation
}

export interface EdgeEntity {
    id?: string;
    source: string; // Node ID
    target: string; // Node ID
}
