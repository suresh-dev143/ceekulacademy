import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-digital-life',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './digital-life.html',
  styleUrl: './digital-life.scss',
})
export class DigitalLife {
  readonly sections = [
    { title: 'My Ceevolution', route: '/personal/digital-life' }, // fallback route for ceevolution if doesn't exist
    { title: 'My Activities', route: '/personal/my-activities' },
    { title: 'My Neurons', route: '/personal/neurons' },
    { title: 'My Kutumb', route: '/personal/kutumb' },
    { title: 'My Future', route: '/personal/future' },
  ];
}
