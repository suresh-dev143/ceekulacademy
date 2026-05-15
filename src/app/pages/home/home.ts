import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { ProgramsSectionComponent } from '../../components/programs-section/programs-section';
import { AuthService } from '../../services/auth.service';
import { HomeSidebarLeftComponent } from './home-sidebar-left/home-sidebar-left';

@Component({
    selector: 'app-home',
    imports: [LayoutComponent, ProgramsSectionComponent, HomeSidebarLeftComponent, RouterLink, CommonModule],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
    private authService = inject(AuthService);
    currentUserRole = this.authService.currentUserRole;

    ngOnInit() {

    }



}

