import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/properties/home/home.component';
import { CreatePropertyComponent } from './features/properties/create-property/create-property.component';
import { PropertyDetailComponent } from './features/properties/property-detail/property-detail.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MessagesComponent } from './features/messages/messages.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'properties/:id', component: PropertyDetailComponent },
  { path: 'create-property', component: CreatePropertyComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'messages', component: MessagesComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
