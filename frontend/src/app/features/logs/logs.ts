import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source: string;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './logs.html',
  styleUrl: './logs.scss'
})
export class Logs implements OnInit, OnDestroy {
  logs = signal<LogEntry[]>([]);
  isSimulating = signal<boolean>(false);
  private simulationInterval: any;

  // Mock messages for simulation
  private mockMessages = [
    { level: 'info', source: 'Orchestrator', msg: 'Incoming request received. Routing to Specialist...' },
    { level: 'info', source: 'System', msg: 'Context loaded for session uuid-49x12.' },
    { level: 'warn', source: 'Validator', msg: 'Regex validation took longer than expected: 154ms.' },
    { level: 'success', source: 'Specialist', msg: 'LLM generated response successfully: "Hola, claro que si tenemos..."' },
    { level: 'error', source: 'Tool: JSON', msg: 'Failed to read autos.json - fallback to cache.' }
  ];

  ngOnInit() {
    // Initial boot logs
    this.addLog('info', 'System', 'AtomBuilder Execution Engine initialized.');
    this.addLog('info', 'System', 'Connected to PostgreSQL database instance.');
    this.addLog('success', 'System', 'Ready to receive payload events.');
  }

  ngOnDestroy() {
    this.stopSimulation();
  }

  addLog(level: 'info' | 'warn' | 'error' | 'success', source: string, message: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      level,
      source,
      message
    };
    this.logs.update(l => [...l, entry]);

    // Auto-scroll to bottom of terminal could be implemented here using ViewChild
  }

  toggleSimulation() {
    if (this.isSimulating()) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  startSimulation() {
    this.isSimulating.set(true);
    this.addLog('warn', 'Demo', '--- Empezando simulación en vivo ---');
    this.simulationInterval = setInterval(() => {
      // Pick random mock message
      const randomMsg = this.mockMessages[Math.floor(Math.random() * this.mockMessages.length)];
      this.addLog(randomMsg.level as any, randomMsg.source, randomMsg.msg);
    }, 2500);
  }

  stopSimulation() {
    this.isSimulating.set(false);
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.addLog('warn', 'Demo', '--- Simulación detenida ---');
    }
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog('info', 'System', 'Logs cleared by user.');
  }
}
