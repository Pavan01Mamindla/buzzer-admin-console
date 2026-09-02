import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PageSearchService } from '../../../core/services/page-search.service';
import { SportsService } from '../../../core/services/sports.service';
import { OrganizationTreeService } from '../../../core/services/organization.service';
import { SquadStaffService } from '../../../core/services/squad-staff.service';
import {
  GoverningBody,
  Organisation,
  Sport,
  SquadMember,
  StaffGrouped,
  StaffMember,
  Team
} from '../../../core/models/api.model';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BreadcrumbsComponent, Crumb } from '../../../shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EntityField, EntityFormDialogComponent } from '../../../shared/components/entity-form-dialog/entity-form-dialog.component';

type TabKey = 'teams' | 'squad' | 'staff';

@Component({
  selector: 'app-organisation-detail',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    IconComponent,
    BreadcrumbsComponent,
    ConfirmDialogComponent,
    EntityFormDialogComponent
  ],
  templateUrl: './organisation-detail.component.html',
  styleUrl: './organisation-detail.component.scss'
})
export class OrganisationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sportsService = inject(SportsService);
  private readonly orgTree = inject(OrganizationTreeService);
  private readonly squadStaff = inject(SquadStaffService);
  private readonly auth = inject(AuthService);
  readonly pageSearch = inject(PageSearchService);

  readonly sportId = signal('');
  readonly bodyId = signal('');
  readonly orgId = signal('');

  readonly sport = signal<Sport | null>(null);
  readonly body = signal<GoverningBody | null>(null);
  readonly organisation = signal<Organisation | null>(null);

  readonly activeTab = signal<TabKey>('teams');

  // Teams (catalogue - admin/operator write)
  readonly teams = signal<Team[]>([]);
  readonly teamsPage = signal(1);
  readonly teamsTotalPages = signal(1);
  readonly teamsTotal = signal(0);
  readonly teamLimit = 12;

  // Squad / staff (roster - admin/org write)
  readonly squad = signal<SquadMember[]>([]);
  readonly staffGrouped = signal<StaffGrouped>({});

  readonly loading = signal(true);
  readonly listError = signal('');

  readonly showAddDialog = signal(false);
  readonly savingForm = signal(false);
  readonly formError = signal('');
  readonly formFieldErrors = signal<Record<string, string>>({});
  readonly deletingMember = signal<{ id: string; name: string; type: TabKey } | null>(null);
  readonly deleteLoading = signal(false);

  readonly teamFields: EntityField[] = [
    { key: 'name', label: 'Team Name', placeholder: 'e.g. Manchester City U21', required: true },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description' },
    { key: 'crestUrl', label: 'Crest URL', type: 'url', placeholder: 'https://…/crest.png' }
  ];

  readonly squadFields: EntityField[] = [
    { key: 'name', label: 'Player Name', placeholder: 'e.g. Erling Haaland', required: true },
    { key: 'position', label: 'Position', placeholder: 'e.g. Forward' },
    { key: 'userId', label: 'Linked Athlete User ID', placeholder: 'Optional — links photo & age from profile' }
  ];

  readonly staffFields: EntityField[] = [
    { key: 'name', label: 'Staff Name', placeholder: 'e.g. Pep Guardiola', required: true },
    { key: 'role', label: 'Role', placeholder: 'e.g. Head Coach' },
    { key: 'group', label: 'Group', placeholder: 'e.g. Coaching Staff' }
  ];

  private isFirstSearchEffect = true;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      this.pageSearch.term();
      if (this.isFirstSearchEffect) {
        this.isFirstSearchEffect = false;
        return;
      }
      clearTimeout(this.searchDebounce);
      this.searchDebounce = setTimeout(() => {
        if (this.activeTab() === 'teams') {
          this.teamsPage.set(1);
        }
        this.loadTabData();
      }, 250);
      // Squad/staff aren't documented as paginated/searchable server-side, so the
      // search term is applied client-side over whatever page is already loaded
      // for those two tabs (see filteredSquad / filteredGroupMembers below).
    });
  }

  ngOnInit(): void {
    this.pageSearch.title.set('Sport Management');
    this.pageSearch.reset();
    this.sportId.set(this.route.snapshot.paramMap.get('sportId')!);
    this.bodyId.set(this.route.snapshot.paramMap.get('bodyId')!);
    this.orgId.set(this.route.snapshot.paramMap.get('orgId')!);

    this.sportsService.get(this.sportId()).subscribe({ next: (s) => this.sport.set(s) });
    this.orgTree.getGoverningBody(this.bodyId()).subscribe({ next: (b) => this.body.set(b) });
    this.orgTree.getOrganisation(this.orgId()).subscribe({ next: (o) => this.organisation.set(o) });

    this.loadTabData();
  }

  /** Teams, like sports/governing bodies/organisations, need admin or operator. */
  canWriteCatalogue(): boolean {
    return this.auth.canWriteCatalogue();
  }

  /** Squad & staff need admin or org - operator is NOT enough here. */
  canWriteRoster(): boolean {
    return this.auth.canWriteRoster();
  }

  canWriteActiveTab(): boolean {
    return this.activeTab() === 'teams' ? this.canWriteCatalogue() : this.canWriteRoster();
  }

  get crumbs(): Crumb[] {
    return [
      { label: 'Sport', link: ['/sports'] },
      { label: this.sport()?.name || '…', link: ['/sports', this.sportId()] },
      { label: this.body()?.name || '…', link: ['/sports', this.sportId(), 'bodies', this.bodyId()] },
      { label: this.organisation()?.name || '…' }
    ];
  }

  get filteredSquad(): SquadMember[] {
    const term = this.pageSearch.term().toLowerCase();
    if (!term) return this.squad();
    return this.squad().filter((m) => m.name.toLowerCase().includes(term));
  }

  get staffGroupNames(): string[] {
    return Object.keys(this.staffGrouped());
  }

  membersOf(group: string): StaffMember[] {
    const term = this.pageSearch.term().toLowerCase();
    const members = this.staffGrouped()[group] || [];
    return term ? members.filter((m) => m.name.toLowerCase().includes(term)) : members;
  }

  setTab(tab: TabKey): void {
    this.activeTab.set(tab);
    this.loadTabData();
  }

  goToTeamsPage(delta: number): void {
    const next = this.teamsPage() + delta;
    if (next < 1 || next > this.teamsTotalPages()) return;
    this.teamsPage.set(next);
    this.loadTabData();
  }

  openTeam(team: Team): void {
    this.router.navigate(['/sports', this.sportId(), 'bodies', this.bodyId(), 'orgs', this.orgId(), 'teams', team.id]);
  }

  private loadTabData(): void {
    this.loading.set(true);
    this.listError.set('');

    if (this.activeTab() === 'teams') {
      this.orgTree
        .listTeams(this.orgId(), {
          search: this.pageSearch.term() || undefined,
          page: this.teamsPage(),
          limit: this.teamLimit
        })
        .subscribe({
          next: (res) => {
            this.teams.set(res.data);
            this.teamsTotal.set(res.meta.total);
            this.teamsTotalPages.set(res.meta.totalPages ?? Math.max(1, Math.ceil(res.meta.total / this.teamLimit)));
            this.loading.set(false);
          },
          error: (err) => {
            this.listError.set(err.status === 403 ? 'You do not have permission to view teams.' : 'Could not load teams.');
            this.loading.set(false);
          }
        });
    } else if (this.activeTab() === 'squad') {
      this.squadStaff.getSquad(this.orgId()).subscribe({
        next: (members) => this.enrichSquadWithProfiles(members),
        error: (err) => {
          this.listError.set(err.status === 403 ? 'You do not have permission to view the squad.' : 'Could not load squad.');
          this.loading.set(false);
        }
      });
    } else {
      this.squadStaff.getStaffGrouped(this.orgId()).subscribe({
        next: (grouped) => {
          this.staffGrouped.set(grouped);
          this.loading.set(false);
        },
        error: (err) => {
          this.listError.set(err.status === 403 ? 'You do not have permission to view staff.' : 'Could not load staff.');
          this.loading.set(false);
        }
      });
    }
  }

  /** Photo & age live on the athlete profile and are null with no linked profile. */
  private enrichSquadWithProfiles(members: SquadMember[]): void {
    const withUserIds = members.filter((m) => m.userId);
    if (withUserIds.length === 0) {
      this.squad.set(members);
      this.loading.set(false);
      return;
    }

    // Fetch profiles individually (not forkJoin) so one missing profile
    // doesn't blank out the whole squad list.
    let remaining = withUserIds.length;
    const merged = [...members];
    withUserIds.forEach((m) => {
      this.squadStaff.getAthleteProfile(m.userId!).subscribe({
        next: (profile) => {
          const idx = merged.findIndex((x) => x.id === m.id);
          if (idx > -1) {
            merged[idx] = {
              ...merged[idx],
              photoUrl: profile?.photoUrl ?? null,
              age: profile?.age ?? null
            };
          }
          if (--remaining === 0) {
            this.squad.set(merged);
            this.loading.set(false);
          }
        },
        error: () => {
          if (--remaining === 0) {
            this.squad.set(merged);
            this.loading.set(false);
          }
        }
      });
    });
  }

  openAddDialog(): void {
    this.formError.set('');
    this.formFieldErrors.set({});
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  saveMember(value: Record<string, unknown>): void {
    this.savingForm.set(true);
    this.formError.set('');
    this.formFieldErrors.set({});

    const tab = this.activeTab();
    const onDone = () => {
      this.savingForm.set(false);
      this.showAddDialog.set(false);
      this.loadTabData();
    };
    const onError = (err: any) => {
      this.savingForm.set(false);
      if (err?.status === 409) {
        this.formFieldErrors.set({ name: 'An entry with this name already exists.' });
      } else if (err?.status === 403) {
        this.formError.set(
          tab === 'teams'
            ? 'You do not have permission to do this (needs admin or operator).'
            : 'You do not have permission to do this (needs admin or org).'
        );
      } else {
        this.formError.set('Something went wrong. Please try again.');
      }
    };

    if (tab === 'teams') {
      this.orgTree
        .createTeam(this.orgId(), {
          name: String(value['name'] ?? '').trim(),
          description: value['description'] ? String(value['description']) : undefined,
          crestUrl: value['crestUrl'] ? String(value['crestUrl']) : undefined
        })
        .subscribe({ next: onDone, error: onError });
    } else if (tab === 'squad') {
      this.squadStaff
        .addSquadMember(this.orgId(), {
          name: String(value['name'] ?? '').trim(),
          position: value['position'] ? String(value['position']) : undefined,
          userId: value['userId'] ? String(value['userId']) : undefined
        })
        .subscribe({ next: onDone, error: onError });
    } else {
      this.squadStaff
        .addStaffMember(this.orgId(), {
          name: String(value['name'] ?? '').trim(),
          role: value['role'] ? String(value['role']) : undefined,
          group: value['group'] ? String(value['group']) : undefined
        })
        .subscribe({ next: onDone, error: onError });
    }
  }

  askDelete(id: string, name: string, type: TabKey, evt: Event): void {
    evt.stopPropagation();
    this.deletingMember.set({ id, name, type });
  }

  cancelDelete(): void {
    this.deletingMember.set(null);
  }

  confirmDelete(): void {
    const target = this.deletingMember();
    if (!target) return;
    this.deleteLoading.set(true);

    const onDone = () => {
      this.deleteLoading.set(false);
      this.deletingMember.set(null);
      this.loadTabData();
    };
    const onError = (err: any) => {
      this.deleteLoading.set(false);
      this.deletingMember.set(null);
      this.listError.set(err?.status === 403 ? 'You do not have permission to delete this.' : 'Could not delete this entry.');
    };

    if (target.type === 'teams') {
      this.orgTree.deleteTeam(target.id).subscribe({ next: onDone, error: onError });
    } else if (target.type === 'squad') {
      this.squadStaff.removeSquadMember(target.id).subscribe({ next: onDone, error: onError });
    } else {
      this.squadStaff.removeStaffMember(target.id).subscribe({ next: onDone, error: onError });
    }
  }
}
