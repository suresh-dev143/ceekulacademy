import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { HomeSidebarLeftComponent } from '../home/home-sidebar-left/home-sidebar-left';

@Component({
  selector: 'app-mission',
  imports: [RouterLink, LayoutComponent, HomeSidebarLeftComponent],
  templateUrl: './mission.html',
  styleUrl: './mission.scss',
})
export class Mission {}
