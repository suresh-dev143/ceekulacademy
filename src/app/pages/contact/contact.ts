import { Component, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../components/layout/layout';

interface ChatMessage {
  from: 'avatar' | 'user';
  text: string;
  time: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [LayoutComponent, ReactiveFormsModule, FormsModule, CommonModule],
  template: `
   <app-layout [showLeftSidebar]="true" [customLeftSidebar]="true" [showRightSidebar]="true" [leftLabel]="'Ceela'">

      <!-- ── Avatar Left Sidebar ──────────────────────────────────────── -->
      <div slot="left-panel" class="avatar-panel">

        <!-- Avatar Hero -->
        <div class="avatar-hero">
          <div class="avatar-ring">
            <div class="avatar-glow"></div>
            <div class="avatar-face">
              <i class="fas fa-robot"></i>
            </div>
            <span class="avatar-status-dot"></span>
          </div>
          <div class="avatar-identity">
            <h3 class="avatar-name">Ceela</h3>
            <span class="avatar-role">Ceekul Guide &middot; Always On</span>
          </div>
        </div>

        <!-- Chat Window -->
        <div class="chat-window" #chatWindow>
          @for (msg of chatMessages(); track $index) {
            <div class="chat-bubble" [class.user]="msg.from === 'user'" [class.avatar]="msg.from === 'avatar'">
              @if (msg.from === 'avatar') {
                <div class="bubble-icon"><i class="fas fa-robot"></i></div>
              }
              <div class="bubble-body">
                <p>{{ msg.text }}</p>
                <span class="bubble-time">{{ msg.time }}</span>
              </div>
            </div>
          }
          @if (avatarTyping()) {
            <div class="chat-bubble avatar typing-bubble">
              <div class="bubble-icon"><i class="fas fa-robot"></i></div>
              <div class="bubble-body typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          }
        </div>

        <!-- Quick Replies -->
        @if (!avatarTyping()) {
          <div class="quick-replies">
            @for (q of quickReplies; track q.key) {
              <button class="qr-chip" (click)="sendQuickReply(q.key)">{{ q.label }}</button>
            }
          </div>
        }

        <!-- Input -->
        <div class="chat-input-row">
          <input
            class="chat-input"
            type="text"
            [(ngModel)]="userInput"
            placeholder="Ask Ceela anything…"
            (keydown.enter)="sendUserInput()"
          />
          <button class="chat-send-btn" (click)="sendUserInput()" [disabled]="!userInput.trim()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <!-- ── Main Center Content ──────────────────────────────────────── -->
      <div class="contact-container">
        <div class="contact-header">
          <h1>Get in <span class="accent">Touch</span></h1>
          <p>Have a question or want to collaborate? Send us a message.</p>
        </div>

        <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form glass-card">
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" formControlName="name" placeholder="John Doe">
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" formControlName="email" placeholder="john@example.com">
            </div>
          </div>

          <div class="form-group">
            <label>Subject</label>
            <input type="text" formControlName="subject" placeholder="Collaboration Inquiry">
          </div>

          <div class="form-group">
            <label>Message</label>
            <textarea formControlName="message" rows="5" placeholder="How can we help you?"></textarea>
          </div>

          <button type="submit" class="btn-primary" [disabled]="contactForm.invalid">
            Send Message <i class="fas fa-paper-plane"></i>
          </button>
        </form>

        <!-- Right Panel slot -->
        <div slot="right-panel">
          <div class="contact-info glass-card">
            <h3 class="panel-title"><i class="fas fa-address-card"></i> Contact Info</h3>

            <div class="info-item">
              <div class="info-icon"><i class="fas fa-envelope"></i></div>
              <div class="info-content">
                <label>Email Us</label>
                <p>support&#64;ceekulmission.org</p>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon"><i class="fas fa-phone"></i></div>
              <div class="info-content">
                <label>Call Us</label>
                <p>+91 123 456 7890</p>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon"><i class="fas fa-map-marker-alt"></i></div>
              <div class="info-content">
                <label>Visit Us</label>
                <p>Raebareli, Uttar Pradesh,<br>India - 229001</p>
              </div>
            </div>

            <div class="social-links">
              <h4>Follow Us</h4>
              <div class="social-icons">
                <a href="#"><i class="fab fa-twitter"></i></a>
                <a href="#"><i class="fab fa-facebook"></i></a>
                <a href="#"><i class="fab fa-instagram"></i></a>
                <a href="#"><i class="fab fa-linkedin"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>

   </app-layout>
  `,
  styles: [`
    /* ── Avatar Panel ─────────────────────────────────────────────────── */
    .avatar-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 1.5rem 1rem 1rem;
      gap: 1rem;
      overflow: hidden;
    }

    /* Avatar Hero */
    .avatar-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .avatar-ring {
      position: relative;
      width: 80px;
      height: 80px;
    }

    .avatar-glow {
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        var(--accent-primary, #FF6B00),
        transparent 40%,
        var(--accent-primary, #FF6B00) 80%,
        transparent
      );
      animation: spin-glow 4s linear infinite;
      opacity: 0.6;
    }

    @keyframes spin-glow {
      to { transform: rotate(360deg); }
    }

    .avatar-face {
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #1a1a2e, #0d0d16);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: var(--accent-primary, #FF6B00);
      z-index: 1;
    }

    .avatar-status-dot {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid #000;
      z-index: 2;
      box-shadow: 0 0 8px rgba(34,197,94,0.8);
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 6px rgba(34,197,94,0.8); }
      50%       { box-shadow: 0 0 14px rgba(34,197,94,1); }
    }

    .avatar-identity {
      text-align: center;
    }

    .avatar-name {
      font-family: 'Montserrat', sans-serif;
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
      margin: 0 0 0.25rem;
      letter-spacing: 0.05em;
    }

    .avatar-role {
      font-size: 0.7rem;
      font-weight: 600;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* Chat Window */
    .chat-window {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-right: 0.25rem;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.06) transparent;

      &::-webkit-scrollbar       { width: 3px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }
    }

    .chat-bubble {
      display: flex;
      gap: 0.6rem;
      align-items: flex-end;

      &.user {
        flex-direction: row-reverse;
        .bubble-body {
          background: color-mix(in srgb, var(--accent-primary, #FF6B00), transparent 80%);
          border: 1px solid color-mix(in srgb, var(--accent-primary, #FF6B00), transparent 60%);
          border-radius: 16px 16px 4px 16px;
          align-items: flex-end;
        }
        p { color: #fff; }
      }

      &.avatar .bubble-body {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px 16px 16px 4px;
      }
    }

    .bubble-icon {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--accent-primary, #FF6B00), transparent 85%);
      border: 1px solid color-mix(in srgb, var(--accent-primary, #FF6B00), transparent 70%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      color: var(--accent-primary, #FF6B00);
      flex-shrink: 0;
    }

    .bubble-body {
      padding: 0.6rem 0.85rem;
      max-width: calc(100% - 40px);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      p {
        margin: 0;
        font-size: 0.82rem;
        color: rgba(255,255,255,0.85);
        line-height: 1.45;
      }
    }

    .bubble-time {
      font-size: 0.62rem;
      color: rgba(255,255,255,0.25);
    }

    /* Typing dots */
    .typing-bubble .bubble-body {
      padding: 0.75rem 1rem;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
      align-items: center;

      span {
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--accent-primary, #FF6B00);
        opacity: 0.6;
        animation: bounce-dot 1.2s ease-in-out infinite;

        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }

    @keyframes bounce-dot {
      0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
      40%            { transform: translateY(-5px); opacity: 1;   }
    }

    /* Quick Replies */
    .quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      flex-shrink: 0;
    }

    .qr-chip {
      padding: 0.35rem 0.7rem;
      border-radius: 20px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7);
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: color-mix(in srgb, var(--accent-primary, #FF6B00), transparent 85%);
        border-color: color-mix(in srgb, var(--accent-primary, #FF6B00), transparent 60%);
        color: #fff;
        transform: translateY(-1px);
      }
    }

    /* Chat Input */
    .chat-input-row {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .chat-input {
      flex: 1;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 0.65rem 1rem;
      color: #fff;
      font-family: inherit;
      font-size: 0.82rem;
      transition: border-color 0.2s ease;

      &::placeholder { color: rgba(255,255,255,0.25); }
      &:focus { outline: none; border-color: var(--accent-primary, #FF6B00); }
    }

    .chat-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--accent-primary, #FF6B00);
      border: none;
      color: #000;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-primary, #FF6B00), transparent 60%); }
      &:disabled { opacity: 0.35; cursor: not-allowed; }
    }

    /* ── Center / Form styles (unchanged) ────────────────────────────── */
    .contact-container { margin: 0 auto; }

    .contact-header {
      text-align: center;
      h1 { font-family: 'Montserrat', sans-serif; font-size: 3rem; font-weight: 900; color: #fff; margin-bottom: 1rem;
        .accent { color: var(--accent-primary); }
      }
      p { color: color-mix(in srgb, #fff, transparent 40%); font-size: 1.1rem; }
    }

    .contact-form {
      padding: 3rem; background: color-mix(in srgb, #fff, transparent 98%); border: 1px solid color-mix(in srgb, #fff, transparent 95%);
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    }

    .form-group {
      margin-bottom: 1.5rem;
      label { display: block; color: color-mix(in srgb, #fff, transparent 60%); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.8rem; }
      input, textarea {
        width: 100%; background: color-mix(in srgb, #fff, transparent 97%); border: 1px solid color-mix(in srgb, #fff, transparent 90%); border-radius: 12px;
        padding: 1rem; color: #fff; font-family: inherit; font-size: 0.95rem; transition: all 0.3s ease;
        &:focus { outline: none; border-color: var(--accent-primary); background: color-mix(in srgb, #fff, transparent 94%); }
      }
    }

    .btn-primary {
      width: 100%; padding: 1.2rem; background: var(--accent-primary); color: #000; border: none; border-radius: 12px;
      font-weight: 800; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; cursor: pointer;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      &:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 20px color-mix(in srgb, #FF6B00, transparent 80%); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      i { margin-left: 0.8rem; }
    }

    .contact-info {
      padding: 2rem; position: sticky; top: 2rem; margin-top: 2rem;
      .panel-title { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 0.8rem; i { color: var(--accent-primary); } }
    }

    .info-item {
      display: flex; gap: 1.2rem; margin-bottom: 2rem;
      .info-icon { width: 44px; height: 44px; background: color-mix(in srgb, #FF6B00, transparent 90%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--accent-primary); font-size: 1.1rem; flex-shrink: 0; }
      .info-content {
        label { display: block; color: color-mix(in srgb, #fff, transparent 70%); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem; }
        p { color: #fff; font-size: 0.9rem; line-height: 1.4; }
      }
    }

    .social-links {
      margin-top: 3rem; padding-top: 2rem; border-top: 1px solid color-mix(in srgb, #fff, transparent 95%);
      h4 { font-size: 0.75rem; font-weight: 800; color: color-mix(in srgb, #fff, transparent 70%); text-transform: uppercase; margin-bottom: 1.5rem; letter-spacing: 1px; }
      .social-icons {
        display: flex; gap: 1rem;
        a { width: 40px; height: 40px; border-radius: 10px; background: color-mix(in srgb, #fff, transparent 97%); display: flex; align-items: center; justify-content: center; color: #fff; transition: all 0.3s ease; border: 1px solid color-mix(in srgb, #fff, transparent 95%);
          &:hover { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); transform: translateY(-2px); }
        }
      }
    }

    @media (max-width: 768px) {
      .contact-form { padding: 1.5rem; }
      .contact-form .form-grid { grid-template-columns: 1fr; gap: 1rem; }
      .contact-header h1 { font-size: 2rem; }
    }
  `]
})
export class ContactPageComponent implements AfterViewChecked {
  @ViewChild('chatWindow') private chatWindowRef!: ElementRef<HTMLDivElement>;

