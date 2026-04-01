import { Component, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatPanelComponent } from '../../components/chat-panel/chat-panel';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarComponent } from '../../components/navbar/navbar';
import { GlobalSearchComponent } from '../../components/global-search/global-search';
import { SearchService } from '../../services/search.service';

// ── Civilization Impact Score (6-component composite) ─────────
export interface CivilizationImpactScore {
    overall: number;  // 0–100 weighted composite
    womenParticipation: number;  // 0–100
    lowestStrataInclusion: number; // 0–100
    originalResearch: number;  // 0–100
    innovationDeployment: number;  // 0–100
    digitalAdvancement: number;  // 0–100
    globalHarmony: number;  // 0–100
    trend: 'Rising' | 'Stable' | 'Declining';
    aiSummary: string;
}

// ── 6-Month Metric Layers ─────────────────────────────────────
export interface InclusionMetrics {
    femalePct: number;
    underservedPct: number;
    scholarshipsGranted: number;
    womenInLeadership: number;
    skillHoursDelivered: number;
    inclusionGrowthRate: number;   // % vs prior 6m
    equityGapAlert: boolean;
    socioMobility: number;   // 0–100 AI estimate
}

export interface ResearchMetrics {
    ideasGenerated: number;
    patentsFiled: number;
    papersSubmitted: number;
    prototypes: number;
    collaborations: number;
    noveltyScore: number;   // 0–100
    crossDomainIndex: number;   // 0–100
    futureRelevance: number;   // 0–100
}

export interface DigitalMetrics {
    aiSystemsDeployed: number;
    platformsCreated: number;
    automationPipelines: number;
    openSourceContributions: number;
    globalTechCollaborations: number;
    scalabilityIndex: number;   // 0–100
    cyberResilienceScore: number;  // 0–100
    sophisticationScore: number;   // 0–100
}

export interface HarmonyMetrics {
    webinarsHosted: number;
    crossCulturalEvents: number;
    serviceHours: number;
    wellnessInitiatives: number;
    conflictResolutionPrograms: number;
    harmonySentimentScore: number;  // 0–100
    communityMultiplier: number;  // 1.0–3.0×
}

export interface InfrastructureProfile {
    ici: number;   // 0–100 Infrastructure Capability Index
    labs: number;
    aiComputeLevel: 'High' | 'Medium' | 'Basic';
    cloudInfra: boolean;
    offlineClassrooms: number;
    accessibilityScore: number;   // 0–100
    sustainabilityScore: number;   // 0–100
    equipmentUtilization: number;   // %
    serverBandwidth: string;
}

// ── Center Profile (full) ─────────────────────────────────────
export interface CenterProfile {
    id: string;
    name: string;
    shortName: string;
    country: string;
    countryCode: string;
    utcOffset: number;
    timezoneAbbr: string;
    director: string;
    established: number;
    totalEnrolled: number;
    totalTeachers: number;
    lat: number;    // for world map
    lng: number;
    cis: CivilizationImpactScore;
    inclusion: InclusionMetrics;
    research: ResearchMetrics;
    digital: DigitalMetrics;
    harmony: HarmonyMetrics;
    infra: InfrastructureProfile;
}

// ── Today's Vision Focus (per center, live) ───────────────────
export type CisPillar = 'Inclusion' | 'Research' | 'Innovation' | 'Digital' | 'Civilization';

export interface TodayVision {
    activePillars: CisPillar[];
    primaryFocus: string;
    visionImpact: string;
    learnersEngaged: number;
    scores: { inclusion: number; research: number; innovation: number; digital: number; civilization: number; overall: number };
    liveMetrics: {
        womenTrainedToday: number;
        mentoringHoursToday: number;
        scholarshipsAllocatedToday: number;
        digitalToolsDeployedToday: number;
        beneficiariesReachedToday: number;
    };
}

// ── Center Day Status ─────────────────────────────────────────
export interface CenterDayStatus {
    centerId: string;
    centerName: string;
    shortName: string;
    country: string;
    countryCode: string;
    utcOffset: number;
    timezoneAbbr: string;
    operationalStatus: 'Open' | 'Closed' | 'Holiday' | 'Maintenance';
    studentsPresent: number;
    totalEnrolled: number;
    teachersOnDuty: number;
    totalTeachers: number;
    dutyOfficer: string;
    alerts: string[];
    todayVision: TodayVision;
}

// ── Live Feed Types ───────────────────────────────────────────
export interface LiveActivity {
    id: string;
    type: 'Course' | 'Workshop' | 'Research' | 'Mentoring' | 'Innovation';
    title: string;
    center: string;
    centerCode: string;
    participants: number;
    femalePct: number;
    inclusionLevel: 'High' | 'Medium' | 'Low';
    domain: string;
    minutesAgo: number;
}

export interface ResearchEntry {
    id: string;
    title: string;
    center: string;
    centerCode: string;
    category: string;
    minutesAgo: number;
    noveltyScore: number;
}

export interface AdvisorInsight {
    type: 'Alert' | 'Opportunity' | 'Action' | 'Recognition';
    center: string;
    message: string;
    priority: 'High' | 'Medium' | 'Low';
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════
@Component({
    selector: 'app-centers',
    imports: [CommonModule, ChatPanelComponent, NavbarComponent, GlobalSearchComponent],
    templateUrl: './centers.html',
    styleUrl: './centers.scss'
})
export class CentersComponent {
    private destroyRef = inject(DestroyRef);
    private searchService = inject(SearchService);

    lastUpdated = signal<Date>(new Date());
    currentTime = signal<Date>(new Date());
    searchQuery = this.searchService.globalQuery;

