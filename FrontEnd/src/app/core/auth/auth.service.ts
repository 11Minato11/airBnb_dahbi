import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

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

  saveSession(accessToken: string, user?: any): void {
    this.setToken(accessToken);
    if (user) {
      this.setUser(user);
    }
  }

  setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  fetchProfile(): Observable<any> {
    return this.http.get(`${this.API}/profile`).pipe(
      tap((profile) => {
        const stored = this.getUser() || {};
        this.setUser({ ...stored, ...profile });
      })
    );
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
    const token = this.getToken();
    return !!token && token.split('.').length === 3;
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }
}
