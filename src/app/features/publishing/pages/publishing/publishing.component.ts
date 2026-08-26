import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';


interface Template {
  id: string;
  name?: string;
  title?: string;
  content?: string;
  variables?: string[];
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplatesResponse {
  success: boolean;
  data: Template[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Component({
  selector: 'app-publishing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publishing.component.html',
  styleUrl: './publishing.component.scss'
})
export class PublishingComponent implements OnInit {

  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.apiUrl}/api/templates`;

  templates = signal<Template[]>([]);
  loading = signal(false);
  error = signal('');

  search = signal('');
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  totalPages = signal(1);

  showForm = signal(false);
  editingId = signal<string | null>(null);

  formName = '';
  formContent = '';

  filteredTemplates = computed(() => {
    const value = this.search().trim().toLowerCase();

    if (!value) {
      return this.templates();
    }

    return this.templates().filter(template =>
      (template.name || '').toLowerCase().includes(value) ||
      (template.title || '').toLowerCase().includes(value) ||
      (template.content || '').toLowerCase().includes(value)
    );
  });

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading.set(true);
    this.error.set('');

    let params = new HttpParams()
      .set('page', this.page())
      .set('limit', this.limit());

    if (this.search().trim()) {
      params = params.set('search', this.search().trim());
    }

    this.http.get<TemplatesResponse>(
      this.endpoint,
      { params }
    ).subscribe({
      next: response => {
        this.templates.set(response.data || []);

        const meta = response.meta;

        this.total.set(
          meta?.total ?? response.data?.length ?? 0
        );

        this.totalPages.set(
          meta?.totalPages ??
          Math.max(
            1,
            Math.ceil(
              (meta?.total ?? response.data?.length ?? 0) /
              this.limit()
            )
          )
        );

        this.loading.set(false);
      },

      error: err => {
        console.error(err);

        this.error.set(
          err?.error?.error?.message ||
          err?.error?.message ||
          'Unable to load templates.'
        );

        this.loading.set(false);
      }
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.loadTemplates();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formName = '';
    this.formContent = '';
    this.showForm.set(true);
  }

  openEdit(template: Template): void {
    this.editingId.set(template.id);
    this.formName = template.name || template.title || '';
    this.formContent = template.content || '';
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formName = '';
    this.formContent = '';
  }

  saveTemplate(): void {
    if (!this.formName.trim() || !this.formContent.trim()) {
      this.error.set('Template name and content are required.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const payload = {
      name: this.formName.trim(),
      content: this.formContent.trim()
    };

    const id = this.editingId();

    const request = id
      ? this.http.patch(
          `${this.endpoint}/${id}`,
          payload
        )
      : this.http.post(
          this.endpoint,
          payload
        );

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadTemplates();
      },

      error: err => {
        console.error(err);

        this.error.set(
          err?.error?.error?.message ||
          err?.error?.message ||
          'Unable to save template.'
        );

        this.loading.set(false);
      }
    });
  }

  deleteTemplate(template: Template): void {
    const name =
      template.name ||
      template.title ||
      'this template';

    if (!confirm(`Delete "${name}"?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.http.delete(
      `${this.endpoint}/${template.id}`
    ).subscribe({
      next: () => {
        this.loadTemplates();
      },

      error: err => {
        console.error(err);

        this.error.set(
          err?.error?.error?.message ||
          err?.error?.message ||
          'Unable to delete template.'
        );

        this.loading.set(false);
      }
    });
  }

  previousPage(): void {
    if (this.page() <= 1 || this.loading()) {
      return;
    }

    this.page.update(value => value - 1);
    this.loadTemplates();
  }

  nextPage(): void {
    if (
      this.page() >= this.totalPages() ||
      this.loading()
    ) {
      return;
    }

    this.page.update(value => value + 1);
    this.loadTemplates();
  }

  getTemplateName(template: Template): string {
    return template.name ||
      template.title ||
      'Untitled template';
  }

  getVariables(template: Template): string {
    if (template.variables?.length) {
      return template.variables.join(', ');
    }

    const content = template.content || '';
    const matches = content.match(/{{\s*[\w.-]+\s*}}/g);

    return matches?.join(', ') || '—';
  }

  trackById(_: number, template: Template): string {
    return template.id;
  }
}
