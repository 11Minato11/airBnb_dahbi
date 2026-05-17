import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Property {
  _id: string;
  title: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  address: {
    city: string;
    country: string;
  };
  amenities: string[];
  isActive: boolean;
  imageUrl?: string;
  rating?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/properties';

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl);
  }

  getProperty(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }

  createProperty(propertyData: any): Observable<any> {
    return this.http.post(this.apiUrl, propertyData);
  }
}
