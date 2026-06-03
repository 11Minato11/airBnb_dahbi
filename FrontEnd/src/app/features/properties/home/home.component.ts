import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PropertyService, Property } from '../../../core/services/property.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../../core/services/user.service';

const CATEGORIES = [
  { icon: '🏰', label: 'Riads', keywords: ['Riad', 'riad', 'Palais', 'dar', 'Dar'] },
  { icon: '🌊', label: 'Bord de mer', keywords: ['mer', 'Mer', 'océan', 'Agadir', 'Essaouira', 'Tanger'] },
  { icon: '🏔️', label: 'Montagne', keywords: ['Atlas', 'Rif', 'montagne', 'Ourika', 'Chefchaouen'] },
  { icon: '🌴', label: 'Palmeraie', keywords: ['Palmeraie', 'palmeraie', 'bungalow', 'Bungalow'] },
  { icon: '✨', label: 'Design', keywords: ['Design', 'design', 'Moderne', 'moderne', 'Loft', 'loft'] },
  { icon: '🏜️', label: 'Désert', keywords: ['Désert', 'désert', 'Sahara', 'Ouarzazate'] },
  { icon: '🎨', label: 'Artistique', keywords: ['Artiste', 'artiste', 'Artistique', 'Bohème'] },
  { icon: '🌿', label: 'Nature', keywords: ['Éco', 'éco', 'Nature', 'Cabane', 'lodge'] },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  allProperties = signal<Property[]>([]);
  isLoading = signal(true);
  hasError = signal(false);
  activeCategory = signal<string | null>(null);
  searchQuery = signal<string | null>(null);
  checkInQuery = signal<string | null>(null);
  checkOutQuery = signal<string | null>(null);
  guestsQuery = signal<number>(0);
  favorites = signal<Set<string>>(new Set());
  categories = CATEGORIES;

  filteredProperties = computed(() => {
    let props = this.allProperties();

    const cat = this.activeCategory();
    if (!cat) return props;
    const catDef = CATEGORIES.find(c => c.label === cat);
    if (!catDef) return props;
    return props.filter(p =>
      catDef.keywords.some(kw =>
        p.title.includes(kw) ||
        (p.description?.includes(kw) ?? false) ||
        p.address.city.includes(kw) ||
        (p.amenities?.some(a => a.includes(kw)) ?? false)
      )
    );
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['search'] || null);
      this.checkInQuery.set(params['checkIn'] || null);
      this.checkOutQuery.set(params['checkOut'] || null);
      this.guestsQuery.set(params['guests'] ? parseInt(params['guests'], 10) : 0);

      this.isLoading.set(true);

      const apiParams: any = {};
      if (params['search']) apiParams.city = params['search'];
      if (params['checkIn']) apiParams.checkIn = params['checkIn'];
      if (params['checkOut']) apiParams.checkOut = params['checkOut'];
      if (params['guests']) apiParams.guests = params['guests'];

      this.propertyService.getProperties(apiParams).subscribe({
        next: (data) => {
          this.allProperties.set(data);
          this.isLoading.set(false);
          this.loadLikedProperties();
        },
        error: (err) => {
          console.error('Erreur chargement logements:', err);
          this.isLoading.set(false);
          this.hasError.set(true);
        }
      });
    });
  }

  toggleFavorite(event: Event, id: string) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.userService.toggleLike(id).subscribe({
      next: (result) => {
        const current = new Set(this.favorites());
        if (result.liked) {
          current.add(id);
        } else {
          current.delete(id);
        }
        this.favorites.set(current);
      },
      error: (err) => {
        if (err.status === 401) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        console.error('Erreur sauvegarde favori:', err);
      }
    });
  }

  isFavorite(id: string): boolean { return this.favorites().has(id); }

  setCategory(label: string | null) {
    this.activeCategory.set(this.activeCategory() === label ? null : label);
    if (label === null) {
      this.router.navigate(['/'], { queryParams: {} });
    }
  }

  goToProperty(id: string) {
    this.router.navigate(['/properties', id], {
      queryParams: {
        checkIn: this.checkInQuery(),
        checkOut: this.checkOutQuery(),
        guests: this.guestsQuery() || null
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-MA').format(price);
  }

  private loadLikedProperties() {
    if (!this.authService.isAuthenticated()) {
      this.favorites.set(new Set());
      return;
    }

    this.userService.getMyLikedPropertyIds().subscribe({
      next: (propertyIds) => {
        this.favorites.set(new Set(propertyIds));
      },
      error: () => {
        this.favorites.set(new Set());
      }
    });
  }

  get properties(): Property[] { return this.filteredProperties(); }
}
