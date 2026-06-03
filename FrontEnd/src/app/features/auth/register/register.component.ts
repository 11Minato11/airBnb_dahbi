import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage: string | null = null;

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    isHost: [false]
  });

  onSubmit() {
    this.errorMessage = null;
    if (this.registerForm.valid) {
      const v = this.registerForm.value;
      this.authService.register({
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        password: v.password!
      }).subscribe({
        next: () => {
          this.authService.login(v.email!, v.password!).subscribe({
            next: (res: any) => {
              this.authService.saveSession(res.access_token, res.user);
              this.router.navigate(['/']);
            },
            error: () => this.router.navigate(['/login']),
          });
        },
        error: (err: any) => {
          console.error('Registration error', err);
          if (err.status === 409) {
            this.errorMessage = 'Un utilisateur avec cette adresse email existe déjà.';
          } else {
            this.errorMessage = 'Une erreur est survenue lors de l\'inscription.';
          }
        }
      });
    }
  }

  googleLogin() {
    window.location.href = 'http://localhost:3000/auth/google';
  }
}
