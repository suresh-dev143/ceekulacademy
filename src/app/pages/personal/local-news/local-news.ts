import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalNewsService, LocalNewsItem } from '../../../services/local-news.service';

@Component({
  selector: 'app-local-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './local-news.html',
  styleUrl: './local-news.scss'
})
export class LocalNewsPage {
  readonly localNews = inject(LocalNewsService);

  readonly subjectFilter = signal('');
  readonly areaFilter = signal('');
  readonly filtersOpen = signal(false);

  readonly filteredPersonalized = computed(() =>
    this.applyFilters(this.localNews.personalized)
  );

  readonly filteredNearby = computed(() =>
    this.applyFilters(this.localNews.nearby)
  );

  readonly hasActiveFilter = computed(() =>
    this.subjectFilter().trim() !== '' || this.areaFilter().trim() !== ''
  );

  toggleFilters(): void {
    this.filtersOpen.update(v => !v);
  }

  private applyFilters(items: LocalNewsItem[]): LocalNewsItem[] {
    const subj = this.subjectFilter().trim().toLowerCase();
    const areaKm = parseFloat(this.areaFilter());

    return items.filter(item => {
      const matchesSubject = !subj ||
        item.title.toLowerCase().includes(subj) ||
        item.tag.toLowerCase().includes(subj);

      const matchesArea = isNaN(areaKm) || item.distance <= areaKm;

      return matchesSubject && matchesArea;
    });
  }

  clearFilters(): void {
    this.subjectFilter.set('');
    this.areaFilter.set('');
  }
}
