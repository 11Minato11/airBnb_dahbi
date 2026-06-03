import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import type { Reservation, Review } from '../../core/services/user.service';
import type { Property } from '../../core/services/property.service';

type Tab = 'profile' | 'listings' | 'trips' | 'reviews';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  activeTab = signal<Tab>('profile');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any = null;

  listings: Property[] = [];
  trips: Reservation[] = [];
  reviews: Review[] = [];

  loadingListings = false;
  loadingTrips = false;
  loadingReviews = false;
  deleteSuccess = signal<string | null>(null);

  readonly tabDefs: { id: Tab; icon: string; label: string }[] = [
    { id: 'profile', icon: '👤', label: 'Mon profil' },
    { id: 'listings', icon: '🏠', label: 'Mes annonces' },
    { id: 'trips', icon: '✈️', label: 'Mes voyages' },
    { id: 'reviews', icon: '⭐', label: 'Mes avis' }
  ];

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = this.authService.getUser();
    this.loadListings();
    this.loadTrips();
    this.loadReviews();
  }

  setTab(tab: Tab) { this.activeTab.set(tab); }

  loadListings() {
    this.loadingListings = true;
    this.userService.getMyListings().subscribe({
      next: (data: Property[]) => { this.listings = data; this.loadingListings = false; },
      error: () => { this.loadingListings = false; }
    });
  }

  loadTrips() {
    this.loadingTrips = true;
    this.userService.getMyTrips().subscribe({
      next: (data: Reservation[]) => { this.trips = data; this.loadingTrips = false; },
      error: () => { this.loadingTrips = false; }
    });
  }

  loadReviews() {
    this.loadingReviews = true;
    this.userService.getMyReviews().subscribe({
      next: (data: Review[]) => { this.reviews = data; this.loadingReviews = false; },
      error: () => { this.loadingReviews = false; }
    });
  }

  goToProperty(id: string) {
    this.router.navigate(['/properties', id]);
  }

  deleteListing(id: string, title: string, event?: Event) {
    event?.stopPropagation();
    if (!confirm(`Supprimer "${title}" ?`)) return;
    this.userService.deleteListing(id).subscribe({
      next: () => {
        this.listings = this.listings.filter(l => l._id !== id);
        this.deleteSuccess.set('Annonce supprimée avec succès !');
        setTimeout(() => this.deleteSuccess.set(null), 3000);
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-MA').format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getStars(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) => i < rating ? 'full' : 'empty');
  }

  logout() { this.authService.logout(); }

  getUserInitials(): string {
    if (!this.user) return '?';
    const first = (this.user.firstName ?? this.user.email ?? '?')[0];
    const last = (this.user.lastName ?? '')[0] ?? '';
    return (first + last).toUpperCase();
  }
}
