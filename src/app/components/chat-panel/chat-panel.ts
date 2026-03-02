import { Component, signal, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChatMessage {
    text: string;
    type: 'bot' | 'user';
    timestamp?: Date;
}

interface ToolItem {
    id: string;
    title: string;
    icon: string;
    action: string;
    isMore?: boolean;
}

@Component({
    selector: 'app-chat-panel',
    imports: [CommonModule],
    templateUrl: './chat-panel.html',
    styleUrl: './chat-panel.scss'
})
export class ChatPanelComponent implements AfterViewChecked {
    @Output() closeChat = new EventEmitter<void>();
    @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

    messages = signal<ChatMessage[]>([
        { text: 'Welcome to Ceekul Mission! How can I assist you today?', type: 'bot', timestamp: new Date() }
    ]);

    tools = signal<ToolItem[]>([
        { id: '1', title: 'Social Media', icon: 'fas fa-hashtag', action: 'social' },
        { id: '2', title: 'Learning & Innovation', icon: 'fas fa-lightbulb', action: 'learning' },
        { id: '3', title: 'Research Questions', icon: 'fas fa-microscope', action: 'research' },
        { id: '4', title: 'Right Thinking Tools', icon: 'fas fa-brain', action: 'thinking' },
        { id: '5', title: 'Project Development', icon: 'fas fa-project-diagram', action: 'project' },
        { id: '6', title: 'Online Production', icon: 'fas fa-laptop-code', action: 'production' },
        { id: 'more', title: 'More Tools', icon: 'fas fa-plus', action: 'more', isMore: true }
    ]);

    currentMessage = signal('');

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        try {
            if (this.chatScrollContainer) {
                this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
            }
        } catch (err) { }
    }

    sendMessage() {
        const message = this.currentMessage().trim();
        if (message) {
            this.messages.update(msgs => [...msgs, { text: message, type: 'user', timestamp: new Date() }]);
            this.currentMessage.set('');

            // Simulate bot response
            setTimeout(() => {
                this.messages.update(msgs => [...msgs, {
                    text: 'Thank you for your message. Our academic AI core will process this shortly.',
                    type: 'bot',
                    timestamp: new Date()
                }]);
            }, 1000);
        }
    }

    handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default enter behavior
            this.sendMessage();
        }
    }

    handleToolClick(tool: ToolItem) {
        if (tool.isMore) {
            // Mock addition for demo
            this.tools.update(t => [
                ...t.filter(item => !item.isMore),
                { id: Date.now().toString(), title: 'New Tool', icon: 'fas fa-wrench', action: 'new' },
                { id: 'more', title: 'More Tools', icon: 'fas fa-plus', action: 'more', isMore: true }
            ]);
        } else {
            this.messages.update(msgs => [...msgs, {
                text: `Opening tool: ${tool.title}...`,
                type: 'bot',
                timestamp: new Date()
            }]);
        }
    }
}
