import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreatorService, DraftSummary } from '../../services/creator.service';

interface LibrarySection {
  subtitle: string;
  sectionIndex: number;
  items: DraftSummary[];
}

interface LibraryProgram {
  title: string;
  sections: LibrarySection[];
}

const LIB_SECTIONS = [
  { key: 'all',       label: 'All'       },
  { key: 'draft',     label: 'Drafted'   },
  { key: 'published', label: 'Published' },
  { key: 'updated',   label: 'Updated'   },
  { key: 'shared',    label: 'Shared'    },
] as const;

@Component({
  selector: 'app-create-library-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-library-sidebar.html',
  styleUrl: './create-library-sidebar.scss',
})
export class CreateLibrarySidebarComponent implements OnInit {
  private readonly creatorService = inject(CreatorService);
  private readonly router = inject(Router);

  readonly LIB_SECTIONS = LIB_SECTIONS;

  readonly items = signal<DraftSummary[]>([]);
  readonly loading = signal(false);
  readonly activeSection = signal<string>('all');
  readonly importUrl = signal('');
  readonly expandedPrograms = signal<Set<string>>(new Set());

  readonly filtered = computed((): DraftSummary[] => {
    const sec = this.activeSection();
    let result = this.items();
    if (sec === 'updated') {
      result = result.filter(i => i.version > 1);
    } else if (sec !== 'all') {
      result = result.filter(i => (i.state as string) === sec);
    }
    return result;
  });

  readonly grouped = computed((): LibraryProgram[] => {
    const programMap = new Map<string, Map<string, DraftSummary[]>>();
    for (const item of this.filtered()) {
      const prog = item.title || '(No Program)';
      const sect = item.subtitle || '';
      if (!programMap.has(prog)) programMap.set(prog, new Map());
      const sects = programMap.get(prog)!;
      if (!sects.has(sect)) sects.set(sect, []);
      sects.get(sect)!.push(item);
    }
    return Array.from(programMap.entries()).map(([title, sects]) => ({
      title,
      sections: Array.from(sects.entries()).map(([subtitle, items], idx) => ({
        subtitle,
        sectionIndex: idx + 1,
        items: [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      })),
    }));
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.creatorService.listDrafts().subscribe({
      next: ({ data }) => { this.items.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  open(baseId: string): void {
    this.router.navigate(['/personal/create', baseId]);
  }

  newContent(): void {
    this.router.navigate(['/personal/create']);
  }

  toggleProgram(title: string): void {
    this.expandedPrograms.update(set => {
      const next = new Set(set);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  }

  isProgramExpanded(title: string): boolean {
    return this.expandedPrograms().has(title);
  }

  badgeLabel(item: DraftSummary): string {
    if (item.state === 'published') return 'pub';
    if (item.state === 'shared') return 'shared';
    return 'draft';
  }
}