    // ── Center Profiles ─────────────────────────────────────────
    centerProfiles = signal<CenterProfile[]>([
        {
            id: 'india-raebareli', name: 'Raebareli Mission Center', shortName: 'Raebareli',
            country: 'India', countryCode: 'IN', utcOffset: 5.5, timezoneAbbr: 'IST',
            director: 'Mr. Keshan Verma', established: 2018, totalEnrolled: 150, totalTeachers: 12,
            lat: 26.2, lng: 81.2,
            cis: {
                overall: 74, womenParticipation: 82, lowestStrataInclusion: 85, originalResearch: 58,
                innovationDeployment: 70, digitalAdvancement: 65, globalHarmony: 78,
                trend: 'Rising',
                aiSummary: 'Strong inclusion champion with 72% underserved participation. 3 research projects active. Rural digital literacy push driving consistent CIS growth over 6 months.'
            },
            inclusion: {
                femalePct: 61, underservedPct: 72, scholarshipsGranted: 89, womenInLeadership: 8,
                skillHoursDelivered: 2840, inclusionGrowthRate: 18, equityGapAlert: false, socioMobility: 68
            },
            research: {
                ideasGenerated: 12, patentsFiled: 0, papersSubmitted: 1, prototypes: 3, collaborations: 4,
                noveltyScore: 62, crossDomainIndex: 55, futureRelevance: 70
            },
            digital: {
                aiSystemsDeployed: 2, platformsCreated: 1, automationPipelines: 3, openSourceContributions: 1,
                globalTechCollaborations: 2, scalabilityIndex: 55, cyberResilienceScore: 60, sophisticationScore: 58
            },
            harmony: {
                webinarsHosted: 8, crossCulturalEvents: 5, serviceHours: 340, wellnessInitiatives: 3,
                conflictResolutionPrograms: 1, harmonySentimentScore: 78, communityMultiplier: 1.8
            },
            infra: {
                ici: 68, labs: 2, aiComputeLevel: 'Basic', cloudInfra: false, offlineClassrooms: 2,
                accessibilityScore: 82, sustainabilityScore: 70, equipmentUtilization: 76, serverBandwidth: '100 Mbps'
            }
        },
        {
            id: 'usa-alabama', name: 'Alabama Innovation Center', shortName: 'Alabama',
            country: 'USA', countryCode: 'US', utcOffset: -6, timezoneAbbr: 'CST',
            director: 'Dr. Sarah Mitchell', established: 2019, totalEnrolled: 200, totalTeachers: 18,
            lat: 33.5, lng: -86.8,
            cis: {
                overall: 91, womenParticipation: 78, lowestStrataInclusion: 65, originalResearch: 88,
                innovationDeployment: 92, digitalAdvancement: 95, globalHarmony: 82,
                trend: 'Rising',
                aiSummary: 'Global innovation powerhouse with highest CIS in the network (91/100). 8 research projects, 5 publications, 11 solutions deployed. Scaling digital systems to 1,800+ users.'
            },
            inclusion: {
                femalePct: 54, underservedPct: 48, scholarshipsGranted: 62, womenInLeadership: 12,
                skillHoursDelivered: 4200, inclusionGrowthRate: 22, equityGapAlert: false, socioMobility: 82
            },
            research: {
                ideasGenerated: 28, patentsFiled: 3, papersSubmitted: 5, prototypes: 8, collaborations: 9,
                noveltyScore: 88, crossDomainIndex: 82, futureRelevance: 90
            },
            digital: {
                aiSystemsDeployed: 6, platformsCreated: 4, automationPipelines: 8, openSourceContributions: 5,
                globalTechCollaborations: 7, scalabilityIndex: 90, cyberResilienceScore: 88, sophisticationScore: 92
            },
            harmony: {
                webinarsHosted: 15, crossCulturalEvents: 12, serviceHours: 680, wellnessInitiatives: 6,
                conflictResolutionPrograms: 2, harmonySentimentScore: 82, communityMultiplier: 2.4
            },
            infra: {
                ici: 92, labs: 6, aiComputeLevel: 'High', cloudInfra: true, offlineClassrooms: 8,
                accessibilityScore: 88, sustainabilityScore: 85, equipmentUtilization: 88, serverBandwidth: '10 Gbps'
            }
        },
        {
            id: 'uk-london', name: 'London Global Hub', shortName: 'London',
            country: 'United Kingdom', countryCode: 'GB', utcOffset: 0, timezoneAbbr: 'GMT',
            director: 'Prof. James Whitfield', established: 2020, totalEnrolled: 300, totalTeachers: 25,
            lat: 51.5, lng: -0.1,
            cis: {
                overall: 87, womenParticipation: 75, lowestStrataInclusion: 60, originalResearch: 91,
                innovationDeployment: 78, digitalAdvancement: 85, globalHarmony: 88,
                trend: 'Stable',
                aiSummary: 'Premier research and civilization center. 12 research projects, 8 papers. Global Summit hub reaching 18 communities. Highest harmony score in the network.'
            },
            inclusion: {
                femalePct: 57, underservedPct: 43, scholarshipsGranted: 71, womenInLeadership: 15,
                skillHoursDelivered: 5100, inclusionGrowthRate: 15, equityGapAlert: false, socioMobility: 78
            },
            research: {
                ideasGenerated: 35, patentsFiled: 2, papersSubmitted: 8, prototypes: 7, collaborations: 14,
                noveltyScore: 91, crossDomainIndex: 88, futureRelevance: 88
            },
            digital: {
                aiSystemsDeployed: 5, platformsCreated: 4, automationPipelines: 6, openSourceContributions: 7,
                globalTechCollaborations: 12, scalabilityIndex: 85, cyberResilienceScore: 90, sophisticationScore: 88
            },
            harmony: {
                webinarsHosted: 22, crossCulturalEvents: 18, serviceHours: 920, wellnessInitiatives: 8,
                conflictResolutionPrograms: 5, harmonySentimentScore: 88, communityMultiplier: 2.8
            },
            infra: {
                ici: 90, labs: 5, aiComputeLevel: 'High', cloudInfra: true, offlineClassrooms: 10,
                accessibilityScore: 85, sustainabilityScore: 88, equipmentUtilization: 82, serverBandwidth: '5 Gbps'
            }
        },
        {
            id: 'nigeria-lagos', name: 'Lagos Mission Center', shortName: 'Lagos',
            country: 'Nigeria', countryCode: 'NG', utcOffset: 1, timezoneAbbr: 'WAT',
            director: 'Dr. Adaeze Okonkwo', established: 2021, totalEnrolled: 180, totalTeachers: 14,
            lat: 6.5, lng: 3.4,
            cis: {
                overall: 79, womenParticipation: 88, lowestStrataInclusion: 90, originalResearch: 62,
                innovationDeployment: 75, digitalAdvancement: 68, globalHarmony: 80,
                trend: 'Rising',
                aiSummary: 'Strongest inclusion center globally. 78% underserved, 98 scholarships. Women entrepreneurship incubation driving community upliftment in underserved Lagos.'
            },
            inclusion: {
                femalePct: 65, underservedPct: 78, scholarshipsGranted: 98, womenInLeadership: 9,
                skillHoursDelivered: 3200, inclusionGrowthRate: 28, equityGapAlert: false, socioMobility: 72
            },
            research: {
                ideasGenerated: 14, patentsFiled: 0, papersSubmitted: 2, prototypes: 4, collaborations: 5,
                noveltyScore: 65, crossDomainIndex: 58, futureRelevance: 75
            },
            digital: {
                aiSystemsDeployed: 3, platformsCreated: 2, automationPipelines: 4, openSourceContributions: 2,
                globalTechCollaborations: 3, scalabilityIndex: 62, cyberResilienceScore: 65, sophisticationScore: 60
            },
            harmony: {
                webinarsHosted: 12, crossCulturalEvents: 9, serviceHours: 480, wellnessInitiatives: 5,
                conflictResolutionPrograms: 3, harmonySentimentScore: 80, communityMultiplier: 2.2
            },
            infra: {
                ici: 72, labs: 3, aiComputeLevel: 'Medium', cloudInfra: true, offlineClassrooms: 4,
                accessibilityScore: 88, sustainabilityScore: 72, equipmentUtilization: 79, serverBandwidth: '500 Mbps'
            }
        },
        {
            id: 'australia-sydney', name: 'Sydney Pacific Center', shortName: 'Sydney',
            country: 'Australia', countryCode: 'AU', utcOffset: 11, timezoneAbbr: 'AEDT',
            director: 'Dr. Emma Clarke', established: 2020, totalEnrolled: 220, totalTeachers: 20,
            lat: -33.9, lng: 151.2,
            cis: {
                overall: 88, womenParticipation: 78, lowestStrataInclusion: 68, originalResearch: 80,
                innovationDeployment: 82, digitalAdvancement: 90, globalHarmony: 82,
                trend: 'Rising',
                aiSummary: 'Pacific digital excellence hub. 7 systems deployed, 7 platforms created. Strong research output with 4 publications. All vision targets met today.'
            },
            inclusion: {
                femalePct: 58, underservedPct: 52, scholarshipsGranted: 65, womenInLeadership: 11,
                skillHoursDelivered: 3800, inclusionGrowthRate: 12, equityGapAlert: false, socioMobility: 80
            },
            research: {
                ideasGenerated: 22, patentsFiled: 2, papersSubmitted: 4, prototypes: 6, collaborations: 8,
                noveltyScore: 80, crossDomainIndex: 75, futureRelevance: 85
            },
            digital: {
                aiSystemsDeployed: 7, platformsCreated: 5, automationPipelines: 7, openSourceContributions: 4,
                globalTechCollaborations: 6, scalabilityIndex: 88, cyberResilienceScore: 85, sophisticationScore: 86
            },
            harmony: {
                webinarsHosted: 11, crossCulturalEvents: 8, serviceHours: 520, wellnessInitiatives: 5,
                conflictResolutionPrograms: 2, harmonySentimentScore: 82, communityMultiplier: 2.0
            },
            infra: {
                ici: 88, labs: 5, aiComputeLevel: 'High', cloudInfra: true, offlineClassrooms: 7,
                accessibilityScore: 82, sustainabilityScore: 90, equipmentUtilization: 84, serverBandwidth: '5 Gbps'
            }
        },
        {
            id: 'brazil-saopaulo', name: 'São Paulo Center', shortName: 'São Paulo',
            country: 'Brazil', countryCode: 'BR', utcOffset: -3, timezoneAbbr: 'BRT',
            director: 'Dr. Carlos Mendes', established: 2022, totalEnrolled: 160, totalTeachers: 13,
            lat: -23.5, lng: -46.6,
            cis: {
                overall: 72, womenParticipation: 82, lowestStrataInclusion: 80, originalResearch: 55,
                innovationDeployment: 68, digitalAdvancement: 62, globalHarmony: 72,
                trend: 'Stable',
                aiSummary: 'Strong inclusion with 63% female and 69% underserved. Hackathon culture emerging. Needs research infrastructure investment to reach next CIS tier.'
            },
            inclusion: {
                femalePct: 63, underservedPct: 69, scholarshipsGranted: 78, womenInLeadership: 7,
                skillHoursDelivered: 2600, inclusionGrowthRate: 20, equityGapAlert: false, socioMobility: 65
            },
            research: {
                ideasGenerated: 10, patentsFiled: 0, papersSubmitted: 1, prototypes: 3, collaborations: 4,
                noveltyScore: 58, crossDomainIndex: 52, futureRelevance: 65
            },
            digital: {
                aiSystemsDeployed: 3, platformsCreated: 2, automationPipelines: 3, openSourceContributions: 2,
                globalTechCollaborations: 3, scalabilityIndex: 58, cyberResilienceScore: 60, sophisticationScore: 55
            },
            harmony: {
                webinarsHosted: 10, crossCulturalEvents: 7, serviceHours: 380, wellnessInitiatives: 4,
                conflictResolutionPrograms: 2, harmonySentimentScore: 72, communityMultiplier: 1.9
            },
            infra: {
                ici: 70, labs: 3, aiComputeLevel: 'Medium', cloudInfra: true, offlineClassrooms: 3,
                accessibilityScore: 80, sustainabilityScore: 68, equipmentUtilization: 75, serverBandwidth: '1 Gbps'
            }
        },
        {
            id: 'japan-tokyo', name: 'Tokyo East Asia Hub', shortName: 'Tokyo',
            country: 'Japan', countryCode: 'JP', utcOffset: 9, timezoneAbbr: 'JST',
            director: 'Prof. Hiroshi Tanaka', established: 2021, totalEnrolled: 250, totalTeachers: 22,
            lat: 35.7, lng: 139.7,
            cis: {
                overall: 89, womenParticipation: 68, lowestStrataInclusion: 62, originalResearch: 90,
                innovationDeployment: 88, digitalAdvancement: 92, globalHarmony: 86,
                trend: 'Rising',
                aiSummary: 'Asia-Pacific research powerhouse. Highest novelty score (91/100). 10 projects, 7 publications. Civilization Forum driving ethical AI governance at continental scale.'
            },
            inclusion: {
                femalePct: 52, underservedPct: 45, scholarshipsGranted: 58, womenInLeadership: 10,
                skillHoursDelivered: 4100, inclusionGrowthRate: 20, equityGapAlert: true, socioMobility: 78
            },
            research: {
                ideasGenerated: 32, patentsFiled: 4, papersSubmitted: 7, prototypes: 10, collaborations: 12,
                noveltyScore: 91, crossDomainIndex: 88, futureRelevance: 92
            },
            digital: {
                aiSystemsDeployed: 8, platformsCreated: 6, automationPipelines: 9, openSourceContributions: 6,
                globalTechCollaborations: 10, scalabilityIndex: 92, cyberResilienceScore: 90, sophisticationScore: 94
            },
            harmony: {
                webinarsHosted: 18, crossCulturalEvents: 15, serviceHours: 740, wellnessInitiatives: 7,
                conflictResolutionPrograms: 3, harmonySentimentScore: 86, communityMultiplier: 2.5
            },
            infra: {
                ici: 94, labs: 7, aiComputeLevel: 'High', cloudInfra: true, offlineClassrooms: 9,
                accessibilityScore: 80, sustainabilityScore: 88, equipmentUtilization: 90, serverBandwidth: '10 Gbps'
            }
        },
        {
            id: 'southafrica-capetown', name: 'Cape Town Center', shortName: 'Cape Town',
            country: 'South Africa', countryCode: 'ZA', utcOffset: 2, timezoneAbbr: 'SAST',
            director: 'Dr. Nomsa Dlamini', established: 2023, totalEnrolled: 120, totalTeachers: 9,
            lat: -33.9, lng: 18.4,
            cis: {
                overall: 63, womenParticipation: 82, lowestStrataInclusion: 88, originalResearch: 45,
                innovationDeployment: 58, digitalAdvancement: 55, globalHarmony: 65,
                trend: 'Rising',
                aiSummary: 'Newest center with strongest inclusion trajectory. 82 scholarships from underserved communities. Rapid growth (+35%). Needs research and digital investment to accelerate CIS.'
            },
            inclusion: {
                femalePct: 68, underservedPct: 74, scholarshipsGranted: 82, womenInLeadership: 5,
                skillHoursDelivered: 1800, inclusionGrowthRate: 35, equityGapAlert: false, socioMobility: 58
            },
            research: {
                ideasGenerated: 6, patentsFiled: 0, papersSubmitted: 0, prototypes: 2, collaborations: 2,
                noveltyScore: 48, crossDomainIndex: 42, futureRelevance: 60
            },
            digital: {
                aiSystemsDeployed: 2, platformsCreated: 1, automationPipelines: 2, openSourceContributions: 1,
                globalTechCollaborations: 2, scalabilityIndex: 48, cyberResilienceScore: 52, sophisticationScore: 45
            },
            harmony: {
                webinarsHosted: 7, crossCulturalEvents: 4, serviceHours: 280, wellnessInitiatives: 3,
                conflictResolutionPrograms: 1, harmonySentimentScore: 65, communityMultiplier: 1.5
            },
            infra: {
                ici: 60, labs: 1, aiComputeLevel: 'Basic', cloudInfra: false, offlineClassrooms: 2,
                accessibilityScore: 85, sustainabilityScore: 65, equipmentUtilization: 70, serverBandwidth: '100 Mbps'
            }
        }
    ]);

