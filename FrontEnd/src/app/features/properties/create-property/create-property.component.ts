import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';

@Component({
  selector: 'app-create-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-property.component.html'
})
export class CreatePropertyComponent {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  isLoading = false;
  errorMessage: string | null = null;

  propertyForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    pricePerNight: [null, [Validators.required, Validators.min(1)]],
    maxGuests: [null, [Validators.required, Validators.min(1)]],
    imageUrl: [''],
    city: ['', Validators.required],
    country: ['', Validators.required],
  });

  onSubmit() {
    if (this.propertyForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = null;

    const formValue = this.propertyForm.value;
    const payload = {
      title: formValue.title,
      description: formValue.description,
      pricePerNight: Number(formValue.pricePerNight),
      maxGuests: Number(formValue.maxGuests),
      imageUrl: formValue.imageUrl || undefined,
      address: {
        city: formValue.city,
        country: formValue.country,
      },
      // Coordonnées par défaut (centre du Maroc) — à améliorer avec une vraie carte
      location: {
        type: 'Point',
        coordinates: [-7.09, 31.79],
      },
    };

    this.propertyService.createProperty(payload).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: any) => {
        console.error('Create property error', err);
        this.errorMessage = 'Une erreur est survenue lors de la création de l\'annonce.';
        this.isLoading = false;
      }
    });
  }
}
