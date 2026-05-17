import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API = 'http://localhost:3000/auth';
  private readonly TOKEN_KEY = 'airbemi_token';
  private readonly USER_KEY = 'airbemi_user';

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API}/login`, { email, password });
  }

  register(data: { firstName: string; lastName: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.API}/register`, data);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getUser(): any {
    const u = localStorage.getItem(this.USER_KEY);
    if (!u) return null;
    try { return JSON.parse(u); } catch { return null; }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }
}
