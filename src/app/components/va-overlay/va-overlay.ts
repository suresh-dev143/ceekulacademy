import {
  Component, inject, signal, computed, effect,
  ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VaService, VaMessage, VolunteerPing, AvatarExpression } from '../../services/va.service';
import { DeviceContextService } from '../../services/device-context.service';
import { AuthService } from '../../services/auth.service';
import { SemanticContextService } from '../../services/semantic-context.service';

type AvatarState = 'idle' | 'listening' | 'speaking' | 'thinking';

const EXPR_LABEL: Record<AvatarExpression, string> = {
  neutral:    'Ready',
  happy:      'Happy to help!',
  empathetic: 'I understand',
  thinking:   'Thinking...',
  concerned:  'I hear you',
  alert:      'Alert',
  greeting:   'Hello!',
};

type AssistanceMode = 'mentor' | 'navigator' | 'advocate' | 'collaborator' | 'coordinator';

const PERSONA: Record<AssistanceMode, { name: string; sub: string; expr: AvatarExpression }> = {
  mentor:      { name: 'MENTOR',      sub: 'Your learning companion',      expr: 'happy'      },
  navigator:   { name: 'NAVIGATOR',   sub: 'Semantic wayfinder',           expr: 'neutral'    },
  advocate:    { name: 'ADVOCATE',    sub: 'Welfare & solidarity guide',    expr: 'empathetic' },
  collaborator:{ name: 'COLLABORATOR',sub: 'Research co-pilot',            expr: 'thinking'   },
  coordinator: { name: 'COORDINATOR', sub: 'Family & village orchestrator', expr: 'greeting'   },
};

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-va-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- ── FAB ─────────────────────────────────────────────────────────────────── -->
@if (!isOpen()) {
  <button class="va-fab" (click)="open()" title="Open Ceekul Assistant"
    [attr.data-expr]="idleExpression()">
    <div class="va-orb" [attr.data-state]="avatarState()">
      <div class="va-orb-ring outer"></div>
      <div class="va-orb-ring inner"></div>
      <div class="va-orb-core">
        <div class="va-waveform">
          @for (b of [1,2,3,4,5]; track b) {
            <div class="va-wave-bar" [style.--i]="b"></div>
          }
        </div>
        <span class="va-orb-glyph">⬡</span>
      </div>
    </div>
    @if (socketConnected()) {
      <span class="va-fab-dot"></span>
    }
  </button>
}

