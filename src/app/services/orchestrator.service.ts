import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrchestratorService {
  private apiUrl = 'http://localhost:3000/v1'; // NestJS base URL
  private socket: Socket;
  private scheduleSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:3000');
    this.initSocket();
  }

  private initSocket() {
    this.socket.on('content:sync', (data) => {
      console.log('RT Content Sync:', data);
    });

    this.socket.on('ai:suggestion', (suggestion) => {
      console.log('AI Suggestion received:', suggestion);
    });
  }

  getCurrentSchedule(criteria: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedule/current`, { params: criteria });
  }

  evolveContent(contentId: string, context: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/content/evolve`, { contentId, context });
  }

  joinSession(sessionId: string) {
    this.socket.emit('session:join', { sessionId });
  }

  sendUpdate(sessionId: string, patch: any) {
    this.socket.emit('content:update', { sessionId, ...patch });
  }

  requestAiSuggestion(contentId: string, context: any, selectedText: string) {
    this.socket.emit('ai:suggest', { contentId, context, selectedText });
  }

  onAiSuggestion(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('ai:suggestion', (data) => subscriber.next(data));
    });
  }
}
