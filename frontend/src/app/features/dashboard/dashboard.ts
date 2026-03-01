import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgentFlow, FlowStatus } from '../../core/models/flow.model';
import { MOCK_FLOWS } from '../../core/mocks/mock-flows';

type FilterType = 'All' | 'Live' | 'Draft' | 'Deployments' | 'Archived';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // Signals for state
  flows = signal<AgentFlow[]>([...MOCK_FLOWS]);
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

    return this.flows().filter(flow => {
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

  constructor(private router: Router) { }

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
      const newFlow: AgentFlow = {
        id: 'flow-' + Date.now(),
        name,
        description: 'Nuevo flujo',
        DateCreate: new Date(),
        lastModified: new Date(),
        status: 'Draft'
      };
      // Insert in beginning
      this.flows.update(f => [newFlow, ...f]);
      this.closeModal();
      this.openFlow(newFlow.id); // Navigate to editor
    }
  }

  openFlow(id: string) {
    this.router.navigate(['/editor', id]);
  }

  deployFlow(id: string) {
    this.router.navigate(['/deploy', id]);
  }

  duplicateFlow(id: string) {
    const arr = this.flows();
    const flow = arr.find(f => f.id === id);
    if (!flow) return;

    const duplicate: AgentFlow = {
      ...flow,
      id: 'flow-' + Date.now(),
      name: flow.name + ' (Copia)',
      DateCreate: new Date(),
      lastModified: new Date(),
      status: 'Draft',
      DateDeploy: undefined
    };
    this.flows.update(f => [...f, duplicate]);
  }

  renameFlow(id: string) {
    const arr = this.flows();
    const flow = arr.find(f => f.id === id);
    if (!flow) return;

    const newName = window.prompt('Ingresa el nuevo nombre:', flow.name);
    if (newName && newName.trim()) {
      this.flows.update(f => f.map(item => item.id === id ? { ...item, name: newName.trim(), lastModified: new Date() } : item));
    }
  }

  archiveFlow(id: string) {
    const confirm = window.confirm('¿Estás seguro de que quieres archivar este flujo?');
    if (confirm) {
      this.flows.update(f => f.map(item => item.id === id ? { ...item, status: 'Archived', lastModified: new Date() } : item));
    }
  }
}