    // ── Center Day Status ───────────────────────────────────────
    centerDayStatus = signal<CenterDayStatus[]>([
        {
            centerId: 'india-raebareli', centerName: 'Raebareli Mission Center', shortName: 'Raebareli',
            country: 'India', countryCode: 'IN', utcOffset: 5.5, timezoneAbbr: 'IST',
            operationalStatus: 'Open', studentsPresent: 124, totalEnrolled: 150,
            teachersOnDuty: 10, totalTeachers: 12, dutyOfficer: 'Mr. Keshan Verma',
            alerts: ['Lab 3 projector needs repair'],
            todayVision: {
                activePillars: ['Inclusion', 'Digital'],
                primaryFocus: 'Rural Girls Digital Literacy Bootcamp — 42 first-gen learners',
                visionImpact: 'Breaking digital divide for 42 girls from 5 rural villages',
                learnersEngaged: 124,
                scores: { inclusion: 88, research: 40, innovation: 62, digital: 70, civilization: 68, overall: 78 },
                liveMetrics: { womenTrainedToday: 87, mentoringHoursToday: 18, scholarshipsAllocatedToday: 3, digitalToolsDeployedToday: 1, beneficiariesReachedToday: 124 }
            }
        },
        {
            centerId: 'usa-alabama', centerName: 'Alabama Innovation Center', shortName: 'Alabama',
            country: 'USA', countryCode: 'US', utcOffset: -6, timezoneAbbr: 'CST',
            operationalStatus: 'Open', studentsPresent: 178, totalEnrolled: 200,
            teachersOnDuty: 16, totalTeachers: 18, dutyOfficer: 'Dr. Sarah Mitchell',
            alerts: [],
            todayVision: {
                activePillars: ['Research', 'Innovation', 'Digital'],
                primaryFocus: 'AI for Underserved Communities — public research summit',
                visionImpact: 'Publishing 3 open-source AI tools for healthcare in low-income areas',
                learnersEngaged: 178,
                scores: { inclusion: 72, research: 92, innovation: 95, digital: 96, civilization: 85, overall: 91 },
                liveMetrics: { womenTrainedToday: 96, mentoringHoursToday: 32, scholarshipsAllocatedToday: 2, digitalToolsDeployedToday: 3, beneficiariesReachedToday: 340 }
            }
        },
        {
            centerId: 'uk-london', centerName: 'London Global Hub', shortName: 'London',
            country: 'United Kingdom', countryCode: 'GB', utcOffset: 0, timezoneAbbr: 'GMT',
            operationalStatus: 'Open', studentsPresent: 267, totalEnrolled: 300,
            teachersOnDuty: 22, totalTeachers: 25, dutyOfficer: 'Prof. James Whitfield',
            alerts: ['Global Summit at 14:00 — auditorium prep required'],
            todayVision: {
                activePillars: ['Research', 'Civilization'],
                primaryFocus: 'Global Leaders Summit — 18 nations represented',
                visionImpact: 'Shaping post-2030 education agenda with next-gen policy makers',
                learnersEngaged: 267,
                scores: { inclusion: 65, research: 94, innovation: 72, digital: 82, civilization: 92, overall: 88 },
                liveMetrics: { womenTrainedToday: 152, mentoringHoursToday: 45, scholarshipsAllocatedToday: 4, digitalToolsDeployedToday: 2, beneficiariesReachedToday: 580 }
            }
        },
        {
            centerId: 'nigeria-lagos', centerName: 'Lagos Mission Center', shortName: 'Lagos',
            country: 'Nigeria', countryCode: 'NG', utcOffset: 1, timezoneAbbr: 'WAT',
            operationalStatus: 'Open', studentsPresent: 152, totalEnrolled: 180,
            teachersOnDuty: 12, totalTeachers: 14, dutyOfficer: 'Dr. Adaeze Okonkwo',
            alerts: [],
            todayVision: {
                activePillars: ['Inclusion', 'Innovation'],
                primaryFocus: 'Women Entrepreneurs Incubation — cohort 3 launch',
                visionImpact: 'Launching 12 women-led social enterprises in underserved communities',
                learnersEngaged: 152,
                scores: { inclusion: 90, research: 55, innovation: 80, digital: 65, civilization: 75, overall: 80 },
                liveMetrics: { womenTrainedToday: 118, mentoringHoursToday: 28, scholarshipsAllocatedToday: 5, digitalToolsDeployedToday: 1, beneficiariesReachedToday: 280 }
            }
        },
        {
            centerId: 'australia-sydney', centerName: 'Sydney Pacific Center', shortName: 'Sydney',
            country: 'Australia', countryCode: 'AU', utcOffset: 11, timezoneAbbr: 'AEDT',
            operationalStatus: 'Closed', studentsPresent: 0, totalEnrolled: 220,
            teachersOnDuty: 0, totalTeachers: 20, dutyOfficer: 'Dr. Emma Clarke',
            alerts: [],
            todayVision: {
                activePillars: ['Digital'],
                primaryFocus: 'Day complete — all vision targets met',
                visionImpact: '6 digital platforms updated; 1,450 regional users positively impacted',
                learnersEngaged: 0,
                scores: { inclusion: 70, research: 78, innovation: 82, digital: 94, civilization: 80, overall: 88 },
                liveMetrics: { womenTrainedToday: 128, mentoringHoursToday: 22, scholarshipsAllocatedToday: 0, digitalToolsDeployedToday: 6, beneficiariesReachedToday: 1450 }
            }
        },
        {
            centerId: 'brazil-saopaulo', centerName: 'São Paulo Center', shortName: 'São Paulo',
            country: 'Brazil', countryCode: 'BR', utcOffset: -3, timezoneAbbr: 'BRT',
            operationalStatus: 'Open', studentsPresent: 134, totalEnrolled: 160,
            teachersOnDuty: 11, totalTeachers: 13, dutyOfficer: 'Dr. Carlos Mendes',
            alerts: ['Room booking pending for 15:00 hackathon'],
            todayVision: {
                activePillars: ['Inclusion', 'Innovation'],
                primaryFocus: 'Favela EdTech Hackathon — solving local sanitation data',
                visionImpact: 'Developing IoT solution for clean water access in 3 favela communities',
                learnersEngaged: 134,
                scores: { inclusion: 80, research: 48, innovation: 72, digital: 58, civilization: 62, overall: 72 },
                liveMetrics: { womenTrainedToday: 84, mentoringHoursToday: 16, scholarshipsAllocatedToday: 2, digitalToolsDeployedToday: 1, beneficiariesReachedToday: 180 }
            }
        },
        {
            centerId: 'japan-tokyo', centerName: 'Tokyo East Asia Hub', shortName: 'Tokyo',
            country: 'Japan', countryCode: 'JP', utcOffset: 9, timezoneAbbr: 'JST',
            operationalStatus: 'Open', studentsPresent: 219, totalEnrolled: 250,
            teachersOnDuty: 20, totalTeachers: 22, dutyOfficer: 'Prof. Hiroshi Tanaka',
            alerts: [],
            todayVision: {
                activePillars: ['Research', 'Innovation', 'Digital', 'Civilization'],
                primaryFocus: 'East Asia AI Civilization Forum — cross-university collaboration',
                visionImpact: 'Co-authoring 5-year roadmap for ethical AI governance in East Asia',
                learnersEngaged: 219,
                scores: { inclusion: 62, research: 92, innovation: 90, digital: 94, civilization: 88, overall: 89 },
                liveMetrics: { womenTrainedToday: 114, mentoringHoursToday: 38, scholarshipsAllocatedToday: 1, digitalToolsDeployedToday: 4, beneficiariesReachedToday: 420 }
            }
        },
        {
            centerId: 'southafrica-capetown', centerName: 'Cape Town Center', shortName: 'Cape Town',
            country: 'South Africa', countryCode: 'ZA', utcOffset: 2, timezoneAbbr: 'SAST',
            operationalStatus: 'Open', studentsPresent: 87, totalEnrolled: 120,
            teachersOnDuty: 7, totalTeachers: 9, dutyOfficer: 'Dr. Nomsa Dlamini',
            alerts: ['Attendance below 75% — intervention needed', 'Solar session at 16:00 needs confirmation'],
            todayVision: {
                activePillars: ['Inclusion'],
                primaryFocus: 'Cape Flats Youth Coding Initiative — session 4',
                visionImpact: 'Teaching programming to 87 youth from historically disadvantaged communities',
                learnersEngaged: 87,
                scores: { inclusion: 88, research: 38, innovation: 52, digital: 50, civilization: 58, overall: 63 },
                liveMetrics: { womenTrainedToday: 48, mentoringHoursToday: 12, scholarshipsAllocatedToday: 1, digitalToolsDeployedToday: 0, beneficiariesReachedToday: 87 }
            }
        }
    ]);

