import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-organization-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="center card">
    <h2>Organization Signup</h2>
    <input [(ngModel)]="name" placeholder="Name" />
    <input [(ngModel)]="email" placeholder="Email" />
    <input [(ngModel)]="password" type="password" placeholder="Password" />
    <button (click)="register()">Register</button>
    <p class="link" [routerLink]="['/organization']">Back to login</p>
    <p *ngIf="error" style="color:crimson">{{ error }}</p>
  </div>
  `
})
export class OrganizationSignupComponent {
  name = '';
  email = '';
  password = '';
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  register() {
    const name = this.name.trim();
    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();

    if (!name || !email || !password) {
      this.error = 'Please fill all fields';
      return;
    }

    this.error = '';
    this.api.orgSignup({ name, email, password }).subscribe({
      next: () => {
        this.router.navigate(['/organization']);
      },
      error: err => {
        this.error = err?.error?.error || 'Signup failed';
      }
    });
  }
}
