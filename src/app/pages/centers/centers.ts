import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';

interface Center {
    id: string;
    title: string;
    address: string;
    phone: string;
    capacity: string;
    district?: string;
    image?: string;
}

@Component({
    selector: 'app-centers',
    imports: [CommonModule, LayoutComponent],
    templateUrl: './centers.html',
    styleUrl: './centers.scss'
})
export class CentersComponent {
    searchQuery = signal('');

    centers: Center[] = [
        {
            id: 'usa-alabama',
            title: 'Alabama, USA',
            address: '123 Galaxy Avenue, Science Park',
            phone: '+1 (555) 123-4567',
            capacity: '200 Students',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        {
            id: 'india-raebareli',
            title: 'Raebareli, India',
            address: 'Mr Keshan, Musapur, Sareni, Raebareli',
            phone: '+91 9560037090',
            capacity: '150 Students',
            image: 'https://images.unsplash.com/photo-152305085306e-8c3d3e7d4f1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        },
        {
            id: 'westside-innovation',
            title: 'Westside Innovation Center',
            address: '88 Orbit Ring Road, Westview',
            phone: '+1 (555) 456-7890',
            capacity: '300 Students',
            district: 'West District',
            image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
        }
    ];

    filteredCenters = signal<Center[]>(this.centers);

    onSearch(event: Event) {
        const query = (event.target as HTMLInputElement).value.toLowerCase();
        this.searchQuery.set(query);

        if (!query) {
            this.filteredCenters.set(this.centers);
            return;
        }

        const filtered = this.centers.filter(center =>
            center.title.toLowerCase().includes(query) ||
            center.address.toLowerCase().includes(query) ||
            (center.district && center.district.toLowerCase().includes(query))
        );
        this.filteredCenters.set(filtered);
    }

    handleSearchSubmit(event: Event) {
        event.preventDefault();
        // Search is handled in real-time via onSearch, but this allows for form submit handling if needed
    }
}
