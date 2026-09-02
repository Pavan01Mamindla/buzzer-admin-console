import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface NavItem {
  label: string;
  route?: string;
  icon: string;
  comingSoon?: boolean;
}

interface NavGroup {
  label: string;
  expanded: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  readonly collapsed = signal(false);

  readonly groups = signal<NavGroup[]>([
    {
      label: 'Match Management',
      expanded: true,
      items: [
        { label: 'Sports', route: '/sports', icon: 'sports' },
        { label: 'Bulk Import', route: '/bulk-import', icon: 'import' },
        { label: 'Fixtures', icon: 'fixtures', comingSoon: true },
      ]
    },
    {
      label: 'Publishing',
      expanded: false,
      items: [
        { label: 'Athlete Blog Requests', icon: 'blog', comingSoon: true },
        { label: 'Videos', icon: 'video', comingSoon: true },
      ]
    },
    {
      label: 'Finance',
      expanded: false,
      items: [
        { label: 'Reporting', icon: 'report', comingSoon: true },
        { label: 'Referrals', icon: 'referral', comingSoon: true },
      ]
    },
    {
      label: 'System',
      expanded: false,
      items: [
        { label: 'Users', icon: 'users', comingSoon: true },
        { label: 'Restricted Words', icon: 'restricted', comingSoon: true },
      ]
    }
  ]);

  get user() {
    return this.auth.currentUser();
  }

  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }

  toggleGroup(group: NavGroup): void {
    group.expanded = !group.expanded;
    this.groups.update((groups) => [...groups]);
  }

  signOut(): void {
    this.auth.logout();
  }

  initials(): string {
    const email = this.user?.email || '';
    return email.charAt(0).toUpperCase() || 'A';
  }
}
