import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  public authService = inject(AuthService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isSearchOpen = false;
  unreadCount = 0;

  // Valeurs réelles issues de l'URL
  searchCity = '';
  searchCheckIn = '';
  searchCheckOut = '';
  searchGuests = 0;

  // Variables de saisie temporaires (formulaire)
  searchCityTemp = '';
  checkInTemp = '';
  checkOutTemp = '';
  guestsTemp = 0;

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.messageService.getUnreadCount().subscribe({
        next: (res: any) => this.unreadCount = res.count || res || 0,
        error: () => {},
      });
    }

    this.route.queryParams.subscribe(params => {
      this.searchCity = params['search'] || '';
      this.searchCheckIn = params['checkIn'] || '';
      this.searchCheckOut = params['checkOut'] || '';
      this.searchGuests = params['guests'] ? parseInt(params['guests'], 10) : 0;

      // Synchroniser le formulaire avec l'URL
      this.searchCityTemp = this.searchCity;
      this.checkInTemp = this.searchCheckIn;
      this.checkOutTemp = this.searchCheckOut;
      this.guestsTemp = this.searchGuests;
    });
  }

  logout() {
    this.authService.logout();
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }

  closeSearch() {
    this.isSearchOpen = false;
  }

  selectPopularCity(city: string) {
    this.searchCityTemp = city;
  }

  search() {
    const queryParams: any = {};
    if (this.searchCityTemp) queryParams.search = this.searchCityTemp;
    if (this.checkInTemp) queryParams.checkIn = this.checkInTemp;
    if (this.checkOutTemp) queryParams.checkOut = this.checkOutTemp;
    if (this.guestsTemp > 0) queryParams.guests = this.guestsTemp;

    this.router.navigate(['/'], { queryParams });
    this.isSearchOpen = false;
  }

  formatDateRange(): string {
    if (!this.searchCheckIn && !this.searchCheckOut) {
      return "N'importe quand";
    }
    const checkInStr = this.searchCheckIn ? this.formatSingleDate(this.searchCheckIn) : '';
    const checkOutStr = this.searchCheckOut ? this.formatSingleDate(this.searchCheckOut) : '';
    if (checkInStr && checkOutStr) {
      return `${checkInStr} - ${checkOutStr}`;
    }
    return checkInStr || checkOutStr || "N'importe quand";
  }

  private formatSingleDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  }
}
