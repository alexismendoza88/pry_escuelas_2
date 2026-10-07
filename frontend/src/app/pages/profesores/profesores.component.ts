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
import { BehaviorSubject, Observable, combineLatest, map, startWith } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Profesor } from '../../core/models';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [
    ReactiveFormsModule, AsyncPipe, MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatButtonModule, MatTableModule, MatIconModule, MatSnackBarModule, MatCardModule
  ],
  template: `
    <div class="page-grid">
      <mat-card>
        <mat-card-header><mat-card-title>{{ editingId ? 'Editar profesor' : 'Nuevo profesor' }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="guardar()" class="page-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Nombre</mat-label><input matInput formControlName="nombre" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Apellido</mat-label><input matInput formControlName="apellido" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Correo</mat-label><input matInput formControlName="correo" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Teléfono</mat-label><input matInput formControlName="telefono" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
              <mat-label>Especialidad</mat-label>
              <input matInput formControlName="especialidad" [matAutocomplete]="autoEsp" />
              <mat-autocomplete #autoEsp="matAutocomplete">
                @for (e of especialidadesFiltradas$ | async; track e) {
                  <mat-option [value]="e">{{ e }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <div class="page-actions span2">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
              <button mat-stroked-button type="button" (click)="limpiar()">Limpiar</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Profesores</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Buscar profesor</mat-label>
            <input matInput [formControl]="searchCtrl" [matAutocomplete]="auto" />
            <mat-autocomplete #auto="matAutocomplete" [displayWith]="display" (optionSelected)="editar($event.option.value)">
              @for (p of filtrados$ | async; track p.idProfesores) {
                <mat-option [value]="p">{{ p.nombre }} {{ p.apellido }} — {{ p.especialidad }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
          <table mat-table [dataSource]="(filtrados$ | async) || []" class="table">
            <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th><td mat-cell *matCellDef="let p">{{ p.nombre }} {{ p.apellido }}</td></ng-container>
            <ng-container matColumnDef="correo"><th mat-header-cell *matHeaderCellDef>Correo</th><td mat-cell *matCellDef="let p">{{ p.correo }}</td></ng-container>
            <ng-container matColumnDef="esp"><th mat-header-cell *matHeaderCellDef>Especialidad</th><td mat-cell *matCellDef="let p">{{ p.especialidad }}</td></ng-container>
            <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p"><div class="table-actions"><button mat-icon-button type="button" (click)="editar(p)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" color="warn" (click)="eliminar(p)"><mat-icon>delete</mat-icon></button></div></td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .grid { display: grid; gap: 1rem; }
    @media (min-width: 1100px) { .grid { grid-template-columns: 1fr 1.2fr; } }
    .form { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem 1rem; margin-top: .75rem; }
    .span2 { grid-column: span 2; } .actions { display: flex; gap: .75rem; }
    .search, .table { width: 100%; }
  `]
})
export class ProfesoresComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  cols = ['nombre', 'correo', 'esp', 'acc'];
  editingId: number | null = null;
  private data$ = new BehaviorSubject<Profesor[]>([]);
  searchCtrl = this.fb.nonNullable.control('');
  especialidades = ['Matemáticas', 'Lengua', 'Ciencias', 'Inglés', 'Educación Física', 'Artística'];

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    telefono: [''],
    especialidad: ['']
  });

  especialidadesFiltradas$ = this.form.controls.especialidad.valueChanges.pipe(
    startWith(''),
    map((v) => this.especialidades.filter((e) => e.toLowerCase().includes((v || '').toLowerCase())))
  );
  filtrados$!: Observable<Profesor[]>;

  ngOnInit(): void {
    this.cargar();
    this.filtrados$ = combineLatest([this.data$, this.searchCtrl.valueChanges.pipe(startWith(''))]).pipe(
      map(([items, q]) => {
        const t = String(q).toLowerCase();
        return items.filter((p) => `${p.nombre} ${p.apellido} ${p.especialidad}`.toLowerCase().includes(t));
      })
    );
  }

  display = (p: Profesor | string) => (typeof p === 'string' ? p : p ? `${p.nombre} ${p.apellido}` : '');

  cargar(): void {
    this.api.getProfesores().subscribe({
      next: (d) => this.data$.next(d),
      error: () => this.snack.open('Error al cargar profesores', 'Cerrar', { duration: 3000 })
    });
  }

  editar(p: Profesor): void {
    this.editingId = p.idProfesores;
    this.form.patchValue({
      nombre: p.nombre,
      apellido: p.apellido,
      correo: p.correo,
      telefono: p.telefono || '',
      especialidad: p.especialidad || ''
    });
  }

  limpiar(): void {
    this.editingId = null;
    this.form.reset({ nombre: '', apellido: '', correo: '', telefono: '', especialidad: '' });
  }

  guardar(): void {
    if (this.form.invalid) return;
    const body = this.form.getRawValue();
    const req$ = this.editingId ? this.api.updateProfesor(this.editingId, body) : this.api.createProfesor(body);
    req$.subscribe({
      next: () => { this.snack.open('Profesor guardado', 'OK', { duration: 2500 }); this.limpiar(); this.cargar(); },
      error: () => this.snack.open('No se pudo guardar', 'Cerrar', { duration: 3000 })
    });
  }

  eliminar(p: Profesor): void {
    if (!confirm(`¿Eliminar a ${p.nombre}?`)) return;
    this.api.deleteProfesor(p.idProfesores).subscribe({
      next: () => { this.snack.open('Eliminado', 'OK', { duration: 2000 }); this.cargar(); },
      error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
    });
  }
}
