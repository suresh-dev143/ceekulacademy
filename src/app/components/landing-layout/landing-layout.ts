import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './landing-navbar/landing-navbar';
import { GlobalSearchComponent } from '../global-search/global-search';

@Component({
  selector: 'app-landing-layout',
  imports: [CommonModule, RouterOutlet, Navbar],
  templateUrl: './landing-layout.html',
  styleUrl: './landing-layout.scss'
})
export class LandingLayout { }
