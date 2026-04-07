import { Routes } from '@angular/router';
import { VolunteerReactComponent } from './volunteer-react.component';
import { OrganizationLoginComponent } from './organization/organization-login.component';
import { OrganizationSignupComponent } from './organization/organization-signup.component';
import { OrganizationDashboardComponent } from './organization/organization-dashboard.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'volunteer', component: VolunteerReactComponent },
  { path: 'organization', component: OrganizationLoginComponent },
  { path: 'organization/signup', component: OrganizationSignupComponent },
  { path: 'organization/dashboard', component: OrganizationDashboardComponent },
  { path: '**', redirectTo: '' }
];
