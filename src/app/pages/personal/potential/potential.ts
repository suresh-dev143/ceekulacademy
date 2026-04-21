import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-potential',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './potential.html',
    styleUrl: './potential.scss'
})
export class Potential {
    readonly timeSlots = [
        '5 AM - 6 AM (Cleansing, Detox and Regenerative Drinks)',
        '6 AM - 7 AM (Exercise and Meditation)',
        '7 AM - 8 AM (Nature Care)',
        '8 AM - 9 AM (Personality Development and Communication Skills)',
        '9 AM - 10 AM (Lunch)',
        '10 AM - 11 AM (Project / Research)',
        '11 AM - 12 PM (Project / Research)',
        '12 PM - 1 PM (Project / Research)',
        '1 PM - 2 PM (Fruits and Juices)',
        '2 PM - 3 PM (Project / Research)',
        '3 PM - 4 PM (Project / Research)',
        '4 PM - 5 PM (Project / Research)',
        '5 PM - 6 PM (Dinner)',
        '6 PM - 9 PM (Family and Friends)',
        '9 PM - 10 PM (Dance, Music)',
        '10 PM - 5 AM (Detox and Regenerative Medicine)'
    ];
}
