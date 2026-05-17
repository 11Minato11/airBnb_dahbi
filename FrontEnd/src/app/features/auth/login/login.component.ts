import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  errorMessage: string | null = null;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.setToken(token);
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit() {
    this.errorMessage = null;
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email!, password!).subscribe({
        next: (res: any) => {
          this.authService.setToken(res.access_token);
          this.router.navigate(['/']);
        },
        error: (err: any) => {
          console.error('Login error', err);
          if (err.status === 401) {
            this.errorMessage = 'Identifiants invalides. Veuillez réessayer.';
          } else {
            this.errorMessage = 'Une erreur est survenue lors de la connexion.';
          }
        }
      });
    }
  }

  googleLogin() {
    window.location.href = 'http://localhost:3000/auth/google';
  }
}
