import { Injectable } from '@angular/core';

export interface Volunteer {
  name: string;
  email: string;
  skills: string;
  password: string;
  photo: string;
  badges: string[];
}

export interface Org {
  name: string;
  email: string;
  password: string;
}

export interface EventVolunteer {
  email: string;
  status: string;
  motivation?: string;
}

export interface EventItem {
  title: string;
  skill: string;
  maxVol: number;
  image: string;
  orgName: string;
  status: string;
  volunteers: EventVolunteer[];
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private getJson<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private setJson<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getVolunteers(): Volunteer[] {
    return this.getJson<Volunteer[]>('volunteers', []);
  }

  setVolunteers(volunteers: Volunteer[]) {
    this.setJson('volunteers', volunteers);
  }

  getOrgs(): Org[] {
    return this.getJson<Org[]>('orgs', []);
  }

  setOrgs(orgs: Org[]) {
    this.setJson('orgs', orgs);
  }

  getEvents(): EventItem[] {
    return this.getJson<EventItem[]>('events', []);
  }

  setEvents(events: EventItem[]) {
    this.setJson('events', events);
  }

  setCurrentOrgEmail(email: string) {
    localStorage.setItem('currentOrgEmail', email);
  }

  getCurrentOrgEmail(): string | null {
    return localStorage.getItem('currentOrgEmail');
  }

  clearCurrentOrg() {
    localStorage.removeItem('currentOrgEmail');
  }
}
