import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Property } from './property.service';
import { AuthService } from '../auth/auth.service';

export interface Reservation {
  _id: string;
  propertyId: Property;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface Review {
  _id: string;
  propertyId: any;
  rating: number;
  comment: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly BASE = 'http://localhost:3000';

  getMyListings(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.BASE}/properties/my-listings`);
  }

  deleteListing(id: string): Observable<any> {
    return this.http.delete(`${this.BASE}/properties/${id}`);
  }

  getMyTrips(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.BASE}/reservations/my-trips`);
  }

  getMyReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.BASE}/reviews/mine`);
  }

  createReservation(data: { propertyId: string; checkInDate: string; checkOutDate: string; totalPrice: number }): Observable<any> {
    return this.http.post(`${this.BASE}/reservations`, data, {
      headers: new HttpHeaders(this.authService.getAuthHeaders()),
    });
  }

  createReview(data: { propertyId: string; rating: number; comment: string }): Observable<any> {
    return this.http.post(`${this.BASE}/reviews`, data);
  }

  getReviewsForProperty(propertyId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.BASE}/reviews/property/${propertyId}`);
  }
}
