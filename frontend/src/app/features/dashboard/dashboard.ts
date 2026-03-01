import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgentFlow, FlowStatus } from '../../core/models/flow.model';
import { FlowService } from '../../core/services/flow.service';

type FilterType = 'All' | 'Live' | 'Draft' | 'Deployments' | 'Archived';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private flowService = inject(FlowService);
  private router = inject(Router);

  // Signals for state - now derived from the FlowService
  flows = this.flowService.flows;
  searchQuery = signal<string>('');
  viewMode = signal<'grid' | 'list'>('grid');
  currentFilter = signal<FilterType>('All');

  // Modal state
  isModalOpen = signal<boolean>(false);
  newFlowName = signal<string>('');

  // Computed values
  filteredFlows = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filter = this.currentFilter();

    return this.flows().filter((flow: AgentFlow) => {
      // Apply status filter
      if (filter === 'Archived') {
        if (flow.status !== 'Archived') return false;
      } else {
        if (flow.status === 'Archived') return false; // Hide archived by default

        if (filter === 'Draft' && flow.status !== 'Draft') return false;
        if ((filter === 'Live' || filter === 'Deployments') && flow.status !== 'Published') return false;
      }

      // Apply search form
      if (query && !flow.name.toLowerCase().includes(query)) return false;

      return true;
    });
  });

  constructor() {
    // Fetch initial flows from API
    this.flowService.loadFlows().subscribe();
  }

  // UI Toggles
  setFilter(filter: FilterType) {
    this.currentFilter.set(filter);
  }

  toggleViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  // CRUD Actions
  openCreateModal() {
    this.newFlowName.set('');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  confirmCreateFlow() {
    const name = this.newFlowName().trim();
    if (name) {
      this.flowService.createFlow(name).subscribe({
        next: (newFlow: AgentFlow) => {
          this.closeModal();
          this.openFlow(newFlow.id); // Navigate to editor with DB id
        },
        error: (err: any) => alert('Error creando el flujo: ' + err.message)
      });
    }
  }

  openFlow(id: string) {
    this.router.navigate(['/editor', id]);
  }

  deployFlow(id: string) {
    this.router.navigate(['/deploy', id]);
  }

  duplicateFlow(id: string) {
    this.flowService.duplicateFlow(id).subscribe({
      error: (err: any) => alert('Error duplicando el flujo: ' + err.message)
    });
  }

  renameFlow(id: string) {
    const arr = this.flows();
    const flow = arr.find((f: AgentFlow) => f.id === id);
    if (!flow) return;

    const newName = window.prompt('Ingresa el nuevo nombre:', flow.name);
    if (newName && newName.trim() && newName.trim() !== flow.name) {
      this.flowService.updateFlowGraph(id, newName.trim(), flow.nodes, flow.edges).subscribe();
    }
  }

  archiveFlow(id: string) {
    const confirm = window.confirm('¿Estás seguro de que quieres eliminar este flujo permanentemente?');
    if (confirm) {
      this.flowService.deleteFlow(id).subscribe();
    }
  }
}
