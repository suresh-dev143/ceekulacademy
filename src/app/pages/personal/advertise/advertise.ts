import { Component } from '@angular/core';

@Component({
    selector: 'app-advertise',
    standalone: true,
    template: `
        <div class="placeholder-page">
            <div class="placeholder-page__icon">📢</div>
            <h2>Advertise</h2>
            <p>Promote your mission, projects, and offerings to the Ceekul Civilisation network.</p>
        </div>
    `,
    styles: [`
        .placeholder-page {
            text-align: center;
            color: #e0e0e0;
            padding: 4rem 2rem;
        }
        .placeholder-page__icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            line-height: 1;
        }
        h2 {
            color: #ff9900;
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 1rem;
        }
        p {
            color: #a0a0a0;
            font-size: 1rem;
            max-width: 400px;
            margin: 0 auto;
            line-height: 1.6;
        }
    `]
})
export class Advertise { }
