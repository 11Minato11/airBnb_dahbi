import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PropertyService, Property } from '../../../core/services/property.service';

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
  private router = inject(Router);

  // ✅ allProperties EST un signal → computed() réagit correctement
  allProperties = signal<Property[]>([]);
  isLoading = signal(true);
  hasError = signal(false);
  activeCategory = signal<string | null>(null);
  favorites = signal<Set<string>>(new Set());
  categories = CATEGORIES;

  // Calcul réactif : se recalcule quand allProperties OU activeCategory change
  filteredProperties = computed(() => {
    const cat = this.activeCategory();
    const props = this.allProperties();
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
    this.propertyService.getProperties().subscribe({
      next: (data) => {
        this.allProperties.set(data);  // ✅ signal.set() → déclenche computed
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement logements:', err);
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    });
  }

  toggleFavorite(event: Event, id: string) {
    event.stopPropagation();
    event.preventDefault();
    const current = new Set(this.favorites());
    if (current.has(id)) { current.delete(id); } else { current.add(id); }
    this.favorites.set(current);
  }

  isFavorite(id: string): boolean { return this.favorites().has(id); }

  setCategory(label: string | null) {
    this.activeCategory.set(this.activeCategory() === label ? null : label);
  }

  goToProperty(id: string) { this.router.navigate(['/properties', id]); }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-MA').format(price);
  }

  get properties(): Property[] { return this.filteredProperties(); }
}
