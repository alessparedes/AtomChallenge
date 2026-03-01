import { Component, signal, effect, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentFlow } from '../../core/models/flow.model';
import { MOCK_FLOWS } from '../../core/mocks/mock-flows';

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

  constructor() {
    // Auto-scroll when messages change
    effect(() => {
      this.messages(); // Create dependency
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  ngOnInit() {
    // Load published agents
    const agents = MOCK_FLOWS.filter(f => f.status === 'Published');
    this.publishedAgents.set(agents);

    // Select first by default
    if (agents.length > 0) {
      this.selectedAgentId.set(agents[0].id);
      this.addAgentGreeting(agents[0].name);
    }
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

    // Simulate Agent Delay and Response (using mock logic, later this calls Node.js via API)
    setTimeout(() => {
      this.isTyping.set(false);
      this.messages.update(m => [...m, {
        id: crypto.randomUUID(),
        sender: 'agent',
        text: `Esta es una respuesta simulada del agente ID: ${this.selectedAgentId()}.\n\nTu mensaje original: "${text}"`,
        timestamp: new Date()
      }]);
    }, 1500 + Math.random() * 1000); // random delay 1.5s - 2.5s
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
