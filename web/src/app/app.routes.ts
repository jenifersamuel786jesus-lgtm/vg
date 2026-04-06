import { Routes } from '@angular/router';
import { VolunteerReactComponent } from './volunteer-react.component';
import { OrganizationLoginComponent } from './organization/organization-login.component';
import { OrganizationSignupComponent } from './organization/organization-signup.component';
import { OrganizationDashboardComponent } from './organization/organization-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'volunteer', pathMatch: 'full' },
  { path: 'volunteer', component: VolunteerReactComponent },
  { path: 'organization', component: OrganizationLoginComponent },
  { path: 'organization/signup', component: OrganizationSignupComponent },
  { path: 'organization/dashboard', component: OrganizationDashboardComponent },
  { path: '**', redirectTo: 'volunteer' }
];
