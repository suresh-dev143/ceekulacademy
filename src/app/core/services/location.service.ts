import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, of } from 'rxjs';
import { Address, GeoLocation } from '../models/address.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);

  /**
   * Get traveler's current GPS location
   */
  getCurrentLocation(): Observable<GeoLocation> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude]
          });
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  /**
   * Mock Geocoding (Since we don't have a live API key provided in the prompt, 
   * we provide the structure for real integration)
   */
  geocodeAddress(address: string): Observable<GeoLocation> {
    // Real implementation would use Google Geocoding API:
    // return this.http.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${environment.googleMapsApiKey}`)
    
    // For now, return a random-ish location near Noida if it's a mock
    console.log('Geocoding address:', address);
    return of({
      type: 'Point',
      coordinates: [77.3910, 28.5355]
    });
  }

  /**
   * Calculate distance between two points in km (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(1));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