    // ── Live Activity Feed ──────────────────────────────────────
    globalActivities = signal<LiveActivity[]>([
        { id: 'a1', type: 'Course', title: 'Digital Literacy for Rural Women', center: 'Raebareli', centerCode: 'IN', participants: 42, femalePct: 100, inclusionLevel: 'High', domain: 'Digital Skills', minutesAgo: 5 },
        { id: 'a2', type: 'Research', title: 'AI Ethics in Low-Resource Healthcare Settings', center: 'Alabama', centerCode: 'US', participants: 23, femalePct: 52, inclusionLevel: 'Medium', domain: 'AI Research', minutesAgo: 12 },
        { id: 'a3', type: 'Workshop', title: 'Women Entrepreneurship Cohort 3 — Launch', center: 'Lagos', centerCode: 'NG', participants: 38, femalePct: 100, inclusionLevel: 'High', domain: 'Entrepreneurship', minutesAgo: 8 },
        { id: 'a4', type: 'Innovation', title: 'East Asia AI Civilization Forum', center: 'Tokyo', centerCode: 'JP', participants: 219, femalePct: 45, inclusionLevel: 'Medium', domain: 'AI Civilization', minutesAgo: 2 },
        { id: 'a5', type: 'Mentoring', title: 'Global Research Mentorship — 18 Active Pairs', center: 'London', centerCode: 'GB', participants: 36, femalePct: 58, inclusionLevel: 'Medium', domain: 'Research', minutesAgo: 15 },
        { id: 'a6', type: 'Innovation', title: 'Favela IoT Hackathon — Sanitation Solutions', center: 'São Paulo', centerCode: 'BR', participants: 45, femalePct: 62, inclusionLevel: 'High', domain: 'Social Innovation', minutesAgo: 30 },
        { id: 'a7', type: 'Course', title: 'Cape Flats Youth Coding Initiative', center: 'Cape Town', centerCode: 'ZA', participants: 87, femalePct: 55, inclusionLevel: 'High', domain: 'Programming', minutesAgo: 45 },
        { id: 'a8', type: 'Research', title: 'Quantum Computing for Sustainable Development', center: 'Sydney', centerCode: 'AU', participants: 18, femalePct: 50, inclusionLevel: 'Medium', domain: 'Quantum Tech', minutesAgo: 65 },
    ]);

