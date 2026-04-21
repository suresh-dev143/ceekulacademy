import { Component } from '@angular/core';

@Component({
    selector: 'app-demand',
    standalone: true,
    template: `
        <div class="placeholder-page">
            <div class="placeholder-page__icon">⬇</div>
            <h2>Demand</h2>
            <p>View and manage the demands flowing through the Ceekul ecosystem.</p>
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
            color: #ff9900;
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
export class Demand { }