  contactForm: FormGroup;
  chatMessages = signal<ChatMessage[]>([
    {
      from: 'avatar',
      text: "Hi! I'm Ceela, your Ceekul guide. Ask me anything about contacting us, our courses, or collaborating!",
      time: this.getTime()
    }
  ]);
  avatarTyping = signal(false);
  userInput = '';

  quickReplies = [
    { label: '📧 Email',       key: 'email'       },
    { label: '📞 Phone',       key: 'phone'       },
    { label: '📍 Location',    key: 'location'    },
    { label: '🤝 Collaborate', key: 'collaborate' },
    { label: '📚 Courses',     key: 'courses'     },
  ];

  private responses: Record<string, string> = {
    email:       'You can reach us at support@ceekulmission.org — we reply within 24 hours!',
    phone:       'Call us on +91 123 456 7890 — Mon to Sat, 9 AM to 6 PM IST.',
    location:    'We are based in Raebareli, Uttar Pradesh, India — 229001.',
    collaborate: 'Love that energy! Fill out the form with your idea, or email partnerships@ceekulmission.org and we\'ll get back to you.',
    courses:     'Ceekul Academy covers tech, leadership, and personal growth. Head to the Courses page to explore all programmes!',
  };

  private scrollPending = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name:    ['', Validators.required],
      email:   ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngAfterViewChecked() {
    if (this.scrollPending) {
      this.scrollToBottom();
      this.scrollPending = false;
    }
  }

  getTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  sendQuickReply(key: string) {
    const label = this.quickReplies.find(q => q.key === key)?.label ?? key;
    this.addUserMessage(label);
    this.simulateResponse(this.responses[key] ?? 'Let me find that for you!');
  }

  sendUserInput() {
    const text = this.userInput.trim();
    if (!text) return;
    this.userInput = '';
    this.addUserMessage(text);

    const lower = text.toLowerCase();
    let response = "I'm not sure about that yet — but fill out the form and our team will get back to you!";

    if      (lower.match(/\b(email|mail)\b/))                          response = this.responses['email'];
    else if (lower.match(/\b(phone|call|number|contact)\b/))           response = this.responses['phone'];
    else if (lower.match(/\b(location|address|where|office|city)\b/))  response = this.responses['location'];
    else if (lower.match(/\b(collaborat|partner|work together|join)\b/)) response = this.responses['collaborate'];
    else if (lower.match(/\b(course|learn|study|programme|program)\b/)) response = this.responses['courses'];
    else if (lower.match(/\b(hi|hello|hey|howdy)\b/))                  response = 'Hello there! Great to meet you. What can I help you with today?';
    else if (lower.match(/\b(thanks|thank you|thx)\b/))                response = 'You\'re very welcome! Is there anything else I can help with?';
    else if (lower.match(/\b(bye|goodbye|see you)\b/))                 response = 'See you soon! Feel free to come back anytime 👋';

    this.simulateResponse(response);
  }

  private addUserMessage(text: string) {
    this.chatMessages.update(msgs => [...msgs, { from: 'user', text, time: this.getTime() }]);
    this.scrollPending = true;
  }

  private simulateResponse(text: string) {
    this.avatarTyping.set(true);
    this.scrollPending = true;
    const delay = 1000 + Math.random() * 700;
    setTimeout(() => {
      this.avatarTyping.set(false);
      this.chatMessages.update(msgs => [...msgs, { from: 'avatar', text, time: this.getTime() }]);
      this.scrollPending = true;
    }, delay);
  }

  private scrollToBottom() {
    const el = this.chatWindowRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Form Submitted', this.contactForm.value);
      alert('Message sent successfully! (Mock)');
      this.contactForm.reset();
    }
  }
}
