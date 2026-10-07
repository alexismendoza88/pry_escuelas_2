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
import { Materia, Profesor } from '../../core/models';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [
    ReactiveFormsModule, AsyncPipe, MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatButtonModule, MatTableModule, MatIconModule, MatSnackBarModule, MatCardModule
  ],
  template: `
    <div class="page-grid">
      <mat-card>
        <mat-card-header><mat-card-title>{{ editingId ? 'Editar materia' : 'Nueva materia' }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="guardar()" class="page-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Código</mat-label><input matInput formControlName="codigo" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Nombre</mat-label><input matInput formControlName="nombre" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
              <mat-label>Profesor</mat-label>
              <input matInput formControlName="profesor" [matAutocomplete]="autoP" />
              <mat-autocomplete #autoP="matAutocomplete" [displayWith]="displayProf" (optionSelected)="onProf($event.option.value)">
                @for (p of profesoresFiltrados$ | async; track p.idProfesores) {
                  <mat-option [value]="p">{{ p.nombre }} {{ p.apellido }}</mat-option>
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
        <mat-card-header><mat-card-title>Materias</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Buscar materia</mat-label>
            <input matInput [formControl]="searchCtrl" [matAutocomplete]="auto" />
            <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayMat" (optionSelected)="editar($event.option.value)">
              @for (m of filtrados$ | async; track m.idMateria) {
                <mat-option [value]="m">{{ m.codigo }} — {{ m.nombre }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
          <table mat-table [dataSource]="(filtrados$ | async) || []" class="table">
            <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let m">{{ m.codigo }}</td></ng-container>
            <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th><td mat-cell *matCellDef="let m">{{ m.nombre }}</td></ng-container>
            <ng-container matColumnDef="prof"><th mat-header-cell *matHeaderCellDef>Profesor</th><td mat-cell *matCellDef="let m">{{ nombreProfesor(m.idProfesor) }}</td></ng-container>
            <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let m"><div class="table-actions"><button mat-icon-button type="button" (click)="editar(m)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" color="warn" (click)="eliminar(m)"><mat-icon>delete</mat-icon></button></div></td>
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
export class MateriasComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  cols = ['codigo', 'nombre', 'prof', 'acc'];
  editingId: number | null = null;
  private data$ = new BehaviorSubject<Materia[]>([]);
  private profesores$ = new BehaviorSubject<Profesor[]>([]);
  private profesores: Profesor[] = [];
  searchCtrl = this.fb.nonNullable.control('');
  form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    profesor: [null as Profesor | string | null],
    idProfesor: [null as number | null]
  });
  profesoresFiltrados$!: Observable<Profesor[]>;
  filtrados$!: Observable<Materia[]>;

  ngOnInit(): void {
    this.api.getProfesores().subscribe((p) => {
      this.profesores = p;
      this.profesores$.next(p);
    });
    this.cargar();
    this.profesoresFiltrados$ = this.form.controls.profesor.valueChanges.pipe(
      startWith(''),
      map((v) => {
        const t = (typeof v === 'string' ? v : `${v?.nombre || ''} ${v?.apellido || ''}`).toLowerCase();
        return this.profesores.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(t));
      })
    );
    this.filtrados$ = combineLatest([
      this.data$,
      this.profesores$,
      this.searchCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([items, profesores, q]) => {
        const t = String(q).toLowerCase().trim();
        return items.filter((m) => {
          if (!t) return true;
          return `${m.codigo} ${m.nombre} ${this.nombreProfesor(m.idProfesor, profesores)}`.toLowerCase().includes(t);
        });
      })
    );
  }

  nombreProfesor(id: number | null | undefined, lista = this.profesores): string {
    if (id == null) return '—';
    const p = lista.find((x) => x.idProfesores === id);
    return p ? `${p.nombre} ${p.apellido}`.trim() : '—';
  }

  displayProf = (p: Profesor | string) => (typeof p === 'string' ? p : p ? `${p.nombre} ${p.apellido}` : '');
  displayMat = (m: Materia | string) => (typeof m === 'string' ? m : m ? `${m.codigo} — ${m.nombre}` : '');
  onProf(p: Profesor): void { this.form.patchValue({ idProfesor: p.idProfesores, profesor: p }); }
  cargar(): void {
    this.api.getMaterias().subscribe({ next: (d) => this.data$.next(d), error: () => this.snack.open('Error al cargar materias', 'Cerrar', { duration: 3000 }) });
  }
  editar(m: Materia): void {
    this.editingId = m.idMateria;
    const profesor = this.profesores.find((p) => p.idProfesores === m.idProfesor) || null;
    this.form.patchValue({ codigo: m.codigo, nombre: m.nombre, idProfesor: m.idProfesor ?? null, profesor });
  }
  limpiar(): void { this.editingId = null; this.form.reset({ codigo: '', nombre: '', profesor: null, idProfesor: null }); }
  guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = { codigo: v.codigo!, nombre: v.nombre!, idProfesor: v.idProfesor };
    const req$ = this.editingId ? this.api.updateMateria(this.editingId, body) : this.api.createMateria(body);
    req$.subscribe({
      next: () => { this.snack.open('Materia guardada', 'OK', { duration: 2500 }); this.limpiar(); this.cargar(); },
      error: () => this.snack.open('No se pudo guardar', 'Cerrar', { duration: 3000 })
    });
  }
  eliminar(m: Materia): void {
    if (!confirm('¿Eliminar materia?')) return;
    this.api.deleteMateria(m.idMateria).subscribe({
      next: () => { this.snack.open('Eliminada', 'OK', { duration: 2000 }); this.cargar(); },
      error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
    });
  }
}
