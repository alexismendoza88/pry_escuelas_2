import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BehaviorSubject, Observable, combineLatest, map, startWith } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { RolApp, UsuarioApp, Alumno } from '../../core/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    ReactiveFormsModule, AsyncPipe, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatTableModule, MatIconModule, MatSnackBarModule, MatCardModule, MatSlideToggleModule
  ],
  template: `
    <div class="page-grid">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ editingId ? 'Editar usuario' : 'Nuevo usuario' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="guardar()" class="page-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Usuario</mat-label>
              <input matInput formControlName="nombreDeUsuario" autocomplete="off" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ editingId ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Rol</mat-label>
              <mat-select formControlName="rol">
                @for (r of roles; track r.id) {
                  <mat-option [value]="r.codigo">{{ r.nombre }} ({{ r.vistasCount }} vistas)</mat-option>
                }
              </mat-select>
            </mat-form-field>
            @if (form.controls.rol.value === 'acudiente') {
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
                <mat-label>Hijos (alumnos a su cargo)</mat-label>
                <mat-select formControlName="idsHijos" multiple>
                  @for (a of alumnos; track a.id || a.idAlumnos) {
                    <mat-option [value]="idOf(a)">{{ a.nombre }} {{ a.apellido }} — {{ a.gradoActual || 's/g' }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
            <div class="page-actions span2">
              <mat-slide-toggle formControlName="activo" color="primary">Activo</mat-slide-toggle>
            </div>
            <div class="page-actions span2">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
              <button mat-stroked-button type="button" (click)="limpiar()">Limpiar</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Usuarios</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Buscar usuario</mat-label>
            <input matInput [formControl]="searchCtrl" />
          </mat-form-field>
          <table mat-table [dataSource]="(filtrados$ | async) || []" class="table">
            <ng-container matColumnDef="usuario">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let u">{{ u.nombreDeUsuario }}</td>
            </ng-container>
            <ng-container matColumnDef="rol">
              <th mat-header-cell *matHeaderCellDef>Rol</th>
              <td mat-cell *matCellDef="let u">{{ nombreRol(u.rol) }}</td>
            </ng-container>
            <ng-container matColumnDef="hijos">
              <th mat-header-cell *matHeaderCellDef>Hijos</th>
              <td mat-cell *matCellDef="let u">{{ nombresHijos(u) }}</td>
            </ng-container>
            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let u">{{ u.activo ? 'Activo' : 'Inactivo' }}</td>
            </ng-container>
            <ng-container matColumnDef="acc">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                <div class="table-actions">
                  <button mat-icon-button type="button" (click)="editar(u)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button type="button" color="warn" (click)="eliminar(u)"><mat-icon>delete</mat-icon></button>
                </div>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .search, .table { width: 100%; }
    .search { margin-top: 0.75rem; }
  `]
})
export class UsuariosComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  cols = ['usuario', 'rol', 'hijos', 'activo', 'acc'];
  editingId: number | null = null;
  roles: RolApp[] = [];
  alumnos: Alumno[] = [];
  private data$ = new BehaviorSubject<UsuarioApp[]>([]);
  searchCtrl = this.fb.nonNullable.control('');
  filtrados$!: Observable<UsuarioApp[]>;

  form = this.fb.nonNullable.group({
    nombreDeUsuario: ['', Validators.required],
    password: [''],
    rol: ['', Validators.required],
    idsHijos: [[] as number[]],
    activo: [true]
  });

  ngOnInit(): void {
    this.filtrados$ = combineLatest([
      this.data$,
      this.searchCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(map(([items, q]) => {
      const t = q.toLowerCase().trim();
      if (!t) return items;
      return items.filter((u) => `${u.nombreDeUsuario} ${u.rol}`.toLowerCase().includes(t));
    }));
    this.cargar();
  }

  nombreRol(codigo: string): string {
    return this.roles.find((r) => r.codigo === codigo)?.nombre || codigo;
  }

  idOf(a: Alumno): number {
    return a.idAlumnos || a.id || 0;
  }

  nombresHijos(u: UsuarioApp): string {
    if (u.rol !== 'acudiente') return '—';
    const ids = u.idsHijos || [];
    if (!ids.length) return 'Sin hijos asignados';
    return ids
      .map((id) => this.alumnos.find((a) => this.idOf(a) === id))
      .filter((a): a is Alumno => !!a)
      .map((a) => `${a.nombre} ${a.apellido}`)
      .join(', ') || `${ids.length} asignado(s)`;
  }

  cargar(): void {
    this.api.getRoles().subscribe({
      next: (roles) => this.roles = roles.filter((r) => r.activo || this.editingId),
      error: () => this.snack.open('No se pudieron cargar los roles', 'Cerrar', { duration: 3000 })
    });
    this.api.getAlumnos().subscribe({ next: (data) => this.alumnos = data });
    this.api.getUsuarios().subscribe({
      next: (data) => this.data$.next(data),
      error: () => this.snack.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 })
    });
  }

  editar(u: UsuarioApp): void {
    this.editingId = u.id;
    this.form.patchValue({
      nombreDeUsuario: u.nombreDeUsuario,
      password: '',
      rol: u.rol,
      idsHijos: u.idsHijos || [],
      activo: u.activo
    });
  }

  limpiar(): void {
    this.editingId = null;
    this.form.reset({ nombreDeUsuario: '', password: '', rol: '', idsHijos: [], activo: true });
    this.searchCtrl.setValue('');
  }

  guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (!this.editingId && !v.password) {
      this.snack.open('La contraseña es obligatoria para un usuario nuevo', 'Cerrar', { duration: 3000 });
      return;
    }
    const body = {
      nombreDeUsuario: v.nombreDeUsuario.trim(),
      password: v.password,
      rol: v.rol,
      activo: v.activo,
      idsHijos: v.rol === 'acudiente' ? v.idsHijos : []
    };
    const req$ = this.editingId
      ? this.api.updateUsuario(this.editingId, body)
      : this.api.createUsuario(body);

    req$.subscribe({
      next: () => {
        this.snack.open('Usuario guardado', 'OK', { duration: 2500 });
        this.limpiar();
        this.cargar();
      },
      error: (err) => this.snack.open(err?.error?.message || 'No se pudo guardar', 'Cerrar', { duration: 3500 })
    });
  }

  eliminar(u: UsuarioApp): void {
    if (!confirm(`¿Eliminar al usuario ${u.nombreDeUsuario}?`)) return;
    this.api.deleteUsuario(u.id).subscribe({
      next: () => {
        this.snack.open('Eliminado', 'OK', { duration: 2000 });
        this.cargar();
      },
      error: (err) => this.snack.open(err?.error?.message || 'No se pudo eliminar', 'Cerrar', { duration: 3500 })
    });
  }
}
