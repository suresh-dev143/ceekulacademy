import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-footer',
    imports: [CommonModule, RouterLink],
    templateUrl: './footer.html',
    styleUrl: './footer.scss'
})
export class FooterComponent {
    currentYear = new Date().getFullYear();
}
