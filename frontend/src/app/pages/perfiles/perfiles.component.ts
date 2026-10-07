import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BehaviorSubject, Observable, combineLatest, map, startWith } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { RolApp, VistaApp } from '../../core/models';

@Component({
  selector: 'app-perfiles',
  standalone: true,
  imports: [
    ReactiveFormsModule, AsyncPipe, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatTableModule, MatIconModule, MatSnackBarModule,
    MatCardModule, MatCheckboxModule, MatSlideToggleModule
  ],
  template: `
    <div class="page-grid">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ editingId ? 'Editar perfil' : 'Nuevo perfil' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="guardar()" class="page-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Código</mat-label>
              <input matInput formControlName="codigo" placeholder="secretaria" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
              <mat-label>Descripción</mat-label>
              <input matInput formControlName="descripcion" />
            </mat-form-field>
            <div class="page-actions span2">
              <mat-slide-toggle formControlName="activo" color="primary">Activo</mat-slide-toggle>
            </div>
            <div class="vistas span2">
              <div class="vistas-head">
                <strong>Vistas que puede ver</strong>
                <span class="count">{{ seleccionadas.size }} / {{ vistas.length }}</span>
              </div>
              <p class="hint">Marque las pantallas visibles para este perfil. Las de administración solo aplican al rol admin.</p>
              @for (v of vistas; track v.codigo) {
                <mat-checkbox
                  [checked]="seleccionadas.has(v.codigo)"
                  [disabled]="checkboxDisabled(v)"
                  (change)="toggleVista(v, $event.checked)">
                  {{ v.nombre }}
                  @if (v.soloAdmin) {
                    <span class="tag">solo admin</span>
                  }
                </mat-checkbox>
              }
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
          <mat-card-title>Perfiles</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Buscar perfil</mat-label>
            <input matInput [formControl]="searchCtrl" />
          </mat-form-field>
          <table mat-table [dataSource]="(filtrados$ | async) || []" class="table">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Perfil</th>
              <td mat-cell *matCellDef="let r">
                <div>{{ r.nombre }}</div>
                <small>{{ r.codigo }}</small>
              </td>
            </ng-container>
            <ng-container matColumnDef="vistas">
              <th mat-header-cell *matHeaderCellDef>Vistas</th>
              <td mat-cell *matCellDef="let r">{{ r.vistasCount }} / {{ vistas.length }}</td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let r">{{ r.activo ? 'Activo' : 'Inactivo' }}</td>
            </ng-container>
            <ng-container matColumnDef="acc">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <div class="table-actions">
                  <button mat-icon-button type="button" (click)="editar(r)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button type="button" color="warn" [disabled]="r.esSistema" (click)="eliminar(r)"><mat-icon>delete</mat-icon></button>
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
    .vistas {
      display: grid;
      gap: 0.35rem;
      padding: 0.75rem 0;
    }
    .vistas mat-checkbox { display: flex; }
    .vistas-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .count { font-weight: 600; color: #1a5276; }
    .hint { margin: 0 0 0.35rem; color: #667; font-size: 0.85rem; }
    .tag {
      margin-left: 0.4rem;
      font-size: 0.7rem;
      color: #888;
    }
    small { color: #777; }
  `]
})
export class PerfilesComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  cols = ['nombre', 'vistas', 'estado', 'acc'];
  editingId: number | null = null;
  esSistema = false;
  codigoActual = '';
  vistas: VistaApp[] = [];
  seleccionadas = new Set<string>();
  private data$ = new BehaviorSubject<RolApp[]>([]);
  searchCtrl = this.fb.nonNullable.control('');
  filtrados$!: Observable<RolApp[]>;

  form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    descripcion: [''],
    activo: [true]
  });

  ngOnInit(): void {
    this.filtrados$ = combineLatest([
      this.data$,
      this.searchCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(map(([items, q]) => {
      const t = q.toLowerCase().trim();
      if (!t) return items;
      return items.filter((r) => `${r.nombre} ${r.codigo}`.toLowerCase().includes(t));
    }));
    this.cargar();
  }

  checkboxDisabled(v: VistaApp): boolean {
    if (this.codigoActual === 'admin') return true;
    return v.soloAdmin;
  }

  toggleVista(v: VistaApp, checked: boolean): void {
    if (this.checkboxDisabled(v)) return;
    const next = new Set(this.seleccionadas);
    if (checked) next.add(v.codigo);
    else next.delete(v.codigo);
    this.seleccionadas = next;
  }

  cargar(): void {
    this.api.getVistas().subscribe({
      next: (vistas) => this.vistas = vistas,
      error: () => this.snack.open('No se pudieron cargar las vistas', 'Cerrar', { duration: 3000 })
    });
    this.api.getRoles().subscribe({
      next: (data) => this.data$.next(data),
      error: () => this.snack.open('Error al cargar perfiles', 'Cerrar', { duration: 3000 })
    });
  }

  editar(r: RolApp): void {
    this.editingId = r.id;
    this.esSistema = r.esSistema;
    this.codigoActual = r.codigo;
    this.form.patchValue({
      codigo: r.codigo,
      nombre: r.nombre,
      descripcion: r.descripcion || '',
      activo: r.activo
    });
    this.form.controls.codigo.disable();
    this.seleccionadas = new Set(r.vistas || []);
  }

  limpiar(): void {
    this.editingId = null;
    this.esSistema = false;
    this.codigoActual = '';
    this.form.controls.codigo.enable();
    this.form.reset({ codigo: '', nombre: '', descripcion: '', activo: true });
    this.seleccionadas = new Set();
    this.searchCtrl.setValue('');
  }

  guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const vistas = [...this.seleccionadas];
    const req$ = this.editingId
      ? this.api.updateRol(this.editingId, {
          nombre: v.nombre.trim(),
          descripcion: v.descripcion.trim() || null,
          activo: v.activo,
          vistas
        })
      : this.api.createRol({
          codigo: v.codigo.trim(),
          nombre: v.nombre.trim(),
          descripcion: v.descripcion.trim() || null,
          activo: v.activo,
          vistas
        });

    req$.subscribe({
      next: () => {
        this.snack.open('Perfil guardado', 'OK', { duration: 2500 });
        this.limpiar();
        this.cargar();
      },
      error: (err) => this.snack.open(err?.error?.message || 'No se pudo guardar', 'Cerrar', { duration: 3500 })
    });
  }

  eliminar(r: RolApp): void {
    if (r.esSistema) return;
    if (!confirm(`¿Eliminar el perfil ${r.nombre}?`)) return;
    this.api.deleteRol(r.id).subscribe({
      next: () => {
        this.snack.open('Eliminado', 'OK', { duration: 2000 });
        this.cargar();
      },
      error: (err) => this.snack.open(err?.error?.message || 'No se pudo eliminar', 'Cerrar', { duration: 3500 })
    });
  }
}
