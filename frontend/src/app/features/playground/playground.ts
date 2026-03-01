import { Component, signal, effect, ViewChild, ElementRef, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentFlow } from '../../core/models/flow.model';
import { FlowService } from '../../core/services/flow.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './playground.html',
  styleUrl: './playground.scss'
})
export class Playground implements OnInit {
  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  // State
  publishedAgents = signal<AgentFlow[]>([]);
  selectedAgentId = signal<string>('');
  sessionId = signal<string>('session-' + Math.random().toString(36).substr(2, 9));

  // Chat State
  messages = signal<ChatMessage[]>([]);
  currentInput = signal<string>('');
  isTyping = signal<boolean>(false);

  // Services
  private flowService = inject(FlowService);
  private http = inject(HttpClient);

  constructor() {
    // Auto-scroll when messages change
    effect(() => {
      this.messages(); // Create dependency
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  ngOnInit() {
    // Load published agents from real API
    this.flowService.loadFlows().subscribe((flows: AgentFlow[]) => {
      const activeFlows = flows.filter((f: AgentFlow) => f.isActive);
      this.publishedAgents.set(activeFlows);

      // Select first by default
      if (activeFlows.length > 0) {
        this.selectedAgentId.set(activeFlows[0].id);
        this.addAgentGreeting(activeFlows[0].name);
      }
    });
  }

  onAgentChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedAgentId.set(target.value);

    // Auto-clear chat when agent changes
    this.clearChat();

    // Add new greeting
    const agentName = this.publishedAgents().find(a => a.id === target.value)?.name || 'Agente';
    this.addAgentGreeting(agentName);
  }

  addAgentGreeting(agentName: string) {
    this.messages.set([
      {
        id: crypto.randomUUID(),
        sender: 'agent',
        text: `Hola, soy tu agente de prueba para "${agentName}". ¿En qué te puedo ayudar hoy?`,
        timestamp: new Date()
      }
    ]);
  }

  sendMessage() {
    const text = this.currentInput().trim();
    if (!text || !this.selectedAgentId()) return;

    // Add user message
    this.messages.update(m => [...m, {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date()
    }]);

    this.currentInput.set('');
    this.isTyping.set(true);

    // Call Telegram NodeJS API passing workflowId
    this.http.post<{ response: string }>(`${environment.apiUrl}/telegram/${this.selectedAgentId()}`, {
      sessionId: this.sessionId(),
      message: text
    }).subscribe({
      next: (res: any) => {
        this.isTyping.set(false);
        this.messages.update(m => [...m, {
          id: crypto.randomUUID(),
          sender: 'agent',
          text: res?.response || res || 'Sin respuesta del agente.',
          timestamp: new Date()
        }]);
      },
      error: (err: any) => {
        this.isTyping.set(false);
        this.messages.update(m => [...m, {
          id: crypto.randomUUID(),
          sender: 'agent',
          text: `Error de conexión: ${err.message}`,
          timestamp: new Date()
        }]);
      }
    });
  }

  clearChat() {
    this.messages.set([]);
    this.sessionId.set('session-' + Math.random().toString(36).substr(2, 9));
  }

  private scrollToBottom(): void {
    try {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }
}
