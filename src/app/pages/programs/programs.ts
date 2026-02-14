import { Component } from '@angular/core';
import { LayoutComponent } from '../../components/layout/layout';
import { ProgramsSectionComponent } from '../../components/programs-section/programs-section';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [LayoutComponent, ProgramsSectionComponent],
  templateUrl: './programs.html',
  styleUrl: './programs.scss'
})
export class ProgramsComponent {
}
