import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChatMessage {
    text: string;
    type: 'bot' | 'user';
}

@Component({
    selector: 'app-chat-panel',
    imports: [CommonModule],
    templateUrl: './chat-panel.html',
    styleUrl: './chat-panel.scss'
})
export class ChatPanelComponent {
    @Output() closeChat = new EventEmitter<void>();
    messages = signal<ChatMessage[]>([
        { text: 'Welcome to Ceekul Mission! How can I assist you today?', type: 'bot' }
    ]);

    currentMessage = signal('');

    sendMessage() {
        const message = this.currentMessage().trim();
        if (message) {
            this.messages.update(msgs => [...msgs, { text: message, type: 'user' }]);
            this.currentMessage.set('');

            // Simulate bot response
            setTimeout(() => {
                this.messages.update(msgs => [...msgs, {
                    text: 'Thank you for your message. Our team will assist you shortly!',
                    type: 'bot'
                }]);
            }, 1000);
        }
    }

    handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    }
}
