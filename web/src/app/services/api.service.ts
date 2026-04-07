import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Org {
  id: number;
  name: string;
  email: string;
}

export interface EventVolunteer {
  volunteerId: number;
  email: string;
  status: string;
  motivation?: string;
}

export interface EventItem {
  id: number;
  title: string;
  skill: string;
  maxVol: number;
  image: string | null;
  orgId: number;
  orgName: string;
  status: string;
  volunteers: EventVolunteer[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  orgSignup(payload: { name: string; email: string; password: string }): Observable<Org> {
    return this.http.post<Org>(`${this.baseUrl}/orgs/signup`, payload);
  }

  orgLogin(payload: { email: string; password: string }): Observable<Org> {
    return this.http.post<Org>(`${this.baseUrl}/orgs/login`, payload);
  }

  getEventsByOrg(orgId: number): Observable<EventItem[]> {
    return this.http.get<EventItem[]>(`${this.baseUrl}/events?orgId=${orgId}`);
  }

  createEvent(payload: {
    title: string;
    skill: string;
    maxVol: number;
    image?: string | null;
    orgId: number;
  }): Observable<EventItem> {
    return this.http.post<EventItem>(`${this.baseUrl}/events`, payload);
  }

  updateVolunteerStatus(eventId: number, volunteerId: number, status: string): Observable<{ status: string }> {
    return this.http.patch<{ status: string }>(
      `${this.baseUrl}/events/${eventId}/volunteers/${volunteerId}`,
      { status }
    );
  }
}
