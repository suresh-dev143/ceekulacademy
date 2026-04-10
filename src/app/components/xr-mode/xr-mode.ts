import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit,
  inject, signal, ElementRef, ViewChild, PLATFORM_ID
} from '@angular/core';
import { CommonModule }     from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { ContentAtom, XrScene } from '../../services/content-atom.service';
import { UserStateService }      from '../../services/user-state.service';

@Component({
  selector:    'app-xr-mode',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './xr-mode.html',
  styleUrls:   ['./xr-mode.scss']
})
export class XrModeComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() atom!: ContentAtom;
  @Input() animationProfile: any = {};
  @Output() completed  = new EventEmitter<void>();
  @Output() modeSwitch = new EventEmitter<'research' | 'cinematic'>();

  @ViewChild('xrCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);
  private userState  = inject(UserStateService);

  activePoint     = signal<string | null>(null);
  rotationX       = signal(0);
  rotationY       = signal(0);
  sceneLoaded     = signal(false);
  dwellStart      = 0;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrame: any = null;
  private isDragging = false;
  private lastMouse  = { x: 0, y: 0 };
  private cube = { rx: 0.3, ry: 0.5 };  // rotation state

  get xr(): XrScene { return this.atom?.xr; }

  get lightingStyle(): Record<string, string> {
    const presets: Record<string, string> = {
      warm:     'rgba(255,160,80,0.12)',
      cool:     'rgba(80,160,255,0.12)',
      dramatic: 'rgba(180,80,255,0.12)',
      neon:     'rgba(0,255,200,0.10)',
      neutral:  'rgba(100,100,180,0.08)'
    };
    const bg = presets[this.xr?.lightingPreset || 'neutral'] || 'rgba(100,100,180,0.08)';
    return { background: `radial-gradient(ellipse at 40% 30%, ${bg}, transparent 70%)` };
  }

  ngOnInit() {
    this.dwellStart = Date.now();
  }

  ngAfterViewInit() {
    if (!this.isBrowser || !this.canvasRef?.nativeElement) return;
    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    this._resizeCanvas();
    setTimeout(() => {
      this.sceneLoaded.set(true);
      this._animate();
    }, 600);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrame);
    const sec = Math.round((Date.now() - this.dwellStart) / 1000);
    this.userState.recordDwell(sec);
  }

  onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.lastMouse  = { x: e.clientX, y: e.clientY };
    this.userState.recordInteraction();
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    this.cube.ry += dx * 0.008;
    this.cube.rx += dy * 0.008;
    this.rotationX.set(Math.round(this.cube.rx * 100) / 100);
    this.rotationY.set(Math.round(this.cube.ry * 100) / 100);
    this.lastMouse = { x: e.clientX, y: e.clientY };
  }

  onMouseUp() { this.isDragging = false; }

  onPointClick(point: string) {
    this.activePoint.set(this.activePoint() === point ? null : point);
    this.userState.recordInteraction();
    this.userState.sendReward('xr_scene_explored');
  }

  onContinue()    { this.completed.emit(); }
  onGoResearch()  { this.modeSwitch.emit('research'); }

  // ── Minimal 3-D wireframe cube ─────────────────────────────────────────────

  private _resizeCanvas() {
    const el = this.canvasRef.nativeElement;
    el.width  = el.offsetWidth;
    el.height = el.offsetHeight;
  }

  private _animate() {
    if (!this.isDragging) {
      this.cube.ry += 0.004;
    }
    this._drawCube();
    this.animFrame = requestAnimationFrame(() => this._animate());
  }

  private _drawCube() {
    if (!this.ctx || !this.canvasRef) return;
    const el = this.canvasRef.nativeElement;
    const W  = el.width;
    const H  = el.height;
    this.ctx.clearRect(0, 0, W, H);

    const rx = this.cube.rx;
    const ry = this.cube.ry;
    const s  = Math.min(W, H) * 0.28;

    const raw: [number,number,number][] = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1]
    ];

    const pts = raw.map(([x,y,z]) => {
      // Rotate Y
      const x1 = x * Math.cos(ry) - z * Math.sin(ry);
      const z1 = x * Math.sin(ry) + z * Math.cos(ry);
      // Rotate X
      const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
      // Project
      const fov = 3;
      const sx  = (x1 / (z2 + fov)) * s + W / 2;
      const sy  = (y2 / (z2 + fov)) * s + H / 2;
      return [sx, sy] as [number,number];
    });

    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];

    this.ctx.strokeStyle = 'rgba(99,102,241,0.7)';
    this.ctx.lineWidth   = 1.5;
    this.ctx.shadowColor = '#6366f1';
    this.ctx.shadowBlur  = 8;

    for (const [a,b] of edges) {
      this.ctx.beginPath();
      this.ctx.moveTo(pts[a][0], pts[a][1]);
      this.ctx.lineTo(pts[b][0], pts[b][1]);
      this.ctx.stroke();
    }

    // Vertices as dots
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle  = '#818cf8';
    for (const [px,py] of pts) {
      this.ctx.beginPath();
      this.ctx.arc(px, py, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }
}