    // ── Research & Innovation Stream ────────────────────────────
    researchStream = signal<ResearchEntry[]>([
        { id: 'r1', title: 'Federated Learning for Privacy-Preserving Healthcare in Rural India', center: 'Raebareli', centerCode: 'IN', category: 'AI / Healthcare', minutesAgo: 18, noveltyScore: 87 },
        { id: 'r2', title: 'Decentralized Identity Systems for Underserved Populations', center: 'Alabama', centerCode: 'US', category: 'Blockchain / Inclusion', minutesAgo: 34, noveltyScore: 82 },
        { id: 'r3', title: 'Ethical AI Governance Framework for East Asian Contexts', center: 'Tokyo', centerCode: 'JP', category: 'AI Ethics', minutesAgo: 52, noveltyScore: 91 },
        { id: 'r4', title: 'Women-Led Social Enterprise Incubation — Outcomes Study', center: 'Lagos', centerCode: 'NG', category: 'Social Science', minutesAgo: 78, noveltyScore: 75 },
        { id: 'r5', title: 'Post-2030 Education Policy for Civilisation Advancement', center: 'London', centerCode: 'GB', category: 'Education Policy', minutesAgo: 95, noveltyScore: 88 },
    ]);

    // ── Network 6-month CIS aggregates ─────────────────────────
    network6mCIS = computed(() => {
        const p = this.centerProfiles();
        const n = p.length;
        const avg = (fn: (c: CenterProfile) => number) =>
            Math.round(p.reduce((s, c) => s + fn(c), 0) / n);
        return {
            overall: avg(c => c.cis.overall),
            womenParticipation: avg(c => c.cis.womenParticipation),
            lowestStrataInclusion: avg(c => c.cis.lowestStrataInclusion),
            originalResearch: avg(c => c.cis.originalResearch),
            innovationDeployment: avg(c => c.cis.innovationDeployment),
            digitalAdvancement: avg(c => c.cis.digitalAdvancement),
            globalHarmony: avg(c => c.cis.globalHarmony),
        };
    });

