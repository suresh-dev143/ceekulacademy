import { Injectable, signal } from '@angular/core';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    isOwn: boolean;
    type: 'chat' | 'system';
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AgoraChatService {
    // Lazily loaded SDK reference — typed as any to avoid SSR-unsafe static import
    private client: any = null;
    private channelName = '';
    private currentUid = '';
    private currentName = '';

    // ── State signals ──────────────────────────────────────────────────────────
    readonly messages = signal<ChatMessage[]>([]);
    readonly isConnected = signal(false);
    readonly unreadCount = signal(0);

    // ── Connect ────────────────────────────────────────────────────────────────

    async connect(
        appId: string,
        rtmToken: string,
        rtmUid: string,
        channelName: string,
        userName: string
    ): Promise<void> {
        // Dynamic import keeps this browser-only — same pattern as AgoraService
        // The default export is an object { RTM, BUILD, VERSION, ... }
        const { RTM } = (await import('agora-rtm-sdk')).default as any;

        this.currentUid = rtmUid;
        this.currentName = userName;
        this.channelName = channelName;

        this.client = new RTM(appId, rtmUid);

        // ── Incoming messages ─────────────────────────────────────────────────
        (this.client as any).addEventListener('message', (event: any) => {
            if (event.channelName !== this.channelName) return;
            const { name, text } = this.parsePayload(event.message);
            this.messages.update(list => [...list, {
                id: `${event.publisher}-${Date.now()}`,
                text,
                senderId: event.publisher,
                senderName: name,
                timestamp: new Date(),
                isOwn: false, // own messages added immediately in send()
                type: 'chat',
            }]);
            this.unreadCount.update(c => c + 1);
        });

        // ── Presence (join / leave notifications) ─────────────────────────────
        (this.client as any).addEventListener('presence', (event: any) => {
            if (event.channelName !== this.channelName) return;
            if (event.eventType === 'REMOTE_JOIN') {
                this.addSystem('Someone joined the room.');
            } else if (event.eventType === 'REMOTE_LEAVE' || event.eventType === 'REMOTE_TIMEOUT') {
                this.addSystem('Someone left the room.');
            }
        });

        await (this.client as any).login({ token: rtmToken || '' });
        await (this.client as any).subscribe(channelName, {
            withMessage: true,
            withPresence: true,
        });

        this.isConnected.set(true);
    }

    // ── Send ───────────────────────────────────────────────────────────────────

    async send(text: string): Promise<void> {
        const trimmed = text.trim();
        if (!trimmed || !this.client || !this.isConnected()) return;

        const payload = JSON.stringify({ name: this.currentName, text: trimmed });
        await (this.client as any).publish(this.channelName, payload);

        // RTM v2 does not echo back own messages — add immediately
        this.messages.update(list => [...list, {
            id: `self-${Date.now()}`,
            text: trimmed,
            senderId: this.currentUid,
            senderName: this.currentName,
            timestamp: new Date(),
            isOwn: true,
            type: 'chat',
        }]);
    }

    clearUnread(): void {
        this.unreadCount.set(0);
    }

    // ── Disconnect ─────────────────────────────────────────────────────────────

    async disconnect(): Promise<void> {
        try {
            await (this.client as any)?.unsubscribe(this.channelName);
            await (this.client as any)?.logout();
        } catch { /* ignore cleanup errors */ }
        this.client = null;
        this.messages.set([]);
        this.isConnected.set(false);
        this.unreadCount.set(0);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private parsePayload(raw: string): { name: string; text: string } {
        try {
            const p = JSON.parse(raw);
            return { name: p.name || 'Participant', text: p.text || raw };
        } catch {
            return { name: 'Participant', text: raw };
        }
    }

    private addSystem(text: string): void {
        this.messages.update(list => [...list, {
            id: `sys-${Date.now()}`,
            text,
            senderId: 'system',
            senderName: 'System',
            timestamp: new Date(),
            isOwn: false,
            type: 'system',
        }]);
    }

    /** Consistent avatar colour from sender ID */
    avatarColor(senderId: string): string {
        const palette = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899'];
        let hash = 0;
        for (let i = 0; i < senderId.length; i++) hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
        return palette[Math.abs(hash) % palette.length];
    }

    /** First character initial for avatar */
    avatarInitial(name: string): string {
        return (name || '?').charAt(0).toUpperCase();
    }
}
