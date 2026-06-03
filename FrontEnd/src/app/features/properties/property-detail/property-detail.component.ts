import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService, Property } from '../../../core/services/property.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './property-detail.component.html'
})
export class PropertyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private userService = inject(UserService);
  public authService = inject(AuthService);

  readonly Math = Math;

  property = signal<Property | null>(null);
  isLoading = signal(true);
  hasError = signal(false);
  isFavorite = signal(false);

  checkInDate = '';
  checkOutDate = '';
  guests = 1;

  // Images secondaires fictives pour la galerie
  readonly extraImages = [
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.route.queryParams.subscribe(params => {
      this.checkInDate = params['checkIn'] || '';
      this.checkOutDate = params['checkOut'] || '';
      this.guests = params['guests'] ? parseInt(params['guests'], 10) : 1;
    });

    this.propertyService.getProperty(id).subscribe({
      next: (data) => {
        this.property.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement propriété:', err);
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    });
  }

  get galleryImages(): string[] {
    const main = this.property()?.imageUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80';
    return [main, ...this.extraImages];
  }

  toggleFavorite() {
    this.isFavorite.set(!this.isFavorite());
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-MA').format(price);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  get nights(): number {
    if (!this.checkInDate || !this.checkOutDate) return 0;
    const start = new Date(this.checkInDate);
    const end = new Date(this.checkOutDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  }

  get totalPrice(): number {
    const prop = this.property();
    if (!prop || this.nights <= 0) return 0;
    return Math.round(prop.pricePerNight * this.nights * 1.14);
  }

  contactHost() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const prop = this.property();
    if (!prop) return;
    this.router.navigate(['/messages'], {
      queryParams: { propertyId: prop._id, hostId: prop.hostId }
    });
  }

  reserve() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (!this.checkInDate || !this.checkOutDate) {
      alert('Veuillez sélectionner vos dates d\'arrivée et de départ.');
      return;
    }
    if (this.nights <= 0) {
      alert('La date de départ doit être postérieure à la date d\'arrivée.');
      return;
    }
    const prop = this.property();
    if (!prop) return;

    this.userService.createReservation({
      propertyId: prop._id,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      totalPrice: this.totalPrice,
    }).subscribe({
      next: () => {
        alert('Réservation confirmée !');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        if (err.status === 401) {
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        const msg = err.error?.message || 'Erreur lors de la réservation.';
        alert(msg);
      }
    });
  }
}
