import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../services/data.service';

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

  constructor(private data: DataService, private router: Router) {}

  register() {
    if (!this.name || !this.email || !this.password) {
      this.error = 'Please fill all fields';
      return;
    }
    const orgs = this.data.getOrgs();
    if (orgs.some(o => o.email === this.email)) {
      this.error = 'Email already registered';
      return;
    }
    orgs.push({ name: this.name, email: this.email, password: this.password });
    this.data.setOrgs(orgs);
    this.router.navigate(['/organization']);
  }
}
