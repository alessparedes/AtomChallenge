import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayout),
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path: 'editor/:id',
                loadComponent: () => import('./features/editor/editor').then(m => m.Editor)
            },
            {
                path: 'deploy/:id',
                loadComponent: () => import('./features/deploy/deploy').then(m => m.Deploy)
            },
            {
                path: 'logs',
                loadComponent: () => import('./features/logs/logs').then(m => m.Logs)
            },
            {
                path: 'playground',
                loadComponent: () => import('./features/playground/playground').then(m => m.Playground)
            }
        ]
    }
];
