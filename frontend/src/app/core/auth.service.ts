import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse, MeResponse } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'colegio_token';
  private readonly userKey = 'colegio_user';
  readonly currentUser = signal<AuthUser | null>(this.readUser());
  readonly isAdmin = computed(() => this.currentUser()?.rol === 'admin');
  readonly isAcudiente = computed(() => this.currentUser()?.rol === 'acudiente');

  constructor(private http: HttpClient, private router: Router) {}

  login(payload: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap((res) => this.persistUser({
        username: res.username,
        rol: res.rol,
        vistas: res.vistas || []
      }, res.token))
    );
  }

  refreshMe() {
    return this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => this.persistUser({
        username: res.username,
        rol: res.rol,
        vistas: res.vistas || []
      }))
    );
  }

  logout(): void {
    localStorage.removeItem(this.key);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  token(): string | null {
    return localStorage.getItem(this.key);
  }

  isLoggedIn(): boolean {
    return !!this.token();
  }

  canView(codigo: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.rol === 'admin') return true;
    return (user.vistas || []).includes(codigo);
  }

  canManage(): boolean {
    const rol = this.currentUser()?.rol;
    return rol === 'admin' || rol === 'profesor';
  }

  firstAllowedPath(): string {
    const user = this.currentUser();
    const vistas = user?.rol === 'admin'
      ? ['alumnos', 'profesores', 'cursos', 'materias', 'matriculas', 'pagos', 'usuarios', 'perfiles']
      : (user?.vistas || []);
    return vistas.length ? `/${vistas[0]}` : '/login';
  }

  private persistUser(user: AuthUser, token?: string): void {
    if (token) localStorage.setItem(this.key, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthUser;
      return {
        username: parsed.username,
        rol: parsed.rol,
        vistas: parsed.vistas || []
      };
    } catch {
      return null;
    }
  }
}
