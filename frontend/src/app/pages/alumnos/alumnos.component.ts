import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { Observable, map, startWith, combineLatest, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Alumno } from '../../core/models';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [
    ReactiveFormsModule, AsyncPipe, MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatButtonModule, MatTableModule, MatIconModule, MatSnackBarModule, MatCardModule
  ],
  template: `
    <div class="page-grid">
      @if (auth.canManage()) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ editingId ? 'Editar alumno' : 'Nuevo alumno' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="guardar()" class="page-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Apellido</mat-label>
              <input matInput formControlName="apellido" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="telefono" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Grado actual</mat-label>
              <input matInput formControlName="gradoActual" [matAutocomplete]="autoGrado" />
              <mat-autocomplete #autoGrado="matAutocomplete">
                @for (g of gradosFiltrados$ | async; track g) {
                  <mat-option [value]="g">{{ g }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Acudiente</mat-label>
              <input matInput formControlName="nombreAcudiente" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Tel. acudiente</mat-label>
              <input matInput formControlName="telefonoAcudiente" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Año</mat-label>
              <input matInput formControlName="anoActual" />
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
              <mat-label>Dirección</mat-label>
              <input matInput formControlName="direccion" />
            </mat-form-field>
            <div class="page-actions span2">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
              <button mat-stroked-button type="button" (click)="limpiar()">Limpiar</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      }

      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ auth.isAcudiente() ? 'Mis hijos' : 'Alumnos' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Buscar alumno</mat-label>
            <input matInput [formControl]="searchCtrl" [matAutocomplete]="autoAlumno" placeholder="Nombre o apellido" />
            <mat-autocomplete #autoAlumno="matAutocomplete" [displayWith]="displayAlumno" (optionSelected)="seleccionar($event.option.value)">
              @for (a of alumnosFiltrados$ | async; track a.id || a.idAlumnos) {
                <mat-option [value]="a">{{ a.nombre }} {{ a.apellido }} — {{ a.gradoActual || 's/g' }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          <table mat-table [dataSource]="(filtradosTabla$ | async) || []" class="table">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let a">{{ a.nombre }} {{ a.apellido }}</td>
            </ng-container>
            <ng-container matColumnDef="grado">
              <th mat-header-cell *matHeaderCellDef>Grado</th>
              <td mat-cell *matCellDef="let a">{{ a.gradoActual }}</td>
            </ng-container>
            <ng-container matColumnDef="telefono">
              <th mat-header-cell *matHeaderCellDef>Teléfono</th>
              <td mat-cell *matCellDef="let a">{{ a.telefono }}</td>
            </ng-container>
            <ng-container matColumnDef="acudiente">
              <th mat-header-cell *matHeaderCellDef>Acudiente</th>
              <td mat-cell *matCellDef="let a">{{ a.nombreAcudiente }}</td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let a">
                @if (auth.canManage()) {
                  <div class="table-actions"><button mat-icon-button type="button" (click)="editar(a)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" color="warn" (click)="eliminar(a)"><mat-icon>delete</mat-icon></button></div>
                }
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
    .grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
    @media (min-width: 1100px) { .grid { grid-template-columns: 1fr 1.2fr; } }
    .form { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem; margin-top: 0.75rem; }
    .span2 { grid-column: span 2; }
    .actions { display: flex; gap: 0.75rem; }
    .search { width: 100%; margin-top: 0.75rem; }
    .table { width: 100%; }
  `]
})
export class AlumnosComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);

  cols = this.auth.canManage()
    ? ['nombre', 'grado', 'telefono', 'acudiente', 'acciones']
    : ['nombre', 'grado', 'telefono', 'acudiente'];
  editingId: number | null = null;
  private alumnos$ = new BehaviorSubject<Alumno[]>([]);
  searchCtrl = this.fb.nonNullable.control('');

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    telefono: [''],
    gradoActual: [''],
    nombreAcudiente: [''],
    telefonoAcudiente: [''],
    anoActual: ['2026'],
    direccion: ['']
  });

  grados = ['5A', '6A', '7B', '8A'];
  gradosFiltrados$ = this.form.controls.gradoActual.valueChanges.pipe(
    startWith(''),
    map((v) => this.grados.filter((g) => g.toLowerCase().includes((v || '').toLowerCase())))
  );

  alumnosFiltrados$!: Observable<Alumno[]>;
  filtradosTabla$!: Observable<Alumno[]>;

  ngOnInit(): void {
    this.cargar();
    this.alumnosFiltrados$ = combineLatest([
      this.alumnos$,
      this.searchCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(map(([items, q]) => this.filtrar(items, String(q))));
    this.filtradosTabla$ = this.alumnosFiltrados$;
  }

  displayAlumno = (a: Alumno | string) =>
    typeof a === 'string' ? a : a ? `${a.nombre} ${a.apellido}` : '';

  cargar(): void {
    this.api.getAlumnos().subscribe({
      next: (data) => this.alumnos$.next(data),
      error: () => this.snack.open('Error al cargar alumnos (¿API/login?)', 'Cerrar', { duration: 3500 })
    });
  }

  filtrar(items: Alumno[], q: string): Alumno[] {
    const t = q.toLowerCase().trim();
    if (!t) return items;
    return items.filter((a) =>
      `${a.nombre} ${a.apellido} ${a.gradoActual || ''}`.toLowerCase().includes(t)
    );
  }

  idOf(a: Alumno): number {
    return a.idAlumnos || (a as any).id;
  }

  seleccionar(a: Alumno): void {
    this.editar(a);
  }

  editar(a: Alumno): void {
    this.editingId = this.idOf(a);
    this.form.patchValue({
      nombre: a.nombre,
      apellido: a.apellido,
      telefono: a.telefono || '',
      gradoActual: a.gradoActual || '',
      nombreAcudiente: a.nombreAcudiente || '',
      telefonoAcudiente: a.telefonoAcudiente || '',
      anoActual: a.anoActual || '2026',
      direccion: a.direccion || ''
    });
  }

  limpiar(): void {
    this.editingId = null;
    this.form.reset({ nombre: '', apellido: '', telefono: '', gradoActual: '', nombreAcudiente: '', telefonoAcudiente: '', anoActual: '2026', direccion: '' });
    this.searchCtrl.setValue('');
  }

  guardar(): void {
    if (this.form.invalid) return;
    const body = this.form.getRawValue();
    const req$ = this.editingId
      ? this.api.updateAlumno(this.editingId, body)
      : this.api.createAlumno(body);

    req$.subscribe({
      next: () => {
        this.snack.open('Alumno guardado', 'OK', { duration: 2500 });
        this.limpiar();
        this.cargar();
      },
      error: () => this.snack.open('No se pudo guardar', 'Cerrar', { duration: 3000 })
    });
  }

  eliminar(a: Alumno): void {
    const id = this.idOf(a);
    if (!confirm(`¿Eliminar a ${a.nombre} ${a.apellido}?`)) return;
    this.api.deleteAlumno(id).subscribe({
      next: () => {
        this.snack.open('Eliminado', 'OK', { duration: 2000 });
        this.cargar();
      },
      error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
    });
  }
}
