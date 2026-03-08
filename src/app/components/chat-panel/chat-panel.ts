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

    // --- State ---
    isToolSelectionOpen = signal(false);

    // Mock Content Anchor for demonstration (e.g., passed via an Input in the future)
    contentAnchor = signal<string>('module_1_lesson_4?t=120');

    // --- Chat State ---
    messages = signal<ChatMessage[]>([
        { text: '', type: 'bot', timestamp: new Date() }
    ]);
    currentMessage = signal('');

    // --- Tool Definitions ---
    availableTools = signal<ToolItem[]>([
        { id: '1', title: 'Social Media', icon: 'fas fa-hashtag', action: 'social' },
        { id: '2', title: 'Learning & Innovation', icon: 'fas fa-lightbulb', action: 'learning' },
        { id: '3', title: 'Research Questions', icon: 'fas fa-microscope', action: 'research' },
        { id: '4', title: 'Right Thinking Tools', icon: 'fas fa-brain', action: 'thinking' },
        { id: '5', title: 'Project Development', icon: 'fas fa-project-diagram', action: 'project' },
        { id: '6', title: 'Online Production', icon: 'fas fa-laptop-code', action: 'production' }
    ]);

    selectedTools = signal<ToolItem[]>([]);

    toggleToolSelection() {
        this.isToolSelectionOpen.update(v => !v);
    }

    addTool(tool: ToolItem) {
        if (!this.selectedTools().find(t => t.id === tool.id)) {
            this.selectedTools.update(tools => [...tools, tool]);
        }
        this.isToolSelectionOpen.set(false);
    }

    removeSelectedTool(tool: ToolItem, event: Event) {
        event.stopPropagation();
        this.selectedTools.update(tools => tools.filter(t => t.id !== tool.id));
    }

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

    handleToolClick(tool: ToolItem) {
        alert(`Opening Tool: ${tool.title} for anchor: ${this.contentAnchor()}`);
    }

    sendMessage() {
        const message = this.currentMessage().trim();
        if (message) {
            this.messages.update(msgs => [...msgs, { text: message, type: 'user', timestamp: new Date() }]);
            this.currentMessage.set('');

            // Simulate bot response
            setTimeout(() => {
                this.messages.update(msgs => [...msgs, {
                    text: 'Thank you for your message. Analyzing the selected content...',
                    type: 'bot',
                    timestamp: new Date()
                }]);
            }, 1000);
        }
    }

    handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.sendMessage();
        }
    }
}
