import {
  Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService }   from '../../services/auth.service';
import { LiveChatComponent } from '../../components/live-chat/live-chat';

interface LectureMeta {
  title:       string;
  description: string;
  videoUrl:    string;
  instructor:  string;
}

@Component({
  selector:    'app-lecture-chat',
  standalone:  true,
  imports:     [CommonModule, LiveChatComponent],
  templateUrl: './lecture-chat.html',
  styleUrls:   ['./lecture-chat.scss']
})
export class LectureChatComponent implements OnInit, OnDestroy {

  private route      = inject(ActivatedRoute);
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  lectureId   = '';
  isTeacher   = false;

  // Resizable split — content height as % (default 60%)
  splitRatio  = signal(60);
  dragging    = false;
  private dragStart = 0;
  private ratioStart = 0;

  lecture     = signal<LectureMeta | null>(null);
  loading     = signal(true);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.lectureId = this.route.snapshot.paramMap.get('lectureId') ?? '';
    this.isTeacher = this.auth.currentUserProfile()?.role === 'Teacher';

    // Placeholder: in production, fetch lecture meta via HTTP
    setTimeout(() => {
      this.lecture.set({
        title:       'Lecture ' + this.lectureId,
        description: 'Live lecture session with real-time chat and AI moderation.',
        videoUrl:    '',
        instructor:  'Instructor'
      });
      this.loading.set(false);
    }, 400);
  }

  ngOnDestroy(): void {}

  // ── Drag-to-resize divider ────────────────────────────────────────────────

  onDividerMousedown(event: MouseEvent): void {
    this.dragging    = true;
    this.dragStart   = event.clientY;
    this.ratioStart  = this.splitRatio();

    const onMove = (e: MouseEvent) => {
      if (!this.dragging) return;
      const shell    = document.querySelector('.lcp-shell') as HTMLElement;
      const totalH   = shell?.clientHeight ?? window.innerHeight;
      const delta    = e.clientY - this.dragStart;
      const newRatio = Math.min(80, Math.max(30, this.ratioStart + (delta / totalH) * 100));
      this.splitRatio.set(Math.round(newRatio));
    };

    const onUp = () => {
      this.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',  onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }
}