    network6mInclusion = computed(() => {
        const p = this.centerProfiles();
        return {
            avgFemalePct: Math.round(p.reduce((s, c) => s + c.inclusion.femalePct, 0) / p.length),
            avgUnderservedPct: Math.round(p.reduce((s, c) => s + c.inclusion.underservedPct, 0) / p.length),
            totalScholarships: p.reduce((s, c) => s + c.inclusion.scholarshipsGranted, 0),
            totalWomenLeaders: p.reduce((s, c) => s + c.inclusion.womenInLeadership, 0),
            totalSkillHours: p.reduce((s, c) => s + c.inclusion.skillHoursDelivered, 0),
            avgSocioMobility: Math.round(p.reduce((s, c) => s + c.inclusion.socioMobility, 0) / p.length),
            equityAlerts: p.filter(c => c.inclusion.equityGapAlert).length,
        };
    });

    network6mResearch = computed(() => {
        const p = this.centerProfiles();
        return {
            totalIdeas: p.reduce((s, c) => s + c.research.ideasGenerated, 0),
            totalPatents: p.reduce((s, c) => s + c.research.patentsFiled, 0),
            totalPapers: p.reduce((s, c) => s + c.research.papersSubmitted, 0),
            totalPrototypes: p.reduce((s, c) => s + c.research.prototypes, 0),
            totalCollabs: p.reduce((s, c) => s + c.research.collaborations, 0),
            avgNovelty: Math.round(p.reduce((s, c) => s + c.research.noveltyScore, 0) / p.length),
        };
    });

    network6mDigital = computed(() => {
        const p = this.centerProfiles();
        return {
            totalAiSystems: p.reduce((s, c) => s + c.digital.aiSystemsDeployed, 0),
            totalPlatforms: p.reduce((s, c) => s + c.digital.platformsCreated, 0),
            totalAutomation: p.reduce((s, c) => s + c.digital.automationPipelines, 0),
            totalOpenSource: p.reduce((s, c) => s + c.digital.openSourceContributions, 0),
            totalGlobalCollab: p.reduce((s, c) => s + c.digital.globalTechCollaborations, 0),
            avgScalability: Math.round(p.reduce((s, c) => s + c.digital.scalabilityIndex, 0) / p.length),
        };
    });

    network6mHarmony = computed(() => {
        const p = this.centerProfiles();
        return {
            totalWebinars: p.reduce((s, c) => s + c.harmony.webinarsHosted, 0),
            totalEvents: p.reduce((s, c) => s + c.harmony.crossCulturalEvents, 0),
            totalService: p.reduce((s, c) => s + c.harmony.serviceHours, 0),
            totalWellness: p.reduce((s, c) => s + c.harmony.wellnessInitiatives, 0),
            avgSentiment: Math.round(p.reduce((s, c) => s + c.harmony.harmonySentimentScore, 0) / p.length),
            avgMultiplier: Math.round(p.reduce((s, c) => s + c.harmony.communityMultiplier, 0) / p.length * 10) / 10,
        };
    });

    // ── Network today aggregates ────────────────────────────────
    networkToday = computed(() => {
        const d = this.centerDayStatus();
        const open = d.filter(c => c.operationalStatus === 'Open');
        const n = open.length;
        const avg = (fn: (c: CenterDayStatus) => number) =>
            n === 0 ? 0 : Math.round(open.reduce((s, c) => s + fn(c), 0) / n);
        return {
            openCenters: open.length,
            totalCenters: d.length,
            totalLearnersEngaged: d.reduce((s, c) => s + c.todayVision.learnersEngaged, 0),
            onVision: open.filter(c => c.todayVision.scores.overall >= 80).length,
            needsPush: open.filter(c => c.todayVision.scores.overall >= 65 && c.todayVision.scores.overall < 80).length,
            critical: open.filter(c => c.todayVision.scores.overall < 65).length,
            totalAlerts: d.reduce((s, c) => s + c.alerts.length, 0),
            avgVisionScore: avg(c => c.todayVision.scores.overall),
        };
    });

