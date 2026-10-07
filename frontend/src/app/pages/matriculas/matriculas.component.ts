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
import { AuthService } from '../../core/auth.service';
import { Alumno, Curso, Matricula } from '../../core/models';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [
    ReactiveFormsModule, AsyncPipe, MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatButtonModule, MatTableModule, MatIconModule, MatSnackBarModule, MatCardModule
  ],
  template: `
    <div class="page-grid">
      @if (auth.canManage()) {
      <mat-card>
        <mat-card-header><mat-card-title>{{ editingId ? 'Editar matrícula' : 'Nueva matrícula' }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="guardar()" class="page-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
              <mat-label>Alumno</mat-label>
              <input matInput formControlName="alumno" [matAutocomplete]="autoAlumno" />
              <mat-autocomplete #autoAlumno="matAutocomplete" [displayWith]="displayAlumno" (optionSelected)="onAlumno($event.option.value)">
                @for (a of alumnosFiltrados$ | async; track a.id || a.idAlumnos) {
                  <mat-option [value]="a">{{ a.nombre }} {{ a.apellido }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
              <mat-label>Curso</mat-label>
              <input matInput formControlName="curso" [matAutocomplete]="autoCurso" />
              <mat-autocomplete #autoCurso="matAutocomplete" [displayWith]="displayCurso" (optionSelected)="onCurso($event.option.value)">
                @for (c of cursosFiltrados$ | async; track c.idCurso) {
                  <mat-option [value]="c">{{ c.grado }} — {{ c.jornada }} ({{ c.nivel }})</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Año</mat-label><input matInput type="number" formControlName="anio" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Estado</mat-label>
              <input matInput formControlName="estado" [matAutocomplete]="autoEst" />
              <mat-autocomplete #autoEst="matAutocomplete">
                <mat-option value="activa">activa</mat-option>
                <mat-option value="retirada">retirada</mat-option>
                <mat-option value="finalizada">finalizada</mat-option>
              </mat-autocomplete>
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
        <mat-card-header><mat-card-title>Matrículas</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Buscar por alumno, curso, año o estado</mat-label>
            <input matInput [formControl]="searchCtrl" />
          </mat-form-field>
          <table mat-table [dataSource]="(filtrados$ | async) || []" class="table">
            <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>ID</th><td mat-cell *matCellDef="let m">{{ m.idMatriculas }}</td></ng-container>
            <ng-container matColumnDef="est"><th mat-header-cell *matHeaderCellDef>Alumno</th><td mat-cell *matCellDef="let m">{{ nombreAlumno(m.idEstudiante) }}</td></ng-container>
            <ng-container matColumnDef="curso"><th mat-header-cell *matHeaderCellDef>Curso</th><td mat-cell *matCellDef="let m">{{ nombreCurso(m.idGrado) }}</td></ng-container>
            <ng-container matColumnDef="anio"><th mat-header-cell *matHeaderCellDef>Año</th><td mat-cell *matCellDef="let m">{{ m.anio }}</td></ng-container>
            <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let m">{{ m.estado }}</td></ng-container>
            <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let m">
                @if (auth.canManage()) {
                  <div class="table-actions"><button mat-icon-button type="button" (click)="editar(m)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" color="warn" (click)="eliminar(m)"><mat-icon>delete</mat-icon></button></div>
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
    .grid { display: grid; gap: 1rem; }
    @media (min-width: 1100px) { .grid { grid-template-columns: 1fr 1.2fr; } }
    .form { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem 1rem; margin-top: .75rem; }
    .span2 { grid-column: span 2; } .actions { display: flex; gap: .75rem; }
    .search, .table { width: 100%; }
  `]
})
export class MatriculasComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);

  cols = this.auth.canManage()
    ? ['id', 'est', 'curso', 'anio', 'estado', 'acc']
    : ['id', 'est', 'curso', 'anio', 'estado'];
  editingId: number | null = null;
  private matriculas$ = new BehaviorSubject<Matricula[]>([]);
  private alumnos$ = new BehaviorSubject<Alumno[]>([]);
  private cursos$ = new BehaviorSubject<Curso[]>([]);
  private alumnos: Alumno[] = [];
  private cursos: Curso[] = [];
  searchCtrl = this.fb.nonNullable.control('');

  form = this.fb.group({
    alumno: [null as Alumno | string | null, Validators.required],
    curso: [null as Curso | string | null, Validators.required],
    idEstudiante: [0, Validators.required],
    idGrado: [0, Validators.required],
    anio: [2026, Validators.required],
    estado: ['activa', Validators.required]
  });

  alumnosFiltrados$!: Observable<Alumno[]>;
  cursosFiltrados$!: Observable<Curso[]>;
  filtrados$!: Observable<Matricula[]>;

  ngOnInit(): void {
    this.api.getAlumnos().subscribe((a) => {
      this.alumnos = a;
      this.alumnos$.next(a);
    });
    this.api.getCursos().subscribe((c) => {
      this.cursos = c;
      this.cursos$.next(c);
    });
    this.cargar();

    this.alumnosFiltrados$ = this.form.controls.alumno.valueChanges.pipe(
      startWith(''),
      map((v) => {
        const t = (typeof v === 'string' ? v : `${v?.nombre || ''} ${v?.apellido || ''}`).toLowerCase();
        return this.alumnos.filter((a) => `${a.nombre} ${a.apellido}`.toLowerCase().includes(t));
      })
    );
    this.cursosFiltrados$ = this.form.controls.curso.valueChanges.pipe(
      startWith(''),
      map((v) => {
        const t = (typeof v === 'string' ? v : v?.grado || '').toLowerCase();
        return this.cursos.filter((c) => `${c.grado} ${c.jornada}`.toLowerCase().includes(t));
      })
    );
    this.filtrados$ = combineLatest([
      this.matriculas$,
      this.alumnos$,
      this.cursos$,
      this.searchCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([items, alumnos, cursos, q]) => {
        const t = String(q).toLowerCase().trim();
        return items.filter((m) => {
          if (!t) return true;
          const alumno = this.nombreAlumno(m.idEstudiante, alumnos);
          const curso = this.nombreCurso(m.idGrado, cursos);
          return `${alumno} ${curso} ${m.anio} ${m.estado}`.toLowerCase().includes(t);
        });
      })
    );
  }

  idAlumno(a: Alumno): number {
    return a.idAlumnos || a.id || 0;
  }

  nombreAlumno(id: number, lista = this.alumnos): string {
    const a = lista.find((x) => this.idAlumno(x) === id);
    return a ? `${a.nombre} ${a.apellido}`.trim() : '—';
  }

  nombreCurso(id: number, lista = this.cursos): string {
    const c = lista.find((x) => x.idCurso === id);
    return c ? `${c.grado} — ${c.jornada}` : '—';
  }

  displayAlumno = (a: Alumno | string) => (typeof a === 'string' ? a : a ? `${a.nombre} ${a.apellido}` : '');
  displayCurso = (c: Curso | string) => (typeof c === 'string' ? c : c ? `${c.grado} (${c.jornada})` : '');

  onAlumno(a: Alumno): void {
    this.form.patchValue({ idEstudiante: a.idAlumnos || a.id || 0, alumno: a });
  }
  onCurso(c: Curso): void {
    this.form.patchValue({ idGrado: c.idCurso, curso: c });
  }

  cargar(): void {
    this.api.getMatriculas().subscribe({
      next: (d) => this.matriculas$.next(d),
      error: () => this.snack.open('Error al cargar matrículas', 'Cerrar', { duration: 3000 })
    });
  }

  editar(m: Matricula): void {
    this.editingId = m.idMatriculas;
    const alumno = this.alumnos.find((a) => (a.idAlumnos || a.id) === m.idEstudiante) || null;
    const curso = this.cursos.find((c) => c.idCurso === m.idGrado) || null;
    this.form.patchValue({
      alumno, curso, idEstudiante: m.idEstudiante, idGrado: m.idGrado, anio: m.anio, estado: m.estado
    });
  }

  limpiar(): void {
    this.editingId = null;
    this.form.reset({ alumno: null, curso: null, idEstudiante: 0, idGrado: 0, anio: 2026, estado: 'activa' });
  }

  guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = { idEstudiante: v.idEstudiante!, idGrado: v.idGrado!, anio: Number(v.anio), estado: v.estado! };
    const req$ = this.editingId ? this.api.updateMatricula(this.editingId, body) : this.api.createMatricula(body);
    req$.subscribe({
      next: () => { this.snack.open('Matrícula guardada', 'OK', { duration: 2500 }); this.limpiar(); this.cargar(); },
      error: () => this.snack.open('No se pudo guardar', 'Cerrar', { duration: 3000 })
    });
  }

  eliminar(m: Matricula): void {
    if (!confirm('¿Eliminar matrícula?')) return;
    this.api.deleteMatricula(m.idMatriculas).subscribe({
      next: () => { this.snack.open('Eliminada', 'OK', { duration: 2000 }); this.cargar(); },
      error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
    });
  }
}
