import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-kutumb',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="placeholder-page"><h2>My Kutumb</h2><p>Coming Soon</p></div>`,
    styles: [`
    .placeholder-page { text-align: center; color: #fff; padding: 3rem; }
    h2 { color: #ff9900; }
  `]
})
export class Kutumb { }
