import { Component, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarLeftComponent } from '../sidebar-left/sidebar-left';
import { ChatPanelComponent } from '../chat-panel/chat-panel';
import { NavbarComponent } from '../navbar/navbar';
import { GlobalSearchComponent } from '../global-search/global-search';
import { ToastComponent } from '../toast/toast';

@Component({
    selector: 'app-layout',
    imports: [CommonModule, SidebarLeftComponent, ChatPanelComponent, NavbarComponent, GlobalSearchComponent, ToastComponent],
    templateUrl: './layout.html',
    styleUrl: './layout.scss'
})
export class LayoutComponent {
    leftCollapsed = signal(false);
    rightCollapsed = signal(false);
    mobileSidebarOpen = signal(false);
    mobileRightSidebarOpen = signal(false);

    @Input() showLeftSidebar = true;
    @Input() showRightSidebar = true;
    @Input() showSearch = true;
    @Input() customLeftSidebar = false;

    toggleLeft() {
        this.leftCollapsed.set(!this.leftCollapsed());
    }

    toggleRight() {
        this.rightCollapsed.set(!this.rightCollapsed());
    }

    toggleMobileSidebar() {
        this.mobileSidebarOpen.set(!this.mobileSidebarOpen());
    }

    toggleMobileRightSidebar() {
        this.mobileRightSidebarOpen.set(!this.mobileRightSidebarOpen());
    }

    expandLeft() {
        this.leftCollapsed.set(false);
    }

    expandRight() {
        this.rightCollapsed.set(false);
    }
}
