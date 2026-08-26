import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnInit,
    inject,
    signal
  } from '@angular/core';
  
  import {
    takeUntilDestroyed
  } from '@angular/core/rxjs-interop';
  
  import {
    finalize
  } from 'rxjs';
  
  import {
    Team,
    TeamPayload,
    TeamsService
  } from '../../../../core/services/teams.service';
  
  @Component({
    selector: 'app-teams',
    standalone: true,
    imports: [],
    templateUrl: './teams.component.html',
    styleUrl: './teams.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
  })
  export class TeamsComponent implements OnInit {
  
    private readonly teamsService = inject(TeamsService);
    private readonly destroyRef = inject(DestroyRef);
  
    readonly teams = signal<Team[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
  
    readonly search = signal('');
    readonly page = signal(1);
    readonly limit = signal(10);
    readonly total = signal(0);
    readonly totalPages = signal(1);
  
    readonly showDialog = signal(false);
  
    readonly editingTeam = signal<Team | null>(null);
  
    readonly form = signal<TeamPayload>({
      name: '',
      shortName: '',
      logoUrl: ''
    });
  
    ngOnInit(): void {
      this.loadTeams();
    }
  
    loadTeams(): void {
  
      this.loading.set(true);
      this.error.set(null);
  
      this.teamsService
        .getTeams(
          this.search(),
          this.page(),
          this.limit()
        )
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
  
          next: response => {
  
            this.teams.set(response.data ?? []);
  
            this.total.set(
              response.meta?.total ?? 0
            );
  
            this.totalPages.set(
              response.meta?.totalPages ?? 1
            );
          },
  
          error: err => {
  
            console.error(
              'Failed to load teams',
              err
            );
  
            this.error.set(
              err?.error?.error?.message ??
              'Unable to load teams.'
            );
          }
        });
    }
  
    onSearch(value: string): void {
  
      this.search.set(value);
      this.page.set(1);
  
      this.loadTeams();
    }
  
    previousPage(): void {
  
      if (this.page() <= 1) {
        return;
      }
  
      this.page.update(
        page => page - 1
      );
  
      this.loadTeams();
    }
  
    nextPage(): void {
  
      if (this.page() >= this.totalPages()) {
        return;
      }
  
      this.page.update(
        page => page + 1
      );
  
      this.loadTeams();
    }
  
    openCreateDialog(): void {
  
      this.editingTeam.set(null);
  
      this.form.set({
        name: '',
        shortName: '',
        logoUrl: ''
      });
  
      this.showDialog.set(true);
    }
  
    openEditDialog(team: Team): void {
  
      this.editingTeam.set(team);
  
      this.form.set({
        name: team.name,
        shortName: team.shortName ?? '',
        logoUrl: team.logoUrl ?? '',
        organizationId: team.organizationId ?? undefined,
        sportId: team.sportId ?? undefined
      });
  
      this.showDialog.set(true);
    }
  
    closeDialog(): void {
      this.showDialog.set(false);
    }
  
    updateField(
      field: keyof TeamPayload,
      value: string
    ): void {
  
      this.form.update(current => ({
        ...current,
        [field]: value
      }));
    }
  
    saveTeam(): void {
  
      const payload = this.form();
  
      if (!payload.name?.trim()) {
        this.error.set('Team name is required.');
        return;
      }
  
      this.loading.set(true);
      this.error.set(null);
  
      const request = this.editingTeam()
        ? this.teamsService.updateTeam(
            this.editingTeam()!.id,
            payload
          )
        : this.teamsService.createTeam(payload);
  
      request
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
  
          next: () => {
  
            this.closeDialog();
            this.loadTeams();
          },
  
          error: err => {
  
            console.error(
              'Failed to save team',
              err
            );
  
            this.error.set(
              err?.error?.error?.message ??
              'Unable to save team.'
            );
          }
        });
    }
  
    deleteTeam(team: Team): void {
  
      const confirmed = window.confirm(
        `Delete "${team.name}"?`
      );
  
      if (!confirmed) {
        return;
      }
  
      this.loading.set(true);
      this.error.set(null);
  
      this.teamsService
        .deleteTeam(team.id)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
  
          next: () => {
            this.loadTeams();
          },
  
          error: err => {
  
            console.error(
              'Failed to delete team',
              err
            );
  
            this.error.set(
              err?.error?.error?.message ??
              'Unable to delete team.'
            );
          }
        });
    }
  }
  