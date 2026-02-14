import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { TeacherMyScheduleComponent } from '../../components/teacher/teacher-my-schedule/teacher-my-schedule';
import { ProgramsSectionComponent } from '../../components/programs-section/programs-section';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-home',
    imports: [CommonModule, LayoutComponent, TeacherMyScheduleComponent, ProgramsSectionComponent],
    templateUrl: './landing.html',
    styleUrl: './landing.scss'
})
export class LandingComponent implements OnInit {
    private authService = inject(AuthService);
    currentUserRole = this.authService.currentUserRole;

    ngOnInit() {

    }



}

