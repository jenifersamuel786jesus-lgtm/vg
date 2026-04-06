import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-organization-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="center card">
    <h2>Organization Login</h2>
    <input [(ngModel)]="email" placeholder="Email" />
    <input [(ngModel)]="password" type="password" placeholder="Password" />
    <button (click)="login()">Login</button>
    <p class="link" [routerLink]="['/organization/signup']">New org? Register</p>
    <p *ngIf="error" style="color:crimson">{{ error }}</p>
  </div>
  `
})
export class OrganizationLoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private data: DataService, private router: Router) {}

  login() {
    const orgs = this.data.getOrgs();
    const org = orgs.find(o => o.email === this.email && o.password === this.password);
    if (!org) {
      this.error = 'Invalid login';
      return;
    }
    this.data.setCurrentOrgEmail(org.email);
    this.router.navigate(['/organization/dashboard']);
  }
}
