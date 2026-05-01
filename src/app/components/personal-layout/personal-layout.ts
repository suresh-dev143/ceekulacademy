import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Navbar } from '../landing-layout/landing-navbar/landing-navbar';
import { GlobalSearchComponent } from '../global-search/global-search';
import { filter, map, mergeMap } from 'rxjs';

import { ContextSidebarComponent } from '../../pages/personal/context-sidebar/context-sidebar';
import { AiToolsPage } from '../../pages/personal/ai-tools/ai-tools';
import { LocalNewsPage } from '../../pages/personal/local-news/local-news';

@Component({
    selector: 'app-personal-layout',
    standalone: true,
    imports: [
      CommonModule, 
      GlobalSearchComponent, 
      RouterOutlet, 
      RouterModule, 
      Navbar,
      ContextSidebarComponent,
      AiToolsPage,
      LocalNewsPage
    ],
    templateUrl: './personal-layout.html',
    styleUrl: './personal-layout.scss'
})
export class PersonalLayout implements OnInit {
    private router = inject(Router);
    private activatedRoute = inject(ActivatedRoute);

    readonly sidebarType = signal<'news' | 'contextual'>('news');
    readonly leftSidebarOpen = signal(true);
    readonly rightSidebarOpen = signal(true);
    readonly topNavItems = [
        { label: 'HOME', route: '/', exact: true },
        { label: 'CREATE', route: '/personal/create' },
        { label: 'NEARBY', route: '/personal/local-news' },
        { label: 'AI TOOLS', route: '/personal/ai-tools' },
        { label: 'ADVERTISE', route: '/personal/advertise' },
        { label: 'DEMAND', route: '/personal/demand' },
        { label: 'SUPPLY', route: '/personal/supply' },
        { label: 'EDIT', route: '/personal/edit' },
    ];

    ngOnInit(): void {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map(route => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        filter(route => route.outlet === 'primary'),
        mergeMap(route => route.data)
      ).subscribe(data => {
        const type = data['leftSidebar'] || 'news';
        this.sidebarType.set(type as 'news' | 'contextual');
      });
      
      // Also check initial route
      let route = this.activatedRoute;
      while (route.firstChild) route = route.firstChild;
      route.data.subscribe(data => {
        const type = data['leftSidebar'] || 'news';
        this.sidebarType.set(type as 'news' | 'contextual');
      });
    }

    toggleLeftSidebar(): void { this.leftSidebarOpen.update(v => !v); }
    toggleRightSidebar(): void { this.rightSidebarOpen.update(v => !v); }
}