    networkLiveCounters = computed(() => {
        const d = this.centerDayStatus();
        return {
            womenTrainedToday: d.reduce((s, c) => s + c.todayVision.liveMetrics.womenTrainedToday, 0),
            mentoringHoursToday: d.reduce((s, c) => s + c.todayVision.liveMetrics.mentoringHoursToday, 0),
            scholarshipsAllocatedToday: d.reduce((s, c) => s + c.todayVision.liveMetrics.scholarshipsAllocatedToday, 0),
            digitalToolsDeployedToday: d.reduce((s, c) => s + c.todayVision.liveMetrics.digitalToolsDeployedToday, 0),
            beneficiariesReachedToday: d.reduce((s, c) => s + c.todayVision.liveMetrics.beneficiariesReachedToday, 0),
        };
    });

    // ── Civilization 2035 Progress ──────────────────────────────
    civilization2035Progress = computed(() => {
        const p = this.centerProfiles();
        const avgCis = p.reduce((s, c) => s + c.cis.overall, 0) / p.length;
        const countries = new Set(p.map(c => c.country)).size;
        // Targets: 100 centers in 100 countries with avg CIS 90
        const centerScore = (p.length / 100) * 30;
        const countryScore = (countries / 100) * 20;
        const cisScore = (avgCis / 90) * 35;
        const leaderScore = Math.min(1, this.network6mInclusion().totalWomenLeaders / 500) * 15;
        return Math.min(100, Math.round(centerScore + countryScore + cisScore + leaderScore));
    });

    // ── AI Strategic Summary ────────────────────────────────────
    aiStrategicSummary = computed(() => {
        const inc = this.network6mInclusion();
        const res = this.network6mResearch();
        const dig = this.network6mDigital();
        const n = this.centerProfiles().length;
        const countries = new Set(this.centerProfiles().map(c => c.country)).size;
        return `In the last 6 months, ${n} centers across ${countries} countries granted ${inc.totalScholarships} scholarships, trained ${inc.totalSkillHours.toLocaleString()} skill-hours, generated ${res.totalIdeas} original research ideas with avg novelty ${res.avgNovelty}/100, and deployed ${dig.totalAiSystems} AI systems plus ${dig.totalPlatforms} platforms globally. Overall Civilization Impact Score: ${this.network6mCIS().overall}/100.`;
    });

    // ── AI Advisor Insights ─────────────────────────────────────
    advisorInsights = computed((): AdvisorInsight[] => {
        const p = this.centerProfiles();
        const insights: AdvisorInsight[] = [];

        // Equity alerts
        p.filter(c => c.inclusion.equityGapAlert).forEach(c => {
            insights.push({ type: 'Alert', center: c.shortName, message: `Female participation at ${c.inclusion.femalePct}% — below 60% equity threshold. Targeted recruitment program recommended.`, priority: 'High' });
        });
        // Low CIS
        p.filter(c => c.cis.overall < 70).sort((a, b) => a.cis.overall - b.cis.overall).slice(0, 2).forEach(c => {
            insights.push({ type: 'Action', center: c.shortName, message: `CIS at ${c.cis.overall}/100 — below 70 threshold. Recommend research mentorship pairing with top-3 centers.`, priority: 'High' });
        });
        // Rising center opportunity
        const rising = [...p].filter(c => c.cis.trend === 'Rising' && c.cis.overall >= 70)
            .sort((a, b) => b.inclusion.inclusionGrowthRate - a.inclusion.inclusionGrowthRate)[0];
        if (rising) {
            insights.push({ type: 'Opportunity', center: rising.shortName, message: `Rising trajectory (+${rising.inclusion.inclusionGrowthRate}% inclusion growth). Eligible for advanced research program tier.`, priority: 'Medium' });
        }
        // Top performer recognition
        const top = [...p].sort((a, b) => b.cis.overall - a.cis.overall)[0];
        insights.push({ type: 'Recognition', center: top.shortName, message: `Highest CIS globally (${top.cis.overall}/100). Designate as best-practice hub — schedule network knowledge transfer.`, priority: 'Low' });
        // Research gap
        const lowResearch = p.filter(c => c.research.ideasGenerated < 10);
        if (lowResearch.length > 0) {
            insights.push({ type: 'Action', center: 'Network', message: `${lowResearch.length} centers generating fewer than 10 research ideas/6mo. Launch inter-center research mentorship programme.`, priority: 'Medium' });
        }
        return insights.slice(0, 5);
    });

    // ── Filtered lists ──────────────────────────────────────────
    filteredLeft = computed(() => {
        const q = this.searchQuery().toLowerCase();
        if (this.searchService.globalFilters().scope === 'global' || !q) return this.centerProfiles();
        return this.centerProfiles().filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.country.toLowerCase().includes(q) ||
            c.shortName.toLowerCase().includes(q)
        );
    });

    filteredToday = computed(() => {
        const q = this.searchQuery().toLowerCase();
        if (this.searchService.globalFilters().scope === 'global' || !q) return this.centerDayStatus();
        return this.centerDayStatus().filter(c =>
            c.centerName.toLowerCase().includes(q) ||
            c.country.toLowerCase().includes(q) ||
            c.shortName.toLowerCase().includes(q)
        );
    });

    // When search narrows to exactly 1 center → profile mode
    selectedCenter = computed((): CenterProfile | null => {
        const m = this.filteredLeft();
        return m.length === 1 ? m[0] : null;
    });

    selectedCenterToday = computed((): CenterDayStatus | null => {
        const sc = this.selectedCenter();
        if (!sc) return null;
        return this.centerDayStatus().find(d => d.centerId === sc.id) ?? null;
    });

