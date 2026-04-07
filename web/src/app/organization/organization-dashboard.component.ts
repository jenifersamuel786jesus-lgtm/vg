import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, EventItem } from '../services/api.service';

interface CurrentOrg {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-organization-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="layout">
    <div class="sidebar">
      <h3>{{ orgName }}</h3>
      <button (click)="logout()">Logout</button>
    </div>
    <div class="main">
      <div class="card">
        <h2>Create Event</h2>
        <input [(ngModel)]="title" placeholder="Title" />
        <input [(ngModel)]="skill" placeholder="Skill" />
        <input [(ngModel)]="maxVol" placeholder="Max Volunteers" />
        <input [(ngModel)]="image" placeholder="Image URL" />
        <button (click)="addEvent()">Post</button>
        <p *ngIf="error" style="color:crimson">{{ error }}</p>
      </div>

      <h2>Manage Events</h2>
      <div class="card" *ngFor="let ev of orgEvents">
        <h3>{{ ev.title }}</h3>
        <div *ngIf="ev.volunteers.length === 0">No volunteers yet</div>
        <p *ngFor="let v of ev.volunteers">
          {{ v.email }} - {{ v.status }}
          <button *ngIf="v.status === 'pending'" (click)="accept(ev.id, v.volunteerId)">Accept</button>
          <button *ngIf="v.status === 'pending'" (click)="reject(ev.id, v.volunteerId)">Reject</button>
          <button *ngIf="v.status === 'accepted'" (click)="complete(ev.id, v.volunteerId)">Completed</button>
        </p>
      </div>
    </div>
  </div>
  `
})
export class OrganizationDashboardComponent implements OnInit, OnDestroy {
  orgName = '';
  orgId = 0;
  title = '';
  skill = '';
  maxVol = '';
  image = '';
  orgEvents: EventItem[] = [];
  error = '';
  private refreshHandle: number | null = null;
  private lastEventsKey = '';
  private stream: EventSource | null = null;

  constructor(private api: ApiService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const raw = localStorage.getItem('currentOrg');
    if (!raw) {
      this.router.navigate(['/organization']);
      return;
    }

    let org: CurrentOrg | null = null;
    try {
      org = JSON.parse(raw) as CurrentOrg;
    } catch {
      org = null;
    }

    if (!org) {
      localStorage.removeItem('currentOrg');
      this.router.navigate(['/organization']);
      return;
    }

    this.orgName = org.name;
    this.orgId = org.id;
    this.refreshEvents();
    this.openStream();
  }

  openStream() {
    if (this.stream) {
      this.stream.close();
    }
    this.stream = new EventSource(`/api/events/stream?orgId=${this.orgId}`);
    this.stream.onmessage = event => {
      try {
        const data = JSON.parse(event.data || '[]') as EventItem[];
        const key = JSON.stringify(data);
        if (key !== this.lastEventsKey) {
          this.lastEventsKey = key;
          this.orgEvents = data;
          this.cdr.detectChanges();
        }
      } catch {
        // ignore
      }
    };
    this.stream.onerror = () => {
      this.stream?.close();
    };
    this.refreshHandle = window.setInterval(() => this.refreshEvents(), 5000);
  }

  refreshEvents() {
    this.api.getEventsByOrg(this.orgId).subscribe({
      next: events => {
        const key = JSON.stringify(events);
        if (key !== this.lastEventsKey) {
          this.lastEventsKey = key;
          this.orgEvents = events;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load events';
        this.cdr.detectChanges();
      }
    });
  }

  addEvent() {
    if (!this.title || !this.skill || !this.maxVol) {
      this.error = 'Please fill all fields';
      return;
    }

    this.error = '';
    this.api.createEvent({
      title: this.title,
      skill: this.skill,
      maxVol: Number(this.maxVol),
      image: this.image || null,
      orgId: this.orgId
    }).subscribe({
      next: event => {
        this.title = '';
        this.skill = '';
        this.maxVol = '';
        this.image = '';
        // Show immediately, then sync in background
        this.orgEvents = [event, ...this.orgEvents];
        this.cdr.detectChanges();
        setTimeout(() => this.refreshEvents(), 200);
      },
      error: err => {
        this.error = err?.error?.error || 'Failed to create event';
      }
    });
  }

  accept(eventId: number, volunteerId: number) {
    this.updateStatus(eventId, volunteerId, 'accepted');
  }

  reject(eventId: number, volunteerId: number) {
    this.updateStatus(eventId, volunteerId, 'rejected');
  }

  complete(eventId: number, volunteerId: number) {
    this.updateStatus(eventId, volunteerId, 'completed');
  }

  updateStatus(eventId: number, volunteerId: number, status: string) {
    this.api.updateVolunteerStatus(eventId, volunteerId, status).subscribe({
      next: () => {
        const event = this.orgEvents.find(ev => ev.id === eventId);
        if (event) {
          const vol = event.volunteers.find(v => v.volunteerId === volunteerId);
          if (vol) vol.status = status;
          if (status === 'completed') event.status = 'Completed';
        }
        this.cdr.detectChanges();
        setTimeout(() => this.refreshEvents(), 200);
      },
      error: () => {
        this.error = 'Failed to update status';
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('currentOrg');
    this.router.navigate(['/organization']);
  }

  ngOnDestroy() {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
    if (this.stream) {
      this.stream.close();
      this.stream = null;
    }
  }
}
