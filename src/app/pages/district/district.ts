import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
  selector: 'app-district',
  imports: [CommonModule, LayoutComponent],
  templateUrl: './district.html',
  styleUrl: './district.scss'
})
export class DistrictComponent {
  directorRoles = [
    { title: 'Director, Healthcare and Human Engineering, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Education and Research, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Occult and Esoteric Sciences, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Personality Development and Leadership, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Fashion and Lifestyle, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Crime Prevention and Systemic Support, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Security, Surveillance and Defence, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Justice, Dignity and Welfare, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Entertainment and Quality of Life, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Family Transformation, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Socio-Economic Transformation, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Political and Institutional Transformation, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Services and Infrastructure Planning, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Natural Resource Enrichment and Utilization, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Biodiversity Enrichment, Ecology and Environment, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Eco-Friendly Industrial and Regional Automation, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Emergency Care and Disaster Management, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Future of Human Civilization, Regional Ceekul Center', highlighted: false },
    { title: 'Director, Local Ceekul Center', highlighted: true }
  ];
}
