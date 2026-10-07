import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="login-wrap">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Colegio AppCol</mat-card-title>
          <mat-card-subtitle>Iniciar sesión</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Usuario</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
            </mat-form-field>
            <button mat-flat-button color="primary" class="full" type="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Entrando...' : 'Entrar' }}
            </button>
          </form>
          <p class="hint">Admin: admin / Password123! · Acudiente: maria.martinez / Password123!</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem;
      background: linear-gradient(160deg, #0f2a44 0%, #1a5276 45%, #d4e6f1 100%); }
    mat-card { width: min(420px, 100%); padding: 0.5rem 0.25rem 1rem; }
    .full { width: 100%; display: block; margin-top: 0.5rem; }
    .hint { margin: 1rem 0 0; color: #666; font-size: 0.85rem; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  loading = false;

  form = this.fb.nonNullable.group({
    username: ['admin', Validators.required],
    password: ['Password123!', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.auth.firstAllowedPath());
      },
      error: () => {
        this.loading = false;
        this.snack.open('Usuario o contraseña inválidos', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
