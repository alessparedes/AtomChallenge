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
        return this.http.post<AgentFlow>(this.apiUrl, { name, nodes: [], edges: [] }).pipe(
            tap((newFlow) => this.flows.update(f => [newFlow, ...f]))
        );
    }

    // Update flow nodes and edges
    updateFlowGraph(id: string, name: string, nodes: any[], edges: any[]): Observable<AgentFlow> {
        return this.http.patch<AgentFlow>(`${this.apiUrl}/${id}`, {
            name,
            nodes,
            edges
        }).pipe(
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
