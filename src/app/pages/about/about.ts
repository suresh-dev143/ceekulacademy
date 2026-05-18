import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
    selector: 'app-about',
    imports: [LayoutComponent],
    templateUrl: './about.html',
    styleUrl: './about.scss'
})
export class AboutComponent {
}