<!-- ── PANEL ─────────────────────────────────────────────────────────────────── -->
@if (isOpen()) {
  <div class="va-panel" [attr.data-tier]="renderTier()">

    <!-- Header -->
    <div class="va-panel-header">
      <div class="va-header-avatar" [attr.data-expr]="idleExpression()" [attr.data-state]="avatarState()">
        <div class="va-orb small">
          <div class="va-orb-ring outer"></div>
          <div class="va-orb-ring inner"></div>
          <div class="va-orb-core">
            <div class="va-waveform">
              @for (b of [1,2,3,4,5]; track b) {
                <div class="va-wave-bar" [style.--i]="b"></div>
              }
            </div>
            <span class="va-orb-glyph">⬡</span>
          </div>
        </div>
      </div>

      <div class="va-header-text">
        <div class="va-h-name">{{ persona().name }}</div>
        <div class="va-h-status">
          {{ socketConnected() ? '● ' : '◌ ' }}{{ statusLabel() }}
        </div>
      </div>

      <div class="va-header-actions">
        <button class="va-icon-btn" (click)="toggleVoice()"
          [title]="voiceEnabled() ? 'Mute voice' : 'Enable voice'">
          {{ voiceEnabled() ? '🔊' : '🔇' }}
        </button>
        <button class="va-icon-btn close-btn" (click)="close()">✕</button>
      </div>
    </div>

    <!-- Escalation banner -->
    @if (escalationStatus() === 'searching' || escalationStatus() === 'tier2') {
      <div class="va-banner searching">
        <span class="va-banner-dot"></span>
        {{ escalationStatus() === 'tier2' ? 'Escalating to specialist...' : 'Connecting you to a volunteer...' }}
      </div>
    }
    @if (escalationStatus() === 'connected') {
      <div class="va-banner connected">
        <span class="va-banner-dot solid"></span>
        Volunteer connected — you're not alone.
      </div>
    }

    <!-- Volunteer ping notification (for Volunteer role users) -->
    @if (activePing()) {
      <div class="va-ping-card">
        <div class="va-ping-header">
          <span class="va-ping-icon">◈</span>
          <div>
            <div class="va-ping-title">Support Request</div>
            <div class="va-ping-from">{{ activePing()!.userName }} · {{ activePing()!.domain }}</div>
          </div>
          <div class="va-ping-countdown" [class.urgent]="pingCountdown() <= 10">
            {{ pingCountdown() }}s
          </div>
        </div>
        <p class="va-ping-msg">{{ activePing()!.message }}</p>
        <div class="va-ping-actions">
          <button class="va-ping-btn accept" (click)="acceptPing()">Accept</button>
          <button class="va-ping-btn decline" (click)="declinePing()">Decline</button>
        </div>
        <!-- Countdown ring -->
        <svg class="va-ping-ring" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c4dff" stroke-width="2"
            stroke-linecap="round"
            [attr.stroke-dasharray]="pingRingDash() + ' 100'"
            stroke-dashoffset="25" transform="rotate(-90 18 18)"/>
        </svg>
      </div>
    }

    <!-- Messages -->
    <div class="va-messages" #msgList>
      @if (messages().length === 0) {
        <div class="va-empty">
          <div class="va-empty-orb" [attr.data-expr]="idleExpression()">
            <span class="va-empty-glyph">⬡</span>
          </div>
          <div class="va-empty-title">{{ persona().name }}</div>
          <div class="va-empty-sub">{{ persona().sub }}</div>
        </div>
      }
      @for (msg of messages(); track msg.ts) {
        <div class="va-msg" [class.user]="msg.role === 'user'" [class.va]="msg.role === 'va'">
          @if (msg.role === 'va') {
            <div class="va-msg-avatar" [attr.data-expr]="msg.expression ?? 'neutral'">⬡</div>
          }
          <div class="va-bubble">{{ msg.text }}</div>
        </div>
      }
      @if (avatarState() === 'thinking') {
        <div class="va-msg va">
          <div class="va-msg-avatar" data-expr="thinking">⬡</div>
          <div class="va-typing">
            <div class="va-typing-dot" style="--d:0s"></div>
            <div class="va-typing-dot" style="--d:0.18s"></div>
            <div class="va-typing-dot" style="--d:0.36s"></div>
          </div>
        </div>
      }
    </div>

    <!-- Mood strip: persona sub-label at idle, expression label when active -->
    <div class="va-mood-strip" [attr.data-expr]="idleExpression()">
      {{ avatarState() === 'idle' ? persona().sub : EXPR_LABEL[expression()] }}
    </div>

    <!-- Input bar -->
    <div class="va-input-bar">
      <input
        class="va-input"
        [(ngModel)]="inputText"
        placeholder="Ask anything..."
        (keydown.enter)="send()"
        (input)="onTyping()"
        [disabled]="avatarState() === 'thinking'"
        autocomplete="off"
      />
      <button class="va-send-btn" (click)="send()"
        [disabled]="avatarState() === 'thinking' || !inputText.trim()">
        <span>↑</span>
      </button>
    </div>

  </div>
}
  `,
  styles: [`
    :host {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ════════════════════════ ORB EXPRESSION VARS ═══════════════════════════ */
    [data-expr="neutral"]    { --oc: #64ffda; --og: rgba(100,255,218,0.55); --ob: #0a2a22; }
    [data-expr="happy"]      { --oc: #00ff88; --og: rgba(0,255,136,0.55);  --ob: #002a12; }
    [data-expr="empathetic"] { --oc: #c084fc; --og: rgba(192,132,252,0.55);--ob: #1e0a2a; }
    [data-expr="thinking"]   { --oc: #60a5fa; --og: rgba(96,165,250,0.55); --ob: #0a1a2a; }
    [data-expr="concerned"]  { --oc: #fbbf24; --og: rgba(251,191,36,0.55); --ob: #2a1a00; }
    [data-expr="alert"]      { --oc: #f87171; --og: rgba(248,113,113,0.55);--ob: #2a0a0a; }
    [data-expr="greeting"]   { --oc: #34d399; --og: rgba(52,211,153,0.55); --ob: #002a1a; }

    /* ════════════════════════ ORB STRUCTURE ════════════════════════════════ */
    .va-orb {
      position: relative;
      width: 52px; height: 52px;
    }
    .va-orb.small { width: 40px; height: 40px; }

    .va-orb-core {
      position: absolute; inset: 8px; border-radius: 50%;
      background: radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--oc) 60%, white), var(--ob));
      box-shadow: 0 0 20px var(--og), inset 0 0 10px rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      animation: va-breathe 2.4s ease-in-out infinite;
    }
    .va-orb.small .va-orb-core { inset: 6px; }

    .va-orb-glyph {
      font-size: 14px; color: rgba(255,255,255,0.9);
      text-shadow: 0 0 8px var(--oc);
      position: relative; z-index: 2;
    }
    .va-orb.small .va-orb-glyph { font-size: 11px; }

    .va-orb-ring {
      position: absolute; border-radius: 50%;
      border: 1px solid color-mix(in srgb, var(--oc) 45%, transparent);
    }
    .va-orb-ring.outer { inset: 0; }
    .va-orb-ring.inner { inset: 3px; border-color: color-mix(in srgb, var(--oc) 25%, transparent); }

    /* ── Waveform (visible only in speaking state) ── */
    .va-waveform {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center; gap: 2px;
      opacity: 0; transition: opacity 0.3s;
    }
    .va-wave-bar {
      width: 2px; background: var(--oc); border-radius: 2px;
      height: 6px;
    }

    /* ════════════════════════ AVATAR STATE ANIMATIONS ══════════════════════ */
    @keyframes va-breathe {
      0%,100% { transform: scale(1);    opacity: 0.88; }
      50%      { transform: scale(1.07); opacity: 1;    }
    }
    @keyframes va-breathe-fast {
      0%,100% { transform: scale(1);    opacity: 0.88; }
      50%      { transform: scale(1.09); opacity: 1;    }
    }
    @keyframes va-speak {
      0%,100% { transform: scale(1.00); }
      20%      { transform: scale(1.10); }
      40%      { transform: scale(1.04); }
      60%      { transform: scale(1.08); }
      80%      { transform: scale(1.03); }
    }
    @keyframes va-wave {
      0%,100% { height: 4px;  }
      50%      { height: 18px; }
    }
    @keyframes va-orbit {
      to { transform: rotate(360deg); }
    }

    /* State: listening */
    [data-state="listening"] .va-orb-core {
      animation: va-breathe-fast 1.1s ease-in-out infinite;
    }
    /* State: thinking */
    [data-state="thinking"] .va-orb-ring.inner {
      animation: va-orbit 0.7s linear infinite;
    }
    [data-state="thinking"] .va-orb-core {
      animation: va-breathe-fast 0.9s ease-in-out infinite;
    }
    /* State: speaking */
    [data-state="speaking"] .va-orb-core {
      animation: va-speak 0.55s ease-in-out infinite;
    }
    [data-state="speaking"] .va-waveform { opacity: 1; }
    [data-state="speaking"] .va-orb-glyph { opacity: 0; }
    [data-state="speaking"] .va-wave-bar {
      animation: va-wave 0.55s ease-in-out infinite;
      animation-delay: calc((var(--i) - 1) * 0.09s);
    }

    /* ════════════════════════ FAB ══════════════════════════════════════════ */
    .va-fab {
      position: relative;
      width: 56px; height: 56px; border-radius: 50%;
      background: color-mix(in srgb, var(--ob) 80%, transparent);
      border: 1px solid color-mix(in srgb, var(--oc) 40%, transparent);
      cursor: pointer; padding: 0;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 24px var(--og);
      display: flex; align-items: center; justify-content: center;
    }
    .va-fab:hover { transform: scale(1.1); box-shadow: 0 6px 32px var(--og); }
    .va-fab .va-orb { width: 100%; height: 100%; }
    .va-fab .va-orb-core { inset: 6px; }
    .va-fab .va-orb-glyph { font-size: 16px; }

    .va-fab-dot {
      position: absolute; top: 4px; right: 4px;
      width: 9px; height: 9px; border-radius: 50%;
      background: #00ff88;
      border: 2px solid #050810;
      box-shadow: 0 0 8px rgba(0,255,136,0.8);
    }

    /* ════════════════════════ PANEL ════════════════════════════════════════ */
    .va-panel {
      width: 360px; height: 560px;
      background: #06080f;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 18px; overflow: hidden;
      display: flex; flex-direction: column;
      box-shadow: 0 20px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(100,255,218,0.06);
    }

    /* Header */
    .va-panel-header {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      background: linear-gradient(135deg, rgba(100,255,218,0.04), transparent);
    }
    .va-header-avatar { flex-shrink: 0; }
    .va-header-text   { flex: 1; }
    .va-h-name  { font-size: 10px; letter-spacing: 2px; color: #f0f4ff; font-weight: 600; }
    .va-h-status {
      font-size: 9px; letter-spacing: 1px; margin-top: 2px;
      color: var(--oc, #4a5568); transition: color 0.4s;
    }
    .va-header-actions { display: flex; gap: 4px; }
    .va-icon-btn {
      background: transparent; border: none; cursor: pointer;
      font-size: 13px; padding: 5px; border-radius: 6px;
      color: #4a5568; transition: color 0.2s, background 0.2s;
    }
    .va-icon-btn:hover { color: #f0f4ff; background: rgba(255,255,255,0.06); }
    .va-icon-btn.close-btn:hover { color: #f87171; }

    /* Banners */
    .va-banner {
      padding: 8px 16px; font-size: 11px; letter-spacing: 0.5px;
      display: flex; align-items: center; gap: 8px;
    }
    .va-banner.searching {
      background: rgba(251,191,36,0.06);
      border-bottom: 1px solid rgba(251,191,36,0.15);
      color: #fbbf24;
    }
    .va-banner.connected {
      background: rgba(100,255,218,0.06);
      border-bottom: 1px solid rgba(100,255,218,0.15);
      color: #64ffda;
    }
    .va-banner-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: currentColor; opacity: 0.6;
      animation: va-breathe 1.6s ease-in-out infinite;
    }
    .va-banner-dot.solid { opacity: 1; animation: none; }

    /* Volunteer ping card */
    .va-ping-card {
      margin: 10px 12px; padding: 14px;
      background: rgba(124,77,255,0.08);
      border: 1px solid rgba(124,77,255,0.3);
      border-radius: 12px; position: relative; overflow: hidden;
    }
    .va-ping-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
    .va-ping-icon { font-size: 18px; color: #7c4dff; flex-shrink: 0; margin-top: 1px; }
    .va-ping-title { font-size: 11px; font-weight: 600; color: #f0f4ff; }
    .va-ping-from  { font-size: 10px; color: #8892a8; margin-top: 2px; }
    .va-ping-countdown {
      margin-left: auto; font-size: 16px; font-weight: 800;
      color: #7c4dff; font-variant-numeric: tabular-nums;
      transition: color 0.3s;
    }
    .va-ping-countdown.urgent { color: #f87171; }
    .va-ping-msg { font-size: 12px; color: #aaa; line-height: 1.5; margin: 0 0 10px; }
    .va-ping-actions { display: flex; gap: 8px; }
    .va-ping-btn {
      flex: 1; padding: 8px; border-radius: 8px; border: none;
      font-size: 11px; letter-spacing: 1px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .va-ping-btn.accept { background: rgba(124,77,255,0.2); color: #a78bfa; border: 1px solid rgba(124,77,255,0.4); }
    .va-ping-btn.accept:hover { background: rgba(124,77,255,0.35); }
    .va-ping-btn.decline { background: transparent; color: #8892a8; border: 1px solid rgba(255,255,255,0.1); }
    .va-ping-btn.decline:hover { border-color: #f87171; color: #f87171; }
    .va-ping-ring {
      position: absolute; top: 10px; right: 48px;
      width: 32px; height: 32px; opacity: 0.5;
    }

    /* Messages */
    .va-messages {
      flex: 1; overflow-y: auto; padding: 12px;
      display: flex; flex-direction: column; gap: 8px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    .va-messages::-webkit-scrollbar { width: 4px; }
    .va-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .va-empty {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px;
    }
    .va-empty-orb {
      width: 60px; height: 60px; border-radius: 50%;
      background: radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--oc) 50%, white), var(--ob));
      box-shadow: 0 0 30px var(--og);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; color: rgba(255,255,255,0.85);
      text-shadow: 0 0 10px var(--oc);
      animation: va-breathe 2.4s ease-in-out infinite;
    }
    .va-empty-title { font-size: 13px; color: #f0f4ff; }
    .va-empty-sub   { font-size: 11px; color: #4a5568; }

    .va-msg {
      display: flex; align-items: flex-end; gap: 7px;
      animation: fadeUp 0.2s ease-out;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .va-msg.user { flex-direction: row-reverse; }

    .va-msg-avatar {
      width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
      background: radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--oc) 50%, white), var(--ob));
      box-shadow: 0 0 8px var(--og);
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; color: rgba(255,255,255,0.9);
    }

    .va-bubble {
      max-width: 230px; padding: 9px 12px; border-radius: 12px;
      font-size: 13px; line-height: 1.45; color: #f0f4ff;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .va-msg.user .va-bubble {
      background: rgba(96,165,250,0.12);
      border-color: rgba(96,165,250,0.22);
    }

    .va-typing {
      display: flex; gap: 4px; align-items: center;
      padding: 10px 14px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
    }
    .va-typing-dot {
      width: 6px; height: 6px; border-radius: 50%; background: var(--oc, #64ffda);
      animation: va-bounce 1.1s ease-in-out infinite;
      animation-delay: var(--d, 0s);
    }
    @keyframes va-bounce {
      0%,80%,100% { transform: translateY(0);   opacity: 0.4; }
      40%          { transform: translateY(-6px); opacity: 1;   }
    }

    /* Mood strip */
    .va-mood-strip {
      padding: 5px 16px;
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
      color: var(--oc, #4a5568); opacity: 0.7;
      border-top: 1px solid rgba(255,255,255,0.04);
      transition: color 0.4s;
    }

    /* Input bar */
    .va-input-bar {
      display: flex; gap: 8px; padding: 10px 12px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .va-input {
      flex: 1; background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 20px; padding: 9px 14px;
      font-size: 13px; color: #f0f4ff; outline: none;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    .va-input:focus { border-color: rgba(100,255,218,0.3); }
    .va-input::placeholder { color: #4a5568; }
    .va-input:disabled { opacity: 0.5; }

    .va-send-btn {
      width: 37px; height: 37px; border-radius: 50%; flex-shrink: 0;
      background: color-mix(in srgb, var(--oc, #64ffda) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--oc, #64ffda) 40%, transparent);
      color: var(--oc, #64ffda); font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, transform 0.15s;
    }
    .va-send-btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--oc, #64ffda) 28%, transparent);
      transform: scale(1.05);
    }
    .va-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  `],
})
export class VaOverlayComponent implements OnInit, AfterViewChecked, OnDestroy {
  protected readonly EXPR_LABEL = EXPR_LABEL;

  private readonly vaService   = inject(VaService);
  private readonly deviceCtx   = inject(DeviceContextService);
  private readonly auth        = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly platform    = inject(PLATFORM_ID);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly semanticCtx = inject(SemanticContextService);

  // ── Persona — adapts to SemanticContextService.assistanceMode ────────────
  readonly persona = computed(() => {
    const mode = this.semanticCtx.assistanceMode();
    return mode ? PERSONA[mode] : { name: 'CEEKUL AVATAR', sub: 'Ask anything about Ceekul.', expr: 'neutral' as AvatarExpression };
  });

  readonly idleExpression = computed<AvatarExpression>(() =>
    this.avatarState() === 'idle' ? this.persona().expr : this.expression()
  );

  @ViewChild('msgList') private msgList?: ElementRef<HTMLElement>;

  // ── Passthrough signals from VaService ──────────────────────────────────
  readonly escalationStatus = this.vaService.escalationStatus;
  readonly expression       = this.vaService.expression;
  readonly renderTier       = this.vaService.renderTier;
  readonly socketConnected  = this.vaService.socketConnected;

  // ── Local state ──────────────────────────────────────────────────────────
  readonly isOpen      = signal(false);
  readonly avatarState = signal<AvatarState>('idle');
  readonly messages    = signal<VaMessage[]>([]);
  readonly voiceEnabled= signal(true);

  // Volunteer pings
  readonly activePing    = signal<VolunteerPing | null>(null);
  readonly pingCountdown = signal(30);
  private _pingTimer: ReturnType<typeof setInterval> | null = null;

  readonly pingRingDash = computed(() =>
    (this.pingCountdown() / 30) * 100
  );

  readonly statusLabel = computed(() => {
    const s = this.escalationStatus();
    if (s === 'searching')  return 'Finding volunteer...';
    if (s === 'tier2')      return 'Escalating...';
    if (s === 'connected')  return 'Volunteer connected';
    return this.socketConnected() ? 'Connected' : 'Ready';
  });

  inputText  = '';
  private _sessionId: string | null = null;
  private _speakTimer: ReturnType<typeof setTimeout> | null = null;
  private _shouldScroll = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platform)) return;

    // Subscribe to volunteer pings
    this.vaService.volunteerPing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ping => this._handlePing(ping));

    // Volunteers need the VA socket connected immediately to receive pings,
    // even if they've never opened the VA panel themselves.
    const role  = (this.auth.currentUserProfile() as any)?.role;
    const token = this.auth.getToken();
    if (role === 'Volunteer' && token) {
      this.vaService.connectVolunteer(token);
    }

    // Try to restore a previous session silently
    this._tryRestoreSession();
  }

  ngAfterViewChecked(): void {
    if (this._shouldScroll && this.msgList) {
      const el = this.msgList.nativeElement;
      el.scrollTop = el.scrollHeight;
      this._shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this._clearPingTimer();
    this._clearSpeakTimer();
    this.deviceCtx.stopSpeaking();
  }

  // ── Panel open / close ────────────────────────────────────────────────────

  async open(): Promise<void> {
    this.isOpen.set(true);
    if (!this._sessionId) await this._startSession();
  }

  close(): void {
    this.isOpen.set(false);
    this.deviceCtx.stopSpeaking();
  }

  toggleVoice(): void { this.voiceEnabled.update(v => !v); }

  onTyping(): void {
    if (this.inputText.trim()) this.avatarState.set('listening');
    else this.avatarState.set('idle');
  }

  // ── Send / receive ────────────────────────────────────────────────────────

  async send(): Promise<void> {
    const text = this.inputText.trim();
    if (!text || this.avatarState() === 'thinking') return;
    if (!this._sessionId) await this._startSession();

    this.inputText = '';
    this.avatarState.set('thinking');
    this.messages.update(m => [...m, { role: 'user', text, ts: new Date() }]);
    this._shouldScroll = true;

    try {
      const res   = await this.vaService.interact(this._sessionId!, text, {
        intent:         this.semanticCtx.intent(),
        domain:         this.semanticCtx.domain(),
        assistanceMode: this.semanticCtx.assistanceMode(),
        workflowName:   this.semanticCtx.workflowLabel(),
        contentCid:     this.semanticCtx.contentCid(),
        depth:          this.semanticCtx.depth(),
      });
      const reply = this.vaService.extractText(res);
      const expr  = (res.communication?.expression ?? res.avatarState?.expression ?? 'neutral') as AvatarExpression;

      this.messages.update(m => [...m, { role: 'va', text: reply, ts: new Date(), expression: expr }]);
      this._shouldScroll = true;
      this.avatarState.set('speaking');

      if (this.voiceEnabled()) {
        this.deviceCtx.speak(reply);
        const speakMs = Math.max(1500, reply.length * 60);
        this._speakTimer = setTimeout(() => this.avatarState.set('idle'), speakMs);
      } else {
        this._speakTimer = setTimeout(() => this.avatarState.set('idle'), 2000);
      }
    } catch {
      this.messages.update(m => [...m, {
        role: 'va', text: 'I had trouble connecting. Please try again.', ts: new Date(),
      }]);
      this.avatarState.set('idle');
    }
  }

  // ── Volunteer ping handlers ───────────────────────────────────────────────

  async acceptPing(): Promise<void> {
    const ping = this.activePing();
    if (!ping) return;
    this._clearPingTimer();
    try {
      await this.vaService.acceptEscalation(ping.escalationId);
      this.activePing.set(null);
      this.router.navigate(['/dashboard/volunteer'], { queryParams: { session: ping.sessionId } });
    } catch {
      this.activePing.set(null);
    }
  }

  declinePing(): void {
    const ping = this.activePing();
    if (!ping) return;
    this._clearPingTimer();
    this.vaService.declineEscalation(ping.escalationId).catch(() => {});
    this.activePing.set(null);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async _startSession(): Promise<void> {
    try {
      const token = this.auth.getToken() ?? undefined;
      const sess  = await this.vaService.startSession(token);
      this._sessionId = sess.sessionId;
    } catch { /* ignore, will retry on next send */ }
  }

  private async _tryRestoreSession(): Promise<void> {
    const token = this.auth.getToken() ?? undefined;
    const sess  = await this.vaService.tryRestoreSession(token);
    if (sess) this._sessionId = sess.sessionId;
  }

  private _handlePing(ping: VolunteerPing): void {
    // Only show to volunteers
    const role = (this.auth.currentUserProfile() as any)?.role;
    if (role !== 'Volunteer') return;

    this._clearPingTimer();
    this.activePing.set(ping);
    this.pingCountdown.set(30);

    this._pingTimer = setInterval(() => {
      this.pingCountdown.update(n => {
        if (n <= 1) {
          this._clearPingTimer();
          this.activePing.set(null);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }

  private _clearPingTimer(): void {
    if (this._pingTimer) { clearInterval(this._pingTimer); this._pingTimer = null; }
  }

  private _clearSpeakTimer(): void {
    if (this._speakTimer) { clearTimeout(this._speakTimer); this._speakTimer = null; }
  }
}
