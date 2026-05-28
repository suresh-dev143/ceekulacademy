import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// ── Types — mirror physicalNodeModel.js ───────────────────────────────────────

export type NodeType   = 'LDA' | 'LCC' | 'RCC' | 'Ceekul' | 'FloatingCity' | 'SpaceHabitat';
export type NodeStatus = 'planned' | 'under_construction' | 'active' | 'operational';

export interface PhysicalNode {
  nodeId:        string;
  nodeType:      NodeType;
  tier:          1 | 2 | 3 | 4 | 5;
  name:          string;
  description:   string;
  status:        NodeStatus;
  coordinates:   { lat: number; lng: number; altitudeM: number };
  gridRef:       { x: number; y: number };
  parentNodeId:  string | null;
  ancestorChain: string[];
  dimensions:    { footprintKm: number; greenZoneKm: number; storeys: number };
  capacity:      { maxResidents: number; maxDailyVisitors: number; currentPopulation: number };
  isOrigin:      boolean;
  missionDistrictId: string | null;
}

export interface GridNearestResult {
  nodeId:      string;
  gridRef:     { x: number; y: number; lat: number; lng: number };
  distanceKm:  number;
  node:        PhysicalNode | null;
  registered:  boolean;
}

export interface OriginArea {
  origin: { lat: number; lng: number; name: string };
  rcc:    PhysicalNode | null;
  nearby: PhysicalNode[];
}

// ── Origin constant (mirrors server) ─────────────────────────────────────────

export const CEEKUL_ORIGIN = Object.freeze({
  lat:  26.2200,
  lng:  81.2300,
  name: 'Musapur, Sareni, Raebareli, Uttar Pradesh, India',
});

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * PhysicalGridService — P1: Physical Node Registry (Angular)
 *
 * The Angular bridge to the Ceekul physical infrastructure grid.
 * Exposes the 5-tier node hierarchy as reactive signals and provides
 * O(1) local grid calculations (no server round-trip for position math).
 *
 * On init:
 *   Fetches GET /api/physical/origin — Musapur RCC + surrounding area.
 *   All components that need geographic context inject this service.
 *
 * C4: physical grid is public knowledge — no authentication required to read.
 * C9: every coordination activity is anchored to a physical node.
 */
@Injectable({ providedIn: 'root' })
export class PhysicalGridService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http      = inject(HttpClient);
  private readonly base      = `${environment.apiUrl}/physical`;

  // ── Signals ───────────────────────────────────────────────────────────────

  readonly originArea = signal<OriginArea | null>(null);
  readonly nodes      = signal<PhysicalNode[]>([]);
  readonly loading    = signal(false);

  readonly originRcc  = computed(() => this.originArea()?.rcc ?? null);
  readonly isSeeded   = computed(() => this.originRcc() !== null);

  constructor() {
    if (!this.isBrowser) return;
    this.loadOrigin();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Load the Musapur origin area (RCC + surrounding LDAs and LCCs). */
  loadOrigin(): void {
    this.loading.set(true);
    this.http.get<{ success: boolean } & OriginArea>(
      `${this.base}/origin`
    ).subscribe({
      next: (res) => {
        if (res?.success) {
          this.originArea.set({ origin: res.origin, rcc: res.rcc, nearby: res.nearby });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Load all registered nodes, optionally filtered by type. */
  loadNodes(nodeType?: NodeType): void {
    const params = nodeType ? `?nodeType=${nodeType}` : '';
    this.http.get<{ success: boolean; nodes: PhysicalNode[] }>(
      `${this.base}/nodes${params}`
    ).subscribe({
      next: (res) => { if (res?.success) this.nodes.set(res.nodes); },
      error: () => {},
    });
  }

  /** Find the nearest node of a given tier to a lat/lng coordinate. */
  findNearest(lat: number, lng: number, tier: 'LCC' | 'RCC' | 'LDA') {
    return this.http.get<{ success: boolean } & GridNearestResult>(
      `${this.base}/grid/nearest?lat=${lat}&lng=${lng}&tier=${tier}`
    );
  }

  /** Get a specific node by ID. */
  getNode(nodeId: string) {
    return this.http.get<{ success: boolean; node: PhysicalNode }>(
      `${this.base}/nodes/${encodeURIComponent(nodeId)}`
    );
  }

  /** Get the full ancestry chain for a node (bottom → Ceekul). */
  getHierarchy(nodeId: string) {
    return this.http.get<{ success: boolean; node: PhysicalNode; hierarchy: PhysicalNode[] }>(
      `${this.base}/nodes/${encodeURIComponent(nodeId)}/hierarchy`
    );
  }

  /** Get direct children of a node. */
  getChildren(nodeId: string) {
    return this.http.get<{ success: boolean; children: PhysicalNode[] }>(
      `${this.base}/nodes/${encodeURIComponent(nodeId)}/children`
    );
  }

  // ── Local grid calculations (O(1), no server round-trip) ─────────────────

  /** Convert km-offset grid reference to lat/lng. */
  gridRefToCoordinates(x: number, y: number): { lat: number; lng: number } {
    const KM_PER_LAT = 111.32;
    const KM_PER_LNG = KM_PER_LAT * Math.cos(CEEKUL_ORIGIN.lat * Math.PI / 180);
    return {
      lat: CEEKUL_ORIGIN.lat + (y / KM_PER_LAT),
      lng: CEEKUL_ORIGIN.lng + (x / KM_PER_LNG),
    };
  }

  /** Convert lat/lng to km-offset grid reference from Musapur origin. */
  coordinatesToGridRef(lat: number, lng: number): { x: number; y: number } {
    const KM_PER_LAT = 111.32;
    const KM_PER_LNG = KM_PER_LAT * Math.cos(CEEKUL_ORIGIN.lat * Math.PI / 180);
    return {
      x: (lng - CEEKUL_ORIGIN.lng) * KM_PER_LNG,
      y: (lat - CEEKUL_ORIGIN.lat) * KM_PER_LAT,
    };
  }

  /** Calculate the LCC nodeId for the nearest grid point to a coordinate. */
  nearestLccNodeId(lat: number, lng: number): string {
    const { x, y } = this.coordinatesToGridRef(lat, lng);
    const i = Math.round(x / 10);
    const j = Math.round(y / 10);
    return `LCC.${i}.${j}`;
  }

  /** Calculate the LDA nodeId that contains a coordinate. */
  ldaNodeIdForCoordinate(lat: number, lng: number): string {
    const { x, y } = this.coordinatesToGridRef(lat, lng);
    const i = Math.floor(x / 10);
    const j = Math.floor(y / 10);
    return `LDA.${i}.${j}`;
  }

  /** Haversine distance in km between two coordinates. */
  haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R  = 6371;
    const dL = (lat2 - lat1) * Math.PI / 180;
    const dN = (lng2 - lng1) * Math.PI / 180;
    const a  = Math.sin(dL / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dN / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Human-readable description of a node's tier. */
  tierLabel(tier: number): string {
    switch (tier) {
      case 1: return 'Local Development Area';
      case 2: return 'Local Ceekul Center';
      case 3: return 'Regional Ceekul Center';
      case 4: return 'Ceekul';
      case 5: return 'Floating City / Space Habitat';
      default: return 'Unknown';
    }
  }
}
