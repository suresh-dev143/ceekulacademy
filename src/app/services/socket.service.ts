import { Injectable, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable, filter, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type SocketNamespace = 'va' | 'dinner';

interface NamespaceState {
  socket: Socket;
  events$: Subject<{ event: string; data: unknown }>;
  connected: boolean;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private readonly _platform = inject(PLATFORM_ID);
  private readonly _ns = new Map<SocketNamespace, NamespaceState>();

  /**
   * Connect (or reuse) a namespace socket authenticated with the given JWT.
   * Safe to call multiple times — returns the existing socket if already connected.
   */
  connect(ns: SocketNamespace, token: string): Socket {
    if (!isPlatformBrowser(this._platform)) return {} as Socket;

    const existing = this._ns.get(ns);
    if (existing?.socket.connected) return existing.socket;

    // Reuse the Subject if we're reconnecting after a transient disconnect
    const events$ = existing?.events$ ?? new Subject<{ event: string; data: unknown }>();

    const socket = io(`${environment.apiUrl}/${ns}`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1_000,
      timeout: 10_000,
    });

    // Fan all events into one Subject so on() can filter without attaching many listeners
    socket.onAny((event: string, data: unknown) =>
      events$.next({ event, data })
    );

    socket.on('connect',    () => { const s = this._ns.get(ns); if (s) s.connected = true;  });
    socket.on('disconnect', () => { const s = this._ns.get(ns); if (s) s.connected = false; });

    this._ns.set(ns, { socket, events$, connected: false });
    return socket;
  }

  /** Listen for a specific event on a namespace as a typed Observable. */
  on<T = unknown>(ns: SocketNamespace, event: string): Observable<T> {
    const state = this._ns.get(ns);
    if (!state) return new Subject<T>().asObservable();
    return state.events$.asObservable().pipe(
      filter(e => e.event === event),
      map(e => e.data as T),
    );
  }

  emit(ns: SocketNamespace, event: string, data?: unknown): void {
    this._ns.get(ns)?.socket.emit(event, data);
  }

  /** Ask the server to subscribe this socket to a named room. */
  join(ns: SocketNamespace, room: string): void {
    this._ns.get(ns)?.socket.emit('join', { room });
  }

  isConnected(ns: SocketNamespace): boolean {
    return this._ns.get(ns)?.socket.connected ?? false;
  }

  disconnect(ns: SocketNamespace): void {
    const state = this._ns.get(ns);
    if (!state) return;
    state.socket.disconnect();
    state.events$.complete();
    this._ns.delete(ns);
  }

  ngOnDestroy(): void {
    for (const ns of [...this._ns.keys()]) this.disconnect(ns);
  }
}
