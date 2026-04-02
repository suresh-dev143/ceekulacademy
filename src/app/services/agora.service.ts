// Only `import type` here — TypeScript erases these at compile time.
// The actual SDK module is loaded lazily inside join() so it never
// executes in Node.js during SSR (where `window` is undefined).
import type {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    IRemoteVideoTrack,
    IRemoteAudioTrack,
    UID,
} from 'agora-rtc-sdk-ng';
import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StreamMode = 'live_broadcast' | 'interactive_class';
export type ParticipantRole = 'host' | 'audience';

export interface AgoraJoinOptions {
    appId: string;
    channel: string;
    token: string;
    uid: number;
    mode: StreamMode;
    role: ParticipantRole;
}

export interface RemoteParticipant {
    uid: UID;
    videoTrack?: IRemoteVideoTrack;
    audioTrack?: IRemoteAudioTrack;
    hasVideo: boolean;
    hasAudio: boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AgoraService {
    private client: IAgoraRTCClient | null = null;
    private localAudioTrack: IMicrophoneAudioTrack | null = null;
    private localVideoTrack: ICameraVideoTrack | null = null;

    // Cached SDK reference — populated once on first join(), browser-only
    private sdk: typeof import('agora-rtc-sdk-ng') | null = null;

    // ── State signals ──────────────────────────────────────────────────────────
    readonly isJoined = signal(false);
    readonly isMicOn = signal(false);
    readonly isCameraOn = signal(false);
    readonly isHost = signal(false);
    readonly remoteParticipants = signal<RemoteParticipant[]>([]);
    readonly localUid = signal<UID | null>(null);
    readonly connectionState = signal<string>('DISCONNECTED');

    /** Emits each time a remote video track is ready — component plays it into DOM */
    readonly remoteVideoReady$ = new Subject<{ uid: UID; track: IRemoteVideoTrack }>();

    // ── Join ───────────────────────────────────────────────────────────────────

    async join(options: AgoraJoinOptions): Promise<void> {
        // Dynamic import: only evaluated in the browser, never during SSR.
        // This is the single fix that prevents "window is not defined".
        if (!this.sdk) {
            this.sdk = await import('agora-rtc-sdk-ng');
        }
        const AgoraRTC = this.sdk.default;

        const sdkMode = options.mode === 'live_broadcast' ? 'live' : 'rtc';
        this.client = AgoraRTC.createClient({ mode: sdkMode, codec: 'vp8' });
        this.registerEvents();

        if (options.mode === 'live_broadcast') {
            await this.client.setClientRole(
                options.role === 'host' ? 'host' : 'audience',
                options.role === 'audience' ? { level: 1 } : undefined
            );
        }

        const uid = await this.client.join(
            options.appId,
            options.channel,
            options.token,
            options.uid
        );
        this.localUid.set(uid);
        this.isHost.set(options.role === 'host');
        this.isJoined.set(true);

        if (options.role === 'host') {
            await this.publishLocalTracks();
        }
    }

    // ── Local tracks ───────────────────────────────────────────────────────────

    private async publishLocalTracks(): Promise<void> {
        const AgoraRTC = this.sdk!.default;
        [this.localAudioTrack, this.localVideoTrack] =
            await AgoraRTC.createMicrophoneAndCameraTracks();
        await this.client!.publish([this.localAudioTrack, this.localVideoTrack]);
        this.isMicOn.set(true);
        this.isCameraOn.set(true);
    }

    playLocalVideo(elementId: string): void {
        this.localVideoTrack?.play(elementId);
    }

    async toggleMic(): Promise<void> {
        if (!this.localAudioTrack) return;
        const next = !this.isMicOn();
        await this.localAudioTrack.setEnabled(next);
        this.isMicOn.set(next);
    }

    async toggleCamera(): Promise<void> {
        if (!this.localVideoTrack) return;
        const next = !this.isCameraOn();
        await this.localVideoTrack.setEnabled(next);
        this.isCameraOn.set(next);
    }

    // ── Leave ──────────────────────────────────────────────────────────────────

    async leave(): Promise<void> {
        this.localAudioTrack?.close();
        this.localVideoTrack?.close();
        this.localAudioTrack = null;
        this.localVideoTrack = null;
        await this.client?.leave();
        this.client = null;

        this.isJoined.set(false);
        this.isMicOn.set(false);
        this.isCameraOn.set(false);
        this.isHost.set(false);
        this.remoteParticipants.set([]);
        this.localUid.set(null);
        this.connectionState.set('DISCONNECTED');
    }

    // ── Event registration ─────────────────────────────────────────────────────

    private registerEvents(): void {
        if (!this.client) return;

        this.client.on('connection-state-change', state => {
            this.connectionState.set(state);
        });

        this.client.on('user-published', async (user, mediaType) => {
            await this.client!.subscribe(user, mediaType);

            if (mediaType === 'audio') {
                user.audioTrack?.play();
            }

            this.remoteParticipants.update(list => {
                const idx = list.findIndex(p => p.uid === user.uid);
                if (idx >= 0) {
                    const next = [...list];
                    next[idx] = {
                        ...next[idx],
                        videoTrack: mediaType === 'video' ? user.videoTrack : next[idx].videoTrack,
                        audioTrack: mediaType === 'audio' ? user.audioTrack : next[idx].audioTrack,
                        hasVideo: mediaType === 'video' ? true : next[idx].hasVideo,
                        hasAudio: mediaType === 'audio' ? true : next[idx].hasAudio,
                    };
                    return next;
                }
                return [...list, {
                    uid: user.uid,
                    videoTrack: mediaType === 'video' ? user.videoTrack : undefined,
                    audioTrack: mediaType === 'audio' ? user.audioTrack : undefined,
                    hasVideo: mediaType === 'video',
                    hasAudio: mediaType === 'audio',
                }];
            });

            if (mediaType === 'video' && user.videoTrack) {
                this.remoteVideoReady$.next({ uid: user.uid, track: user.videoTrack });
            }
        });

        this.client.on('user-unpublished', (user, mediaType) => {
            this.remoteParticipants.update(list =>
                list.map(p => p.uid !== user.uid ? p : {
                    ...p,
                    videoTrack: mediaType === 'video' ? undefined : p.videoTrack,
                    audioTrack: mediaType === 'audio' ? undefined : p.audioTrack,
                    hasVideo: mediaType === 'video' ? false : p.hasVideo,
                    hasAudio: mediaType === 'audio' ? false : p.hasAudio,
                })
            );
        });

        this.client.on('user-left', user => {
            this.remoteParticipants.update(list => list.filter(p => p.uid !== user.uid));
        });
    }
}
