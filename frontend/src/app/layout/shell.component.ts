import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatSidenavModule, MatListModule, MatButtonModule],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav mode="side" opened class="side">
        <div class="brand">Colegio AppCol</div>
        <mat-nav-list>
          @for (item of menu(); track item.codigo) {
            <a mat-list-item [routerLink]="item.ruta" routerLinkActive="active">
              <span matListItemTitle>{{ item.nombre }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>Gestión escolar</span>
          <span class="spacer"></span>
          <span class="user">{{ auth.currentUser()?.username }} ({{ auth.currentUser()?.rol }})</span>
          <button mat-button type="button" (click)="auth.logout()">Salir</button>
        </mat-toolbar>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell { height: 100vh; }
    .side {
      width: 250px;
      background: #0f2a44;
      color: #fff;
    }
    .brand {
      padding: 1.25rem 1rem;
      font-weight: 700;
      font-size: 1.1rem;
      border-bottom: 1px solid rgba(255,255,255,.12);
    }
    :host ::ng-deep .side .mat-mdc-list-base {
      padding-top: 0.5rem;
    }
    :host ::ng-deep .side .mat-mdc-list-item {
      color: #eaf2f8 !important;
      margin: 0.15rem 0.5rem;
      border-radius: 8px;
      --mdc-list-list-item-label-text-color: #eaf2f8;
      --mdc-list-list-item-focus-label-text-color: #fff;
      --mdc-list-list-item-hover-label-text-color: #fff;
    }
    :host ::ng-deep .side .mat-mdc-list-item.active {
      background: rgba(255,255,255,.14) !important;
    }
    .spacer { flex: 1; }
    .user { margin-right: 0.75rem; font-size: 0.9rem; }
    .content {
      padding: 1.25rem;
      background: #f4f7fa;
      min-height: calc(100vh - 64px);
      box-sizing: border-box;
    }
  `]
})
export class ShellComponent implements OnInit {
  auth = inject(AuthService);

  private readonly catalogo = [
    { codigo: 'alumnos', nombre: 'Alumnos', ruta: '/alumnos' },
    { codigo: 'profesores', nombre: 'Profesores', ruta: '/profesores' },
    { codigo: 'cursos', nombre: 'Cursos', ruta: '/cursos' },
    { codigo: 'materias', nombre: 'Materias', ruta: '/materias' },
    { codigo: 'matriculas', nombre: 'Matrículas', ruta: '/matriculas' },
    { codigo: 'pagos', nombre: 'Pagos', ruta: '/pagos' },
    { codigo: 'usuarios', nombre: 'Usuarios', ruta: '/usuarios' },
    { codigo: 'perfiles', nombre: 'Perfiles', ruta: '/perfiles' }
  ];

  menu = computed(() => this.catalogo
    .filter((item) => this.auth.canView(item.codigo))
    .map((item) => item.codigo === 'alumnos' && this.auth.isAcudiente()
      ? { ...item, nombre: 'Mis hijos' }
      : item));

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.refreshMe().subscribe({ error: () => undefined });
    }
  }
}
