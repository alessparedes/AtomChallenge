import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { FlowService } from '../../core/services/flow.service';
import { AgentFlow, NodeEntity, EdgeEntity } from '../../core/models/flow.model';

export type NodeType = 'trigger' | 'memory' | 'orchestrator' | 'validator' | 'specialist' | 'tool';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  subtitle?: string;
  x: number;
  y: number;
  config?: any;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, DragDropModule, RouterLink, FormsModule],
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
  nodes = signal<WorkflowNode[]>([
    { id: 'n1', type: 'trigger', title: 'Customer Message', subtitle: 'Ingreso', x: 100, y: 200 },
    { id: 'n2', type: 'validator', title: 'Schema Validator', subtitle: 'Filtro', x: 450, y: 150 }
  ]);

  selectedNode = signal<WorkflowNode | null>(null);

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
              type: typeof n.nodeType === 'string' ? n.nodeType as NodeType : (n.nodeType?.typeCode || 'specialist') as NodeType,
              title: n.config?.title || 'Node',
              subtitle: n.config?.subtitle || '',
              x: n.positionX,
              y: n.positionY,
              config: n.config
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

  // Drag and Drop (from toolbox to canvas mockup)
  onDrop(event: CdkDragDrop<any>) {
    // In a real canvas we'd calculate XY coords relative to drop point
    if (event.previousContainer !== event.container) {
      const newNodeType = event.previousContainer.data[event.previousIndex];
      const newNode: WorkflowNode = {
        id: 'node-' + Date.now(),
        type: newNodeType.type as NodeType,
        title: 'New ' + newNodeType.label,
        x: 300 + (this.nodes().length * 50),
        y: 200 + (this.nodes().length * 50),
        config: {}
      };
      this.nodes.update(ns => [...ns, newNode]);
      this.selectNode(newNode);
    }
  }

  // Node Selection
  selectNode(node: WorkflowNode | null) {
    this.selectedNode.set(node);
  }

  // Properties Update
  updateNodeProperty(field: keyof WorkflowNode, value: any) {
    const current = this.selectedNode();
    if (!current) return;

    const updated = { ...current, [field]: value };
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
    const dbNodes: NodeEntity[] = this.nodes().map((n: WorkflowNode) => ({
      id: n.id,
      positionX: n.x,
      positionY: n.y,
      config: {
        title: n.title,
        subtitle: n.subtitle,
        ...n.config
      },
      nodeType: n.type // string mapping for DTO
    }));

    // Todo: Implement edge mapping when connections are graphically added
    const dbEdges: EdgeEntity[] = [];

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
