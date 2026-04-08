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
    values = [
        {
            title: 'Innovation',
            description: 'Embracing cutting-edge technologies and creative solutions to solve global challenges.'
        },
        {
            title: 'Collaboration',
            description: 'Working together across cultures and communities to achieve common goals.'
        },
        {
            title: 'Sustainability',
            description: 'Committed to environmental consciousness and sustainable development practices.'
        },
        {
            title: 'Compassion',
            description: 'Fostering empathy, understanding, and support for all members of our community.'
        },
        {
            title: 'Excellence',
            description: 'Striving for the highest standards in education, research, and community service.'
        },
        {
            title: 'Global Vision',
            description: 'Thinking beyond boundaries to create a harmonious future for all humanity.'
        }
    ];
}