    // ── Constructor ─────────────────────────────────────────────
    constructor() {
        this.searchService.globalQuery.set('');
        this.searchService.globalFilters.update(f => ({ ...f, scope: 'local' }));

        interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.currentTime.set(new Date());
        });
        interval(30000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.simulateLiveUpdate();
        });
    }

    private simulateLiveUpdate() {
        this.lastUpdated.set(new Date());
        this.centerDayStatus.update(centers =>
            centers.map(c => {
                if (c.operationalStatus !== 'Open') return c;
                const delta = Math.floor(Math.random() * 4) - 1;
                const engaged = Math.max(0, Math.min(c.totalEnrolled, c.todayVision.learnersEngaged + delta));
                return { ...c, studentsPresent: engaged, todayVision: { ...c.todayVision, learnersEngaged: engaged } };
            })
        );
        // Age activities
        this.globalActivities.update(acts => acts.map(a => ({ ...a, minutesAgo: a.minutesAgo + 0.5 })));
        this.researchStream.update(rs => rs.map(r => ({ ...r, minutesAgo: r.minutesAgo + 0.5 })));
    }

    // Search is handled internally by app-global-search now
    clearSearch() { this.searchService.globalQuery.set(''); }

    // ── SVG Radar Chart Helpers ─────────────────────────────────
    radarPoints(values: number[], cx: number, cy: number, r: number): string {
        return values.map((v, i) => {
            const a = (i * Math.PI * 2 / values.length) - Math.PI / 2;
            return `${cx + (v / 100) * r * Math.cos(a)},${cy + (v / 100) * r * Math.sin(a)}`;
        }).join(' ');
    }

    radarGrid(level: number, total: number, cx: number, cy: number, r: number): string {
        const fr = (level / 5) * r;
        return Array.from({ length: total }, (_, i) => {
            const a = (i * Math.PI * 2 / total) - Math.PI / 2;
            return `${cx + fr * Math.cos(a)},${cy + fr * Math.sin(a)}`;
        }).join(' ');
    }

    radarAxisX(i: number, total: number, cx: number, cy: number, r: number): number {
        return cx + r * Math.cos((i * Math.PI * 2 / total) - Math.PI / 2);
    }

    radarAxisY(i: number, total: number, cx: number, cy: number, r: number): number {
        return cy + r * Math.sin((i * Math.PI * 2 / total) - Math.PI / 2);
    }

    getCisRadarValues(cis: CivilizationImpactScore): number[] {
        return [cis.womenParticipation, cis.lowestStrataInclusion, cis.originalResearch,
        cis.innovationDeployment, cis.digitalAdvancement, cis.globalHarmony];
    }

    // ── World Map Helpers ───────────────────────────────────────
    mapX(lng: number, width = 520): number {
        return Math.round((lng + 180) / 360 * width);
    }

    mapY(lat: number, height = 260): number {
        return Math.round((90 - lat) / 180 * height);
    }

    // ── Style Helpers ───────────────────────────────────────────
    getLocalTime(utcOffset: number): string {
        const now = this.currentTime();
        const local = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + utcOffset * 3600000);
        return `${local.getHours().toString().padStart(2, '0')}:${local.getMinutes().toString().padStart(2, '0')}:${local.getSeconds().toString().padStart(2, '0')}`;
    }

    getCisColor(score: number): string {
        return score >= 80 ? '#22c55e' : score >= 65 ? '#f59e0b' : '#ef4444';
    }

    getTrendIcon(trend: string): string {
        return trend === 'Rising' ? 'fa-arrow-trend-up' : trend === 'Declining' ? 'fa-arrow-trend-down' : 'fa-minus';
    }

    getTrendColor(trend: string): string {
        return trend === 'Rising' ? '#22c55e' : trend === 'Declining' ? '#ef4444' : '#6b7280';
    }

    getOpColor(s: string): string {
        return s === 'Open' ? '#22c55e' : s === 'Holiday' ? '#60a5fa' : s === 'Maintenance' ? '#f59e0b' : '#6b7280';
    }

    getPillarColor(pillar: string): string {
        const m: Record<string, string> = { Inclusion: '#c084fc', Research: '#60a5fa', Innovation: '#ef9d57', Digital: '#22c55e', Civilization: '#fbbf24' };
        return m[pillar] ?? '#6b7280';
    }

    getPillarIcon(pillar: string): string {
        const m: Record<string, string> = { Inclusion: 'fa-hands-holding-child', Research: 'fa-flask', Innovation: 'fa-lightbulb', Digital: 'fa-globe', Civilization: 'fa-star' };
        return m[pillar] ?? 'fa-circle';
    }

    getActivityIcon(type: string): string {
        const m: Record<string, string> = { Course: 'fa-book-open', Workshop: 'fa-tools', Research: 'fa-flask', Mentoring: 'fa-user-graduate', Innovation: 'fa-lightbulb' };
        return m[type] ?? 'fa-circle';
    }

    getActivityColor(type: string): string {
        const m: Record<string, string> = { Course: '#60a5fa', Workshop: '#ef9d57', Research: '#c084fc', Mentoring: '#fbbf24', Innovation: '#22c55e' };
        return m[type] ?? '#6b7280';
    }

    getInclusionColor(level: string): string {
        return level === 'High' ? '#22c55e' : level === 'Medium' ? '#f59e0b' : '#ef4444';
    }

    getInsightIcon(type: string): string {
        const m: Record<string, string> = { Alert: 'fa-triangle-exclamation', Opportunity: 'fa-rocket', Action: 'fa-bolt', Recognition: 'fa-trophy' };
        return m[type] ?? 'fa-circle';
    }

    getInsightColor(type: string): string {
        const m: Record<string, string> = { Alert: '#ef4444', Opportunity: '#22c55e', Action: '#f59e0b', Recognition: '#fbbf24' };
        return m[type] ?? '#6b7280';
    }

    getPriorityColor(p: string): string {
        return p === 'High' ? '#ef4444' : p === 'Medium' ? '#f59e0b' : '#6b7280';
    }

    minutesAgoLabel(min: number): string {
        if (min < 1) return 'just now';
        if (min < 60) return `${Math.floor(min)}m ago`;
        return `${Math.floor(min / 60)}h ago`;
    }

    getCisPrimaryComponent(cis: CivilizationImpactScore): string {
        const scores: [string, number][] = [
            ['Women', cis.womenParticipation],
            ['Inclusion', cis.lowestStrataInclusion],
            ['Research', cis.originalResearch],
            ['Innovation', cis.innovationDeployment],
            ['Digital', cis.digitalAdvancement],
            ['Harmony', cis.globalHarmony],
        ];
        return scores.reduce((best, cur) => cur[1] > best[1] ? cur : best, scores[0])[0];
    }

    getCenterProfileById(centerId: string): CenterProfile | null {
        return this.centerProfiles().find(p => p.id === centerId) ?? null;
    }
}
