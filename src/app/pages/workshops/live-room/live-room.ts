import {
    Component, OnInit, OnDestroy, inject, signal, computed, effect, ElementRef, ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgoraService } from '../../../services/agora.service';
import { AgoraChatService } from '../../../services/agora-chat.service';
import { WorkshopService, WorkshopApiSchedule } from '../../../services/workshop.service';
import { AuthService } from '../../../services/auth.service';
import { AdOverlayComponent } from '../../../components/ad-overlay/ad-overlay.component';

@Component({
    selector: 'app-live-room',
    standalone: true,
    imports: [FormsModule, AdOverlayComponent],
    templateUrl: './live-room.html',
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            height: 100dvh;
            background: #0f1117;
            color: #fff;
            overflow: hidden;
        }

        /* ── Header ── */
        .live-header {
            display: flex;
            align-items: center;
            gap: .75rem;
            padding: .75rem 1rem;
            background: #1a1a2e;
            border-bottom: 1px solid rgba(255,255,255,.08);
            flex-shrink: 0;
        }
        .back-btn {
            background: none; border: none; color: #94a3b8;
            font-size: 1.2rem; cursor: pointer; padding: .25rem .5rem;
        }
        .back-btn:hover { color: #fff; }
        .mode-badge {
            padding: .25rem .75rem; border-radius: 999px;
            font-size: .75rem; font-weight: 700; letter-spacing: .05em;
        }
        .mode-badge.broadcast { background: #dc2626; }
        .mode-badge.interactive { background: #2563eb; }
        .room-title {
            flex: 1; font-size: .9rem; font-weight: 500;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .participant-count {
            font-size: .8rem; color: #64748b;
            white-space: nowrap;
        }

        /* ── Video grid ── */
        .video-area {
            flex: 1; overflow: hidden; padding: .75rem;
            display: grid; gap: .5rem;
        }
        .video-area.single     { grid-template-columns: 1fr; }
        .video-area.dual       { grid-template-columns: repeat(2, 1fr); }
        .video-area.quad       { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); }
        .video-area.multi      { grid-template-columns: repeat(3, 1fr); }
        .video-area.broadcast  { grid-template-columns: 1fr; grid-template-rows: 1fr; }

        .video-tile {
            position: relative;
            background: #1e1e2e;
            border-radius: 10px;
            overflow: hidden;
            min-height: 120px;
        }
        .video-el {
            width: 100%; height: 100%;
        }
        .name-tag {
            position: absolute; bottom: .5rem; left: .75rem;
            font-size: .75rem; background: rgba(0,0,0,.6);
            padding: .15rem .5rem; border-radius: 4px;
        }
        .muted-icon {
            position: absolute; top: .5rem; right: .5rem;
            font-size: .85rem; background: rgba(0,0,0,.5);
            padding: .15rem .4rem; border-radius: 4px;
        }
        .avatar-placeholder {
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            background: #1e2d45;
            font-size: 2rem; color: #94a3b8;
        }
        .local-tile { border: 2px solid #3b82f6; }

        /* Waiting message */
        .waiting-msg {
            grid-column: 1/-1;
            display: flex; align-items: center; justify-content: center;
            color: #64748b; font-size: .95rem;
        }

        /* ── Controls ── */
        .controls-bar {
            display: flex; align-items: center; justify-content: center;
            gap: 1rem; padding: .75rem 1rem;
            background: #1a1a2e;
            border-top: 1px solid rgba(255,255,255,.08);
            flex-shrink: 0;
        }
        .ctrl-btn {
            display: flex; flex-direction: column; align-items: center; gap: .2rem;
            background: #2d2d44; border: none; border-radius: 12px;
            color: #fff; cursor: pointer; padding: .6rem 1.2rem;
            font-size: .7rem; transition: background .15s;
        }
        .ctrl-btn .icon { font-size: 1.3rem; }
        .ctrl-btn:hover { background: #3d3d60; }
        .ctrl-btn.off { background: #dc2626; }
        .ctrl-btn.off:hover { background: #b91c1c; }
        .leave-btn {
            background: #ef4444; border: none; border-radius: 12px;
            color: #fff; cursor: pointer; padding: .6rem 1.8rem;
            font-size: .85rem; font-weight: 600; transition: background .15s;
        }
        .leave-btn:hover { background: #dc2626; }

        /* ── Loading / Error overlays ── */
        .overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,.88);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 1rem; z-index: 100;
        }
        .spinner {
            width: 44px; height: 44px;
            border: 3px solid rgba(255,255,255,.15);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .overlay p { color: #94a3b8; font-size: .9rem; }

        .error-card {
            background: #1e1e2e; border-radius: 14px;
            padding: 2rem; text-align: center; max-width: 380px;
        }
        .error-card h2 { color: #f87171; margin-bottom: .5rem; }
        .error-card p { color: #94a3b8; font-size: .9rem; }
        .error-card button {
            margin-top: 1.25rem; padding: .6rem 1.75rem;
            background: #3b82f6; color: #fff;
            border: none; border-radius: 8px; cursor: pointer;
            font-size: .9rem;
        }

        /* ── Chat panel ── */
        .room-body {
            flex: 1; display: flex; overflow: hidden;
        }
        .video-area {
            flex: 1; overflow: hidden; padding: .75rem;
            display: grid; gap: .5rem;
            transition: flex .25s ease;
        }
        .chat-panel {
            width: 300px; min-width: 260px;
            display: flex; flex-direction: column;
            background: #111827;
            border-left: 1px solid rgba(255,255,255,.08);
            transition: width .25s ease;
        }
        .chat-panel.hidden { width: 0; min-width: 0; overflow: hidden; }

        .chat-header {
            padding: .6rem 1rem;
            border-bottom: 1px solid rgba(255,255,255,.08);
            font-size: .8rem; font-weight: 600; color: #94a3b8;
            flex-shrink: 0;
        }
        .chat-messages {
            flex: 1; overflow-y: auto; padding: .75rem;
            display: flex; flex-direction: column; gap: .6rem;
        }
        .chat-msg {
            display: flex; gap: .5rem; align-items: flex-start;
        }
        .chat-msg.own { flex-direction: row-reverse; }
        .chat-avatar {
            width: 28px; height: 28px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: .7rem; font-weight: 700; flex-shrink: 0;
        }
        .chat-bubble {
            max-width: 75%; padding: .4rem .65rem;
            border-radius: 10px; font-size: .8rem; line-height: 1.4;
            background: #1e293b; color: #e2e8f0;
        }
        .chat-msg.own .chat-bubble { background: #1d4ed8; }
        .chat-msg.system .chat-bubble {
            background: transparent; color: #64748b;
            font-style: italic; font-size: .75rem;
        }
        .chat-sender {
            font-size: .7rem; color: #64748b; margin-bottom: .15rem;
        }
        .chat-input-row {
            display: flex; gap: .4rem; padding: .6rem;
            border-top: 1px solid rgba(255,255,255,.08); flex-shrink: 0;
        }
        .chat-input {
            flex: 1; background: #1e293b; border: 1px solid rgba(255,255,255,.1);
            border-radius: 8px; color: #fff; padding: .45rem .7rem;
            font-size: .82rem; outline: none;
        }
        .chat-input:focus { border-color: #3b82f6; }
        .chat-send-btn {
            background: #3b82f6; border: none; border-radius: 8px;
            color: #fff; cursor: pointer; padding: .45rem .75rem;
            font-size: .85rem; transition: background .15s;
        }
        .chat-send-btn:hover { background: #2563eb; }
        .chat-send-btn:disabled { background: #374151; cursor: default; }

        /* Chat toggle button */
        .ctrl-btn .badge {
            position: absolute; top: -4px; right: -4px;
            background: #ef4444; color: #fff;
            border-radius: 999px; font-size: .65rem;
            min-width: 16px; height: 16px;
            display: flex; align-items: center; justify-content: center;
            padding: 0 3px;
        }
        .ctrl-btn { position: relative; }
    `]
})
export class LiveRoomComponent implements OnInit, OnDestroy {
    readonly agora = inject(AgoraService);
    readonly chat = inject(AgoraChatService);
    private readonly workshopSvc = inject(WorkshopService);
    private readonly auth = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    @ViewChild('chatMessages') private chatMessagesEl?: ElementRef<HTMLElement>;
    @ViewChild('adOverlay') private adOverlay?: AdOverlayComponent;

    workshopId = '';
    scheduleId = '';

    readonly loading = signal(true);
    readonly errorMsg = signal('');
    readonly workshopTitle = signal('');
    readonly schedule = signal<WorkshopApiSchedule | null>(null);
    readonly showChat = signal(false);
    chatInput = '';

    readonly participantCount = computed(() =>
        this.agora.remoteParticipants().length + (this.agora.isJoined() ? 1 : 0)
    );

    readonly gridClass = computed(() => {
        const count = this.agora.remoteParticipants().length + (this.agora.isHost() ? 1 : 0);
        const mode = this.schedule()?.streamMode;
        if (mode === 'live_broadcast') return 'broadcast';
        if (count <= 1) return 'single';
        if (count === 2) return 'dual';
        if (count <= 4) return 'quad';
        return 'multi';
    });

    constructor() {
        // After Angular renders participant tiles, play their video tracks
        effect(() => {
            const participants = this.agora.remoteParticipants();
            Promise.resolve().then(() => {
                for (const p of participants) {
                    if (p.videoTrack && p.hasVideo) {
                        const el = document.getElementById(`remote-video-${p.uid}`);
                        if (el && el.childElementCount === 0) {
                            p.videoTrack.play(el as HTMLElement);
                        }
                    }
                }
            });
        });

        // Auto-scroll chat to bottom on new messages
        effect(() => {
            this.chat.messages(); // track
            Promise.resolve().then(() => {
                if (this.chatMessagesEl?.nativeElement) {
                    this.chatMessagesEl.nativeElement.scrollTop =
                        this.chatMessagesEl.nativeElement.scrollHeight;
                }
            });
        });
    }

    async ngOnInit(): Promise<void> {
        this.workshopId = this.route.snapshot.paramMap.get('workshopId') ?? '';
        this.scheduleId = this.route.snapshot.paramMap.get('scheduleId') ?? '';

        if (!this.workshopId || !this.scheduleId) {
            this.errorMsg.set('Invalid room URL.');
            this.loading.set(false);
            return;
        }

        try {
            // 1. Resolve workshop title + schedule details (needed for mode badge, etc.)
            const workshopRes = await this.workshopSvc
                .getWorkshopById(this.workshopId)
                .toPromise();
            if (!workshopRes?.status) {
                throw new Error(workshopRes?.message ?? 'Failed to load workshop.');
            }
            this.workshopTitle.set(workshopRes.data.workshopTitle);
            const sched = workshopRes.data.schedules.find(s => s._id === this.scheduleId);
            if (!sched) throw new Error('Schedule not found in this workshop.');
            this.schedule.set(sched);

            // 2. Get Agora token — backend validates enrollment and assigns role
            const tokenRes = await this.workshopSvc
                .getAgoraToken(this.workshopId, this.scheduleId)
                .toPromise();
            if (!tokenRes?.status) {
                throw new Error(tokenRes?.message ?? 'Could not get stream token.');
            }

            // 3. Join the channel
            await this.agora.join({
                appId: tokenRes.data.appId,
                channel: tokenRes.data.channelName,
                token: tokenRes.data.token,
                uid: tokenRes.data.uid,
                mode: tokenRes.data.mode,
                role: tokenRes.data.role,
            });

            // 4. Render local video for hosts after DOM settles
            if (tokenRes.data.role === 'host') {
                Promise.resolve().then(() => this.agora.playLocalVideo('local-video'));
            }

            // 5. Connect to live chat via RTM
            const user = this.auth.currentUserProfile();
            const userName = user?.name || user?.email || 'Participant';
            await this.chat.connect(
                tokenRes.data.appId,
                tokenRes.data.rtmToken,
                tokenRes.data.rtmUid,
                tokenRes.data.channelName,
                userName
            );

            this.loading.set(false);

            // Schedule ad overlay for the last 10 minutes of this session
            this._scheduleAdOverlay(sched);
        } catch (err: any) {
            this.errorMsg.set(err?.message ?? 'Unable to join the live room.');
            this.loading.set(false);
        }
    }

    /**
     * Computes the remaining seconds in the schedule and arms the ad overlay
     * to fire when 10 minutes remain. Uses a random session ID since workshops
     * don't have a separate lecture session concept.
     */
    private _scheduleAdOverlay(sched: WorkshopApiSchedule): void {
        // Parse HH:mm end time relative to today
        const [endH, endM] = sched.endTime.split(':').map(Number);
        const now = new Date();
        const end = new Date(now);
        end.setHours(endH, endM, 0, 0);

        // If the end time has already passed (e.g. late join), bail out
        const remainingSecs = Math.floor((end.getTime() - now.getTime()) / 1000);
        if (remainingSecs <= 0) return;

        // Wait for the view to render the overlay element, then arm it
        Promise.resolve().then(() => {
            if (!this.adOverlay) return;
            const sessionId = `ws-${this.scheduleId}-${Date.now()}`;
            this.adOverlay.startLiveModeWatch(
                { contentId: this.workshopId, sessionId },
                remainingSecs
            );
        });
    }

    async ngOnDestroy(): Promise<void> {
        await this.chat.disconnect();
        if (this.agora.isJoined()) {
            await this.agora.leave();
        }
    }

    async toggleMic(): Promise<void> { await this.agora.toggleMic(); }
    async toggleCamera(): Promise<void> { await this.agora.toggleCamera(); }

    toggleChat(): void {
        this.showChat.update(v => !v);
        if (this.showChat()) {
            this.chat.clearUnread();
        }
    }

    async sendChatMessage(): Promise<void> {
        const text = this.chatInput.trim();
        if (!text) return;
        this.chatInput = '';
        await this.chat.send(text);
    }

    onChatKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendChatMessage();
        }
    }

    async leave(): Promise<void> {
        await this.chat.disconnect();
        await this.agora.leave();
        this.router.navigate(['/workshops', this.workshopId]);
    }

    goBack(): void {
        this.router.navigate(['/workshops', this.workshopId]);
    }
}
