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
        this.authService.setToken(decodeURIComponent(token));
        this.authService.fetchProfile().subscribe({
          next: () => this.navigateAfterLogin(),
          error: () => {
            this.authService.clearToken();
            this.errorMessage = 'Session Google invalide. Veuillez réessayer.';
          }
        });
      }
    });
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.router.navigateByUrl(returnUrl);
  }

  onSubmit() {
    this.errorMessage = null;
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email!, password!).subscribe({
        next: (res: any) => {
          this.authService.saveSession(res.access_token, res.user);
          this.navigateAfterLogin();
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
