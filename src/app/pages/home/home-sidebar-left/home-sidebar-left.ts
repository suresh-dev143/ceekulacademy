import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IssuesSidebarTickerComponent } from '../../../components/issues-sidebar-ticker/issues-sidebar-ticker';

@Component({
    selector: 'app-home-sidebar-left',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, IssuesSidebarTickerComponent],
    templateUrl: './home-sidebar-left.html',
    styleUrl: './home-sidebar-left.scss'
})
export class HomeSidebarLeftComponent {
}
