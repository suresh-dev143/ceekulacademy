import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-digital-life',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './digital-life.html',
  styleUrl: './digital-life.scss',
})
export class DigitalLife {
  private readonly auth = inject(AuthService);

  readonly currentUser = this.auth.currentUserProfile;

  readonly cbId = computed(() => this.currentUser()?.ceebrainId ?? null);
  readonly userName = computed(() => this.currentUser()?.name ?? 'Citizen');

  readonly initials = computed(() => {
    const name = this.currentUser()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CB';
  });

  readonly sections = [
    { title: 'My Ceevolution', route: '/personal/digital-life', description: 'Your growth journey & milestones' },
    { title: 'My Activities',  route: '/personal/my-activities', description: 'Contributions & participation log' },
    { title: 'My Neurons',  route: '/personal/neurons', description: 'FUN · CUN · SUN neuron workspace' },
    { title: 'My Kutumb',  route: '/personal/kutumb', description: 'Family & community network' },
    { title: 'My Future',  route: '/personal/future', description: 'Goals, aspirations & life plan' },
  ];
}
