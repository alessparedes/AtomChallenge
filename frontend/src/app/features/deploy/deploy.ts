import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FlowService } from '../../core/services/flow.service';

@Component({
  selector: 'app-deploy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './deploy.html',
  styleUrl: './deploy.scss'
})
export class Deploy implements OnInit {
  flowId = signal<string | null>(null);
  currentFlowName = signal<string>('');
  isPublishing = signal<boolean>(false);
  isDeployed = signal<boolean>(false);
  agentUUID = signal<string>('');

  fullEndpoint = computed(() => {
    return `${window.location.protocol}//${window.location.hostname}:3000/api/v1/execute/${this.agentUUID() || '{agent_id}'}`;
  });

  constructor(
    private route: ActivatedRoute,
    private flowService: FlowService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.flowId.set(id);
      this.loadAgentDetails(id);
    }
  }

  loadAgentDetails(id: string) {
    this.flowService.loadFlowById(id).subscribe((flow: any) => {
      this.agentUUID.set(flow.id);
      this.currentFlowName.set(flow.name);
      this.isDeployed.set(flow.status === 'published');
    });
  }

  publishAgent() {
    const id = this.flowId();
    if (!id) return;

    this.isPublishing.set(true);
    this.flowService.publishFlow(id).subscribe({
      next: (updated) => {
        this.isPublishing.set(false);
        this.isDeployed.set(true);
        this.agentUUID.set(updated.id);
      },
      error: () => this.isPublishing.set(false)
    });
  }

  copySnippet() {
    const snippet = this.getSnippet();
    navigator.clipboard.writeText(snippet);
    alert('Snippet copiado al portapapeles');
  }

  getSnippet(): string {
    return `<script src="https://cdn.atombuilder.com/widget.js"></script>
<script>
  window.AtomWidget.init({
    agentId: "${this.agentUUID()}",
    theme: "dark",
    position: "bottom-right"
  });
</script>`;
  }
}
