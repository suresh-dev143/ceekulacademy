import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  inject, signal, ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MicroHook }    from '../../services/content-atom.service';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector:    'app-trigger-mode',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './trigger-mode.html',
  styleUrls:   ['./trigger-mode.scss']
})
export class TriggerModeComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() hook!: MicroHook;
  @Input() animationProfile: any = {};
  @Output() engaged  = new EventEmitter<void>();
  @Output() skipped  = new EventEmitter<void>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private userState = inject(UserStateService);

  visible      = signal(false);
  textRevealed = signal(false);
  countdown    = signal(0);

  private autoTimer: any   = null;
  private countTimer: any  = null;
  private animFrame: any   = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];

  readonly DISPLAY_MS = 8_000;

  ngOnInit() {
    this.userState.recordTriggerShown();
    this.countdown.set(Math.ceil(this.DISPLAY_MS / 1000));
  }

  ngAfterViewInit() {
    // Small delay for CSS entry animation
    setTimeout(() => {
      this.visible.set(true);
      setTimeout(() => this.textRevealed.set(true), 300);
    }, 50);

    // Particle canvas
    if (this.canvasRef?.nativeElement) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d');
      this._resizeCanvas();
      this._spawnParticles();
      this._animateParticles();
    }

    // Countdown + auto-advance
    this.countTimer = setInterval(() => {
      this.countdown.update(n => Math.max(0, n - 1));
    }, 1000);

    this.autoTimer = setTimeout(() => this.onSkip(), this.DISPLAY_MS);
  }

  ngOnDestroy() {
    clearTimeout(this.autoTimer);
    clearInterval(this.countTimer);
    cancelAnimationFrame(this.animFrame);
  }

  onEngage() {
    this.userState.recordTriggerResponse();
    this.userState.sendReward('trigger_responded');
    clearTimeout(this.autoTimer);
    clearInterval(this.countTimer);
    this.engaged.emit();
  }

  onSkip() {
    clearTimeout(this.autoTimer);
    clearInterval(this.countTimer);
    this.skipped.emit();
  }

  get colorClass(): string {
    const map: Record<string, string> = {
      indigo:  'trigger--indigo',
      emerald: 'trigger--emerald',
      amber:   'trigger--amber',
      rose:    'trigger--rose',
      cyan:    'trigger--cyan'
    };
    return map[this.hook?.colorScheme || 'indigo'] || 'trigger--indigo';
  }

  private _resizeCanvas() {
    const el = this.canvasRef.nativeElement;
    el.width  = el.offsetWidth;
    el.height = el.offsetHeight;
  }

  private _spawnParticles() {
    const count = (this.animationProfile?.particleCount ?? 20);
    const el    = this.canvasRef.nativeElement;
    this.particles = Array.from({ length: count }, () => new Particle(el.width, el.height));
  }

  private _animateParticles() {
    if (!this.ctx || !this.canvasRef) return;
    const el = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, el.width, el.height);
    for (const p of this.particles) {
      p.update(el.width, el.height);
      p.draw(this.ctx);
    }
    this.animFrame = requestAnimationFrame(() => this._animateParticles());
  }
}

class Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number;
  color: string;

  constructor(w: number, h: number) {
    this.x     = Math.random() * w;
    this.y     = Math.random() * h;
    this.vx    = (Math.random() - 0.5) * 0.6;
    this.vy    = (Math.random() - 0.5) * 0.6;
    this.r     = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.5 + 0.1;
    const hue  = Math.random() > 0.5 ? '250, 82%, 60%' : '210, 100%, 60%';
    this.color = `hsla(${hue}, ${this.alpha})`;
  }

  update(w: number, h: number) {
    this.x = (this.x + this.vx + w) % w;
    this.y = (this.y + this.vy + h) % h;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
