import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { ProgramsSectionComponent } from '../../components/programs-section/programs-section';
import { AuthService } from '../../services/auth.service';
import {MyScheduleComponent} from '../my-schedule/my-schedule';

@Component({
    selector: 'app-home',
    imports: [CommonModule, LayoutComponent,MyScheduleComponent, ProgramsSectionComponent],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
    private authService = inject(AuthService);
    currentUserRole = this.authService.currentUserRole;

    ngOnInit() {

    }



}

