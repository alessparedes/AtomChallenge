import { Component, Inject, PLATFORM_ID, OnInit, signal, effect } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit {
  isDarkMode = true;
  isCollapsed = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const savedState = localStorage.getItem('sidebar_collapsed');
      if (savedState) {
        this.isCollapsed.set(savedState === 'true');
      }

      effect(() => {
        localStorage.setItem('sidebar_collapsed', String(this.isCollapsed()));
      });
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check for user preference or default to dark
      this.isDarkMode = document.documentElement.classList.contains('dark') || true;
      this.applyTheme();
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
  }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }

  private applyTheme() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
