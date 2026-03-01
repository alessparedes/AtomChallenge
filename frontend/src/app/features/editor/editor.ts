import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlowService } from '../../core/services/flow.service';
import { AgentFlow, NodeEntity, EdgeEntity } from '../../core/models/flow.model';
import { XYFlowModule } from 'ngx-xyflow';

export type NodeType = 'trigger' | 'memory' | 'orchestrator' | 'validator' | 'specialist' | 'tool';

export interface FlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, XYFlowModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnInit {
  private flowService = inject(FlowService);
  private route = inject(ActivatedRoute);

  // UI State
  flowId = signal<string | null>(null);
  isSaving = signal<boolean>(false);
  lastSaved = signal<Date | null>(new Date());

  // Node Types Catalog (Toolbox)
  nodeTypes = [
    { type: 'trigger', label: 'Trigger', icon: 'zap', color: 'bg-blue-500', desc: 'Inicia el flujo' },
    { type: 'memory', label: 'Memoria', icon: 'database', color: 'bg-purple-500', desc: 'Contexto de sesión' },
    { type: 'orchestrator', label: 'Orquestador', icon: 'git-branch', color: 'bg-rose-500', desc: 'Ruta e intención' },
    { type: 'validator', label: 'Validador', icon: 'check-square', color: 'bg-amber-500', desc: 'Reglas de negocio' },
    { type: 'specialist', label: 'Especialista', icon: 'bot', color: 'bg-emerald-500', desc: 'Agente LLM' },
    { type: 'tool', label: 'Tool / JSON', icon: 'code', color: 'bg-teal-500', desc: 'Llamada externa' }
  ];

  // Canvas State
  nodes = signal<FlowNode[]>([]);
  edges = signal<FlowEdge[]>([]);

  selectedNode = signal<FlowNode | null>(null);

  constructor() { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.flowId.set(id);
    if (id) {
      this.flowService.loadFlowById(id).subscribe({
        next: (flow: AgentFlow | null) => {
          // Map DB nodes to ui schema
          if (flow && flow.nodes) {
            const mappedNodes = flow.nodes.map((n: NodeEntity) => ({
              id: n.id,
              type: typeof n.nodeType === 'string' ? n.nodeType : (n.nodeType?.typeCode || 'specialist'),
              position: { x: n.positionX, y: n.positionY },
              data: {
                title: n.config?.title || 'Node',
                subtitle: n.config?.subtitle || '',
                config: n.config
              }
            }));
            // Set loaded nodes
            this.nodes.set(mappedNodes);
          } else {
            this.nodes.set([]); // empty canvas
          }
        },
        error: (err: any) => console.error('Error fetching flow:', err)
      });
    }
  }

  // Native HTML5 Drag & Drop
  onDragStart(event: DragEvent, nodeType: any) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/xyflow', JSON.stringify(nodeType));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDropCanvas(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) return;
    const nodeTypeStr = event.dataTransfer.getData('application/xyflow');
    if (!nodeTypeStr) return;

    const nodeType = JSON.parse(nodeTypeStr);

    // Use currentTarget to guarantee we are measuring the Canvas container, not internal SVGs
    const target = event.currentTarget as HTMLElement;
    const bounds = target.getBoundingClientRect();

    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };

    const newNode: FlowNode = {
      id: 'node-' + Date.now(),
      type: nodeType.type,
      position,
      data: {
        title: 'Nuevo ' + nodeType.label,
        subtitle: '',
        ...nodeType
      }
    };

    this.nodes.update(ns => [...ns, newNode]);
    this.selectNode(newNode);
  }

  // Node Selection
  selectNode(node: FlowNode | null) {
    this.selectedNode.set(node);
  }

  onNodeClick(event: any, node: any) {
    // Handling ngx-xyflow event pattern
    this.selectNode(node);
  }

  onPaneClick() {
    this.selectNode(null);
  }

  // Handle Edges Connections
  onConnect(connection: any) {
    const newEdge: FlowEdge = {
      id: `e-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      type: 'default' // Add standard edge type or keep plain
    };

    this.edges.update(eds => [...eds, newEdge]);
  }

  // Properties Update
  updateNodeProperty(field: string, value: any) {
    const current = this.selectedNode();
    if (!current) return;

    const updatedData = { ...current.data, [field]: value };
    const updated = { ...current, data: updatedData };
    this.selectedNode.set(updated);

    // Update in canvas
    this.nodes.update(ns => ns.map(n => n.id === current.id ? updated : n));
  }

  // Real Save to Postgres via API
  saveGraph() {
    const currentId = this.flowId();
    const currentFlow = this.flowService.currentFlow();

    if (!currentId || !currentFlow) return;

    this.isSaving.set(true);

    // Map Canvas nodes to DTO Nodes
    const dbNodes: any[] = this.nodes().map((n: FlowNode) => ({
      id: n.id.startsWith('node-') ? undefined : n.id, // backend UUID handling if needed
      type: n.type,
      position: {
        x: n.position.x,
        y: n.position.y
      },
      data: {
        title: n.data.title,
        subtitle: n.data.subtitle,
        ...(n.data.config || {})
      }
    }));

    // Edges mapping
    const dbEdges: any[] = this.edges().map((e: FlowEdge) => ({
      source: e.source,
      target: e.target
    }));

    this.flowService.updateFlowGraph(currentId, currentFlow.name, dbNodes, dbEdges).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.lastSaved.set(new Date());
      },
      error: (err: any) => {
        this.isSaving.set(false);
        alert('Error guardando en PostgreSQL: ' + err.message);
      }
    });
  }
}
