import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { PageSearchService } from '../../../core/services/page-search.service';
import { BulkImportService } from '../../../core/services/bulk-import.service';
import { ImportRowResult } from '../../../core/models/api.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

type TargetKind = 'sports' | 'governing-bodies' | 'organizations' | 'teams' | 'players' | 'squad' | 'staff';

interface TargetConfig {
  key: TargetKind;
  label: string;
  /** Which write-permission rule applies: catalogue = admin/operator, roster = admin/org only. */
  permission: 'catalogue' | 'roster';
  /** Name of the parent-id field this target needs (e.g. "sportId"), or null if top-level. */
  parentIdField: string | null;
  parentIdLabel?: string;
}

const TARGETS: TargetConfig[] = [
  { key: 'sports', label: 'Sports', permission: 'catalogue', parentIdField: null },
  { key: 'governing-bodies', label: 'Governing Bodies', permission: 'catalogue', parentIdField: 'sportId', parentIdLabel: 'Sport ID' },
  { key: 'organizations', label: 'Organisations', permission: 'catalogue', parentIdField: 'governingBodyId', parentIdLabel: 'Governing Body ID' },
  { key: 'teams', label: 'Teams', permission: 'catalogue', parentIdField: 'organizationId', parentIdLabel: 'Organisation ID' },
  { key: 'players', label: 'Players', permission: 'catalogue', parentIdField: 'teamId', parentIdLabel: 'Team ID' },
  { key: 'squad', label: 'Squad', permission: 'roster', parentIdField: 'organisationId', parentIdLabel: 'Organisation ID' },
  { key: 'staff', label: 'Staff', permission: 'roster', parentIdField: 'organisationId', parentIdLabel: 'Organisation ID' }
];

@Component({
  selector: 'app-bulk-import',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './bulk-import.component.html',
  styleUrl: './bulk-import.component.scss'
})
export class BulkImportComponent implements OnInit {
  private readonly bulkImport = inject(BulkImportService);
  private readonly auth = inject(AuthService);
  readonly pageSearch = inject(PageSearchService);

  readonly targets = TARGETS;
  readonly targetKey = signal<TargetKind>('sports');
  readonly parentId = signal('');
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly fileName = signal('');
  readonly parseError = signal('');

  readonly importing = signal(false);
  readonly done = signal(0);
  readonly total = signal(0);
  readonly results = signal<ImportRowResult[]>([]);

  readonly currentTarget = computed<TargetConfig>(
    () => this.targets.find((t) => t.key === this.targetKey())!
  );

  ngOnInit(): void {
    this.pageSearch.title.set('Bulk Import');
    this.pageSearch.reset();
  }

  get addedCount(): number {
    return this.results().filter((r) => r.status === 'added').length;
  }
  get skippedCount(): number {
    return this.results().filter((r) => r.status === 'skipped').length;
  }
  get errorCount(): number {
    return this.results().filter((r) => r.status === 'error').length;
  }

  canImportSelected(): boolean {
    return this.currentTarget().permission === 'catalogue'
      ? this.auth.canWriteCatalogue()
      : this.auth.canWriteRoster();
  }

  permissionHint(): string {
    return this.currentTarget().permission === 'catalogue'
      ? 'Requires admin or operator.'
      : 'Requires admin or org (operator cannot import squad/staff).';
  }

  onTargetChange(): void {
    this.parentId.set('');
    this.reset();
  }

  onFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fileName.set(file.name);
    this.parseError.set('');
    this.results.set([]);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = file.name.toLowerCase().endsWith('.json')
          ? this.bulkImport.parseJson(text)
          : this.bulkImport.parseCsv(text);
        this.rows.set(parsed);
      } catch (e) {
        this.parseError.set(e instanceof Error ? e.message : 'Could not parse file.');
        this.rows.set([]);
      }
    };
    reader.readAsText(file);
  }

  private targetUrl(): string {
    const cfg = this.currentTarget();
    if (!cfg.parentIdField) {
      return `${environment.apiUrl}/organizations/${cfg.key}`;
    }
    // Squad/staff nest under the organisation id in the URL path itself;
    // the other catalogue levels take the parent id as a body field instead
    // (see OrganizationTreeService for the equivalent single-row calls).
    if (cfg.key === 'squad' || cfg.key === 'staff') {
      return `${environment.apiUrl}/organizations/${this.parentId().trim()}/${cfg.key}`;
    }
    return `${environment.apiUrl}/organizations/${cfg.key}`;
  }

  private rowsWithParentId(): Record<string, unknown>[] {
    const cfg = this.currentTarget();
    if (!cfg.parentIdField || cfg.key === 'squad' || cfg.key === 'staff') {
      return this.rows();
    }
    const parentId = this.parentId().trim();
    return this.rows().map((row) => ({ ...row, [cfg.parentIdField!]: parentId }));
  }

  async startImport(): Promise<void> {
    if (this.rows().length === 0) return;

    if (!this.canImportSelected()) {
      this.parseError.set(`You do not have permission to import ${this.currentTarget().label}. ${this.permissionHint()}`);
      return;
    }

    if (this.currentTarget().parentIdField && !this.parentId().trim()) {
      this.parseError.set(`Enter the ${this.currentTarget().parentIdLabel} to import these rows into.`);
      return;
    }

    this.parseError.set('');
    this.importing.set(true);
    this.done.set(0);
    this.total.set(this.rows().length);
    this.results.set([]);

    const url = this.targetUrl();
    const rows = this.rowsWithParentId();
    const results = await this.bulkImport.importSequentially(url, rows, (done) => this.done.set(done));

    this.results.set(results);
    this.importing.set(false);
  }

  reset(): void {
    this.rows.set([]);
    this.fileName.set('');
    this.results.set([]);
    this.parseError.set('');
  }
}
