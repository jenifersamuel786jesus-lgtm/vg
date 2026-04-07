import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

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

  constructor(private api: ApiService, private router: Router) {}

  login() {
    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();
    this.error = '';
    this.api.orgLogin({ email, password }).subscribe({
      next: org => {
        localStorage.removeItem('currentVolunteer');
        localStorage.setItem('currentOrg', JSON.stringify(org));
        this.router.navigate(['/organization/dashboard']);
      },
      error: err => {
        this.error = err?.error?.error || 'Invalid login';
      }
    });
  }
}
