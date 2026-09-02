import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'sports', pathMatch: 'full' },
      { path: 'sports', loadComponent: () => import('./features/sports/sports-list/sports-list.component').then(m => m.SportsListComponent) },
      { path: 'sports/:sportId', loadComponent: () => import('./features/sports/sport-detail/sport-detail.component').then(m => m.SportDetailComponent) },
      { path: 'sports/:sportId/bodies/:bodyId', loadComponent: () => import('./features/sports/governing-body-detail/governing-body-detail.component').then(m => m.GoverningBodyDetailComponent) },
      { path: 'sports/:sportId/bodies/:bodyId/orgs/:orgId', loadComponent: () => import('./features/sports/organisation-detail/organisation-detail.component').then(m => m.OrganisationDetailComponent) },
      { path: 'sports/:sportId/bodies/:bodyId/orgs/:orgId/teams/:teamId', loadComponent: () => import('./features/sports/team-detail/team-detail.component').then(m => m.TeamDetailComponent) },
      { path: 'bulk-import', loadComponent: () => import('./features/sports/bulk-import/bulk-import.component').then(m => m.BulkImportComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
