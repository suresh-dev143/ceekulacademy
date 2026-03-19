import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InfrastructurePayload, UpdateInfrastructurePayload, InfrastructureResponse, Classroom, ClassroomResponse, UpdateClassroomPayload, ComputerLab, ComputerLabResponse, UpdateComputerLabPayload, OtherFacility, OtherFacilityResponse, UpdateFacilityPayload } from '../models/infrastructure.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing partner infrastructure details.
 * Follows enterprise-grade standards with robust typing and clear separation of concerns.
 */
@Injectable({
  providedIn: 'root'
})
export class InfrastructureService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/partners/infrastructure`;

  /**
   * Standard headers for all JSON requests.
   */
  private readonly defaultHeaders = new HttpHeaders({
    'Content-Type': 'application/json; charset=utf-8'
  });

  /**
   * Creates new infrastructure for the partner.
   * @param payload The infrastructure details to create.
   * @returns An observable of the creation response.
   */
  addInfrastructure(payload: InfrastructurePayload): Observable<InfrastructureResponse> {
    return this.http.post<InfrastructureResponse>(this.baseUrl, payload, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Updates an existing infrastructure record.
   * @param id The ID of the infrastructure to update.
   * @param payload The updated infrastructure data.
   * @returns An observable of the update response.
   */
  updateInfrastructure(id: string, payload: UpdateInfrastructurePayload): Observable<InfrastructureResponse> {
    return this.http.patch<InfrastructureResponse>(`${this.baseUrl}/${id}`, payload, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Deletes an infrastructure record by ID.
   * @param id The ID of the infrastructure to delete.
   * @returns An observable of the deletion response.
   */
  deleteInfrastructure(id: string): Observable<InfrastructureResponse> {
    return this.http.delete<InfrastructureResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Retrieves infrastructure details for the current partner context.
   * @returns An observable of the infrastructure retrieval response.
   */
  getInfrastructure(): Observable<InfrastructureResponse> {
    return this.http.get<InfrastructureResponse>(this.baseUrl);
  }

  /**
   * Adds a classroom to a specific infrastructure.
   * @param id The ID of the infrastructure record.
   * @param payload The classroom data to add.
   * @returns An observable of the creation response.
   */
  /**
   * Adds a classroom to a specific infrastructure.
   * @param id The ID of the infrastructure record.
   * @param payload The classroom data to add.
   * @returns An observable of the creation response.
   */
  addClassroom(id: string, payload: Classroom): Observable<ClassroomResponse> {
    return this.http.post<ClassroomResponse>(`${this.baseUrl}/${id}/classrooms`, payload, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Updates an existing classroom in the infrastructure.
   * @param id The ID of the infrastructure record.
   * @param classroomId The internal ID of the classroom.
   * @param payload The partial classroom data to update.
   * @returns An observable of the update response.
   */
  updateClassroom(id: string, classroomId: string, payload: UpdateClassroomPayload): Observable<ClassroomResponse> {
    return this.http.patch<ClassroomResponse>(`${this.baseUrl}/${id}/classrooms/${classroomId}`, payload, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Adds a computer lab to a specific infrastructure.
   * @param id The ID of the infrastructure record.
   * @param payload The computer lab data to add.
   * @returns An observable of the creation response.
   */
  addComputerLab(id: string, payload: ComputerLab): Observable<ComputerLabResponse> {
    return this.http.post<ComputerLabResponse>(`${this.baseUrl}/${id}/computer-labs`, payload, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Updates an existing computer lab in the infrastructure.
   * @param id The ID of the infrastructure record.
   * @param labId The internal ID of the computer lab.
   * @param payload The partial computer lab data to update.
   * @returns An observable of the update response.
   */
  updateComputerLab(id: string, labId: string, payload: UpdateComputerLabPayload): Observable<ComputerLabResponse> {
    return this.http.patch<ComputerLabResponse>(`${this.baseUrl}/${id}/computer-labs/${labId}`, payload, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Adds a facility to a specific infrastructure.
   * @param id The ID of the infrastructure record.
   * @param payload The facility data to add.
   * @returns An observable of the creation response.
   */
  addFacility(id: string, payload: OtherFacility): Observable<OtherFacilityResponse> {
    return this.http.post<OtherFacilityResponse>(`${this.baseUrl}/${id}/facilities`, payload, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Deletes a classroom from a specific infrastructure.
   * @param id The ID of the infrastructure record.
   * @param classroomId The internal ID of the classroom.
   * @returns An observable of the deletion response.
   */
  deleteClassroom(id: string, classroomId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/classrooms/${classroomId}`, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Deletes a computer lab from a specific infrastructure.
   * @param id The ID of the infrastructure record.
   * @param labId The internal ID of the computer lab.
   * @returns An observable of the deletion response.
   */
  deleteComputerLab(id: string, labId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/computer-labs/${labId}`, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Deletes a facility from a specific infrastructure.
   * @param id The ID of the infrastructure record.
   * @param facilityId The internal ID of the facility.
   * @returns An observable of the deletion response.
   */
  deleteFacility(id: string, facilityId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/facilities/${facilityId}`, {
      headers: this.defaultHeaders
    });
  }

  /**
   * Updates an existing facility in the infrastructure.
   * @param id The ID of the infrastructure record.
   * @param facilityId The internal ID of the facility.
   * @param payload The partial facility data to update.
   * @returns An observable of the update response.
   */
  updateFacility(id: string, facilityId: string, payload: UpdateFacilityPayload): Observable<OtherFacilityResponse> {
    return this.http.patch<OtherFacilityResponse>(`${this.baseUrl}/${id}/facilities/${facilityId}`, payload, {
      headers: this.defaultHeaders
    });
  }
}

