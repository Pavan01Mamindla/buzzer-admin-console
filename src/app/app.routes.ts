import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component')
        .then(m => m.LoginComponent)
  },

  {
    path: '',
    canActivate: [authGuard],

    loadComponent: () =>
      import('./layout/shell/shell.component')
        .then(m => m.ShellComponent),

    children: [

      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/dashboard/pages/dashboard/dashboard.component'
          ).then(m => m.DashboardComponent)
      },

      {
        path: 'sports',
        loadComponent: () =>
          import(
            './features/sports/pages/sports-list/sports-list.component'
          ).then(m => m.SportsListComponent)
      },

      {
        path: 'teams',
        loadComponent: () =>
          import(
            './features/teams/pages/teams/teams.component'
          ).then(m => m.TeamsComponent)
      },

      {
        path: 'matches',
        loadComponent: () =>
          import(
            './features/matches/pages/matches/matches.component'
          ).then(m => m.MatchesComponent)
      },

      {
        path: 'publishing',
        loadComponent: () =>
          import(
            './features/publishing/pages/publishing/publishing.component'
          ).then(m => m.PublishingComponent)
      },

      {
        path: 'finance',
        loadComponent: () =>
          import(
            './features/finance/pages/finance/finance.component'
          ).then(m => m.FinanceComponent)
      },

      {
        path: 'system',
        loadComponent: () =>
          import(
            './features/system/pages/system/system.component'
          ).then(m => m.SystemComponent)
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }

];
