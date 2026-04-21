import { Component } from '@angular/core';
import { ProgramsSectionComponent } from '../../components/programs-section/programs-section';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [ ProgramsSectionComponent],
  templateUrl: './programs.html',
  styleUrl: './programs.scss'
})
export class ProgramsComponent {
}
