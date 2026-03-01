import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AgentFlow, NodeEntity, EdgeEntity } from '../models/flow.model';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FlowService {
    private apiUrl = `${environment.apiUrl}/workflows`;

    // Global Signal State
    public flows = signal<AgentFlow[]>([]);
    public currentFlow = signal<AgentFlow | null>(null);
    public editorViewport = signal<{ pos: { x: number, y: number }, zoom: number }>({ pos: { x: 0, y: 0 }, zoom: 1 });

    constructor(private http: HttpClient) { }

    // Fetch all flows
    loadFlows(): Observable<AgentFlow[]> {
        return this.http.get<AgentFlow[]>(this.apiUrl).pipe(
            tap((data) => this.flows.set(data))
        );
    }

    // Fetch single flow
    loadFlowById(id: string): Observable<AgentFlow> {
        return this.http.get<AgentFlow>(`${this.apiUrl}/${id}`).pipe(
            tap((data) => this.currentFlow.set(data))
        );
    }

    // Create empty draft flow
    createFlow(name: string): Observable<AgentFlow> {
        return this.http.post<AgentFlow>(this.apiUrl, { name }).pipe(
            tap((newFlow) => {
                this.flows.update(flows => [...flows, newFlow]);
            })
        );
    }

    duplicateFlow(id: string): Observable<AgentFlow> {
        return this.http.post<AgentFlow>(`${this.apiUrl}/${id}/duplicate`, {}).pipe(
            tap((duplicatedFlow) => {
                this.flows.update(flows => [...flows, duplicatedFlow]);
            })
        );
    }

    renameFlow(id: string, name: string): Observable<AgentFlow> {
        return this.http.patch<AgentFlow>(`${this.apiUrl}/${id}/rename`, { name }).pipe(
            tap((renamedFlow) => {
                this.flows.update(flows => flows.map(f => f.id === id ? renamedFlow : f));
            })
        );
    }

    // Update flow nodes and edges
    updateFlowGraph(id: string, name: string, nodes: any[], edges: any[], isActive: boolean = true): Observable<AgentFlow> {
        // We map frontend ui nodes / db nodes into the backend CreateWorkflowDto expected format
        const payload = {
            name,
            isActive,
            nodes: nodes.map(n => ({
                id: n.id,
                type: typeof n.type === 'string' ? n.type : (n.nodeType?.typeCode || n.nodeType || 'specialist'),
                position: n.position || { x: n.positionX || 0, y: n.positionY || 0 },
                data: n.data || n.config || {}
            })),
            edges: edges.map(e => ({
                source: e.source,
                target: e.target
            }))
        };

        return this.http.patch<AgentFlow>(`${this.apiUrl}/${id}`, payload).pipe(
            tap((updated) => {
                this.currentFlow.set(updated);
                // Also update list if exists
                this.flows.update(f => f.map(item => item.id === id ? updated : item));
            })
        );
    }

    // Delete flow
    deleteFlow(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.flows.update(f => f.filter(item => item.id !== id)))
        );
    }
}
