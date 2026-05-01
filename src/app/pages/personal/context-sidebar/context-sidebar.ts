import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-context-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-sidebar.html',
  styleUrl: './context-sidebar.scss'
})
export class ContextSidebarComponent {
  private readonly router = inject(Router);

  readonly usedIn = signal([
  
  ]);
  readonly collaborators = signal([
    { name: 'Claude-7', status: 'researching', role: 'AI Agent' },
    { name: 'Suresh K.', status: 'editing', role: 'Validator' },
    { name: 'Elena V.', status: 'online', role: 'Collaborator' }
  ]);

  goToLibrary(): void {
    this.router.navigate(['/personal/library']);
  }
}
