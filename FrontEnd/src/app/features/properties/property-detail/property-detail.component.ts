import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService, Property } from '../../../core/services/property.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-detail.component.html'
})
export class PropertyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  public authService = inject(AuthService);

  readonly Math = Math;

  property: Property | null = null;
  isLoading = true;
  hasError = false;
  isFavorite = signal(false);

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

    this.propertyService.getProperty(id).subscribe({
      next: (data) => {
        this.property = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement propriété:', err);
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  get galleryImages(): string[] {
    const main = this.property?.imageUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80';
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

  reserve() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else {
      alert('🎉 Réservation disponible prochainement !');
    }
  }
}
