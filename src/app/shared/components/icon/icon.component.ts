import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

const PATHS: Record<string, string> = {
  sports: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0v20M2 12h20M4.5 6.5 19.5 17.5M19.5 6.5 4.5 17.5',
  import: 'M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  fixtures: 'M4 4h16v16H4V4Zm0 6h16M9 4v16',
  blog: 'M4 4h12l4 4v12H4V4Zm10 0v5h5',
  video: 'M4 6h11v12H4V6Zm11 4 5-3v10l-5-3',
  report: 'M4 20V10m6 10V4m6 16v-7',
  referral: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 8v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m14-8a3 3 0 1 0 0-6',
  users: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8a6 6 0 0 1 12 0m2-8a4 4 0 1 0 0-8m-2 8a6 6 0 0 1 6 8',
  restricted: 'M12 2 2 7l10 5 10-5-10-5Zm-10 5v10l10 5 10-5V7M12 12v10',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5.5-5.5',
  chevronDown: 'm6 9 6 6 6-6',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronRight: 'm9 18 6-6-6-6',
  plus: 'M12 5v14M5 12h14',
  edit: 'm16.5 3.5 4 4L8 20l-4.5 1 1-4.5L16.5 3.5Z',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
  close: 'm6 6 12 12M18 6 6 18',
  check: 'm4 12 6 6 10-12',
  external: 'M14 4h6v6M20 4 10 14M6 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1',
  back: 'm12 19-7-7 7-7m-7 7h16',
  upload: 'M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m6 14 5-5-5-5M20 12H9',
  warning: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a1.5 1.5 0 0 0 1.3 2.2h17.8a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      [attr.stroke]="color || 'currentColor'"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path [attr.d]="path" />
    </svg>
  `
})
export class IconComponent {
  @Input() name = 'sports';
  @Input() size = 18;
  @Input() color?: string;

  get path(): string {
    return PATHS[this.name] ?? PATHS['sports'];
  }
}
