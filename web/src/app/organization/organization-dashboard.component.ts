import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService, EventItem, Volunteer } from '../services/data.service';

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
      </div>

      <h2>Manage Events</h2>
      <div class="card" *ngFor="let ev of orgEvents; let i = index">
        <h3>{{ ev.title }}</h3>
        <div *ngIf="ev.volunteers.length === 0">No volunteers yet</div>
        <p *ngFor="let v of ev.volunteers; let vi = index">
          {{ v.email }} - {{ v.status }}
          <button *ngIf="v.status === 'pending'" (click)="accept(i, vi)">Accept</button>
          <button *ngIf="v.status === 'pending'" (click)="reject(i, vi)">Reject</button>
          <button *ngIf="v.status === 'accepted'" (click)="complete(i, vi)">Completed</button>
        </p>
      </div>
    </div>
  </div>
  `
})
export class OrganizationDashboardComponent implements OnInit {
  orgName = '';
  title = '';
  skill = '';
  maxVol = '';
  image = '';
  orgEvents: EventItem[] = [];

  constructor(private data: DataService, private router: Router) {}

  ngOnInit() {
    const email = this.data.getCurrentOrgEmail();
    if (!email) {
      this.router.navigate(['/organization']);
      return;
    }
    const org = this.data.getOrgs().find(o => o.email === email);
    if (!org) {
      this.data.clearCurrentOrg();
      this.router.navigate(['/organization']);
      return;
    }
    this.orgName = org.name;
    this.refreshEvents();
  }

  refreshEvents() {
    this.orgEvents = this.data.getEvents().filter(e => e.orgName === this.orgName);
  }

  addEvent() {
    const events = this.data.getEvents();
    events.push({
      title: this.title,
      skill: this.skill,
      maxVol: Number(this.maxVol),
      image: this.image || 'https://via.placeholder.com/80',
      orgName: this.orgName,
      status: 'Open',
      volunteers: []
    });
    this.data.setEvents(events);
    this.title = '';
    this.skill = '';
    this.maxVol = '';
    this.image = '';
    this.refreshEvents();
  }

  accept(i: number, vi: number) {
    const events = this.data.getEvents();
    const target = events.filter(e => e.orgName === this.orgName)[i];
    target.volunteers[vi].status = 'accepted';
    this.data.setEvents(events);
    this.refreshEvents();
  }

  reject(i: number, vi: number) {
    const events = this.data.getEvents();
    const target = events.filter(e => e.orgName === this.orgName)[i];
    target.volunteers[vi].status = 'rejected';
    this.data.setEvents(events);
    this.refreshEvents();
  }

  complete(i: number, vi: number) {
    const events = this.data.getEvents();
    const target = events.filter(e => e.orgName === this.orgName)[i];
    target.volunteers[vi].status = 'completed';
    target.status = 'Completed';

    const volunteers = this.data.getVolunteers();
    const vol = volunteers.find(v => v.email === target.volunteers[vi].email);
    if (vol && !vol.badges.includes(target.skill)) {
      vol.badges.push(target.skill);
      this.data.setVolunteers(volunteers);
    }

    this.data.setEvents(events);
    this.refreshEvents();
  }

  logout() {
    this.data.clearCurrentOrg();
    this.router.navigate(['/organization']);
  }
}
