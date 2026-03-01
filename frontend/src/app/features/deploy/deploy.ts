import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-deploy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './deploy.html',
  styleUrl: './deploy.scss'
})
export class Deploy implements OnInit {
  flowId = signal<string | null>(null);
  isPublishing = signal<boolean>(false);
  isDeployed = signal<boolean>(false);
  agentUUID = signal<string>('');

  ngOnInit() {
    this.flowId.set(this.route.snapshot.paramMap.get('id'));

    // Simulate fetching status
    setTimeout(() => {
      // we mock that it's not deployed yet
      this.agentUUID.set(crypto.randomUUID());
    }, 500);
  }

  constructor(private route: ActivatedRoute) { }

  publishAgent() {
    this.isPublishing.set(true);
    // Simulate API call to publish
    setTimeout(() => {
      this.isPublishing.set(false);
      this.isDeployed.set(true);
    }, 1500);
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
