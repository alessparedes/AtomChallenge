import { Component, signal, OnInit, inject, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { FlowService } from '../../core/services/flow.service';
import { AgentFlow, NodeEntity, EdgeEntity } from '../../core/models/flow.model';

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface FlowEdge {
  id?: string;
  source: string;
  target: string;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DragDropModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnInit {
  private flowService = inject(FlowService);
  private route = inject(ActivatedRoute);

  // UI State
  flowId = signal<string | null>(null);
  flowName = computed(() => this.flowService.currentFlow()?.name || 'Editor de flujo');
  isSaving = signal<boolean>(false);
  lastSaved = signal<Date | null>(new Date());

  // Node Types Catalog (Toolbox)
  nodeTypes = [
    { type: 'input', label: 'Input', icon: 'zap', color: 'bg-blue-500', desc: 'Inicia el flujo' },
    { type: 'memory', label: 'Memoria', icon: 'database', color: 'bg-purple-500', desc: 'Contexto de sesión' },
    { type: 'orchestrator', label: 'Orquestador', icon: 'git-branch', color: 'bg-rose-500', desc: 'Ruta e intención' },
    { type: 'validator', label: 'Validador', icon: 'check-square', color: 'bg-amber-500', desc: 'Reglas de negocio' },
    { type: 'specialist', label: 'Especialista', icon: 'bot', color: 'bg-emerald-500', desc: 'Agente LLM' },
    { type: 'tool', label: 'Tool / External', icon: 'code', color: 'bg-teal-500', desc: 'Llamada externa' }
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
                label: n.config?.label || 'Node',
                description: n.config?.description || '',
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

  // Edge drawing
  drawingEdge = signal<{ sourceNodeId: string, currentX: number, currentY: number } | null>(null);

  getEdgePath(edge: FlowEdge): string {
    const sourceNode = this.nodes().find(n => n.id === edge.source);
    const targetNode = this.nodes().find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return '';
    const startX = sourceNode.position.x + 224; // Node width
    const startY = sourceNode.position.y + 45;  // Handle Y
    const endX = targetNode.position.x;
    const endY = targetNode.position.y + 45;
    const controlPointX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${controlPointX} ${startY}, ${controlPointX} ${endY}, ${endX} ${endY}`;
  }

  getDrawingPath(): string {
    const drawing = this.drawingEdge();
    if (!drawing) return '';
    const sourceNode = this.nodes().find(n => n.id === drawing.sourceNodeId);
    if (!sourceNode) return '';
    const startX = sourceNode.position.x + 224;
    const startY = sourceNode.position.y + 45;
    const endX = drawing.currentX;
    const endY = drawing.currentY;
    const controlPointX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${controlPointX} ${startY}, ${controlPointX} ${endY}, ${endX} ${endY}`;
  }

  // Handle Drag from ToolBox
  onDragStartToolbox(event: DragEvent, nodeType: any) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/node', JSON.stringify(nodeType));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOverCanvas(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDropCanvas(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) return;
    const nodeTypeStr = event.dataTransfer.getData('application/node');
    if (!nodeTypeStr) return;

    const nodeType = JSON.parse(nodeTypeStr);
    const target = event.currentTarget as HTMLElement;
    const bounds = target.getBoundingClientRect();

    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };

    // Generate semantic ID like 'node_input_1'
    const typeCount = this.nodes().filter(n => n.type === nodeType.type).length + 1;
    const newId = `node_${nodeType.type}_${typeCount}`;

    const newNode: FlowNode = {
      id: newId,
      type: nodeType.type,
      position,
      data: {
        label: 'Nuevo ' + nodeType.label,
        description: '',
        ...nodeType
      }
    };

    this.nodes.update(ns => [...ns, newNode]);
    this.selectNode(newNode);
  }

  // Handle Free Drag within Canvas
  onNodeDragEnd(event: CdkDragEnd, node: FlowNode) {
    const position = event.source.getFreeDragPosition();
    this.nodes.update(ns => ns.map(n => n.id === node.id ? { ...n, position } : n));
  }

  // Node Selection
  selectNode(node: FlowNode | null) {
    this.selectedNode.set(node);
  }

  // Handle Edges Connections
  startConnection(event: MouseEvent, node: FlowNode) {
    event.stopPropagation();
    const canvas = document.querySelector('.CanvasArea') as HTMLElement;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    this.drawingEdge.set({
      sourceNodeId: node.id,
      currentX: event.clientX - bounds.left,
      currentY: event.clientY - bounds.top
    });
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const drawing = this.drawingEdge();
    if (drawing) {
      const canvas = document.querySelector('.CanvasArea') as HTMLElement;
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      this.drawingEdge.set({
        ...drawing,
        currentX: event.clientX - bounds.left,
        currentY: event.clientY - bounds.top
      });
    }
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.drawingEdge.set(null);
  }

  endConnection(event: MouseEvent, node: FlowNode) {
    event.stopPropagation();
    const drawing = this.drawingEdge();
    if (drawing && drawing.sourceNodeId !== node.id) {
      const existing = this.edges().find(e => e.source === drawing.sourceNodeId && e.target === node.id);
      if (!existing) {
        const newEdge: FlowEdge = {
          id: `edge_${Date.now()}`,
          source: drawing.sourceNodeId,
          target: node.id
        };
        this.edges.update(es => [...es, newEdge]);
      }
    }
    this.drawingEdge.set(null);
  }

  deleteNode(nodeId: string) {
    this.nodes.update(ns => ns.filter(n => n.id !== nodeId));
    this.edges.update(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (this.selectedNode()?.id === nodeId) {
      this.selectedNode.set(null);
    }
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

    const dbNodes: any[] = this.nodes().map((n: FlowNode) => ({
      id: n.id,
      type: n.type,
      position: {
        x: n.position.x,
        y: n.position.y
      },
      data: {
        label: n.data.label,
        ...(n.data.config || {})
      }
    }));

    // Edges mapping
    const dbEdges: any[] = this.edges().map((e: FlowEdge) => ({
      source: e.source,
      target: e.target
    }));

    const isActive = currentFlow.isActive ?? true;

    this.flowService.updateFlowGraph(currentId, currentFlow.name, dbNodes, dbEdges, isActive).subscribe({
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
