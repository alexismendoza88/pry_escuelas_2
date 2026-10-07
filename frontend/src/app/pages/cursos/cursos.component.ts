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
import { Curso } from '../../core/models';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [
    ReactiveFormsModule, AsyncPipe, MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatButtonModule, MatTableModule, MatIconModule, MatSnackBarModule, MatCardModule
  ],
  template: `
    <div class="page-grid">
      <mat-card>
        <mat-card-header><mat-card-title>{{ editingId ? 'Editar curso' : 'Nuevo curso' }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="guardar()" class="page-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Grado</mat-label>
              <input matInput formControlName="grado" [matAutocomplete]="autoG" />
              <mat-autocomplete #autoG="matAutocomplete">
                @for (g of ['5A','6A','7B','8A','9A','10A','11A']; track g) {
                  <mat-option [value]="g">{{ g }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Jornada</mat-label>
              <input matInput formControlName="jornada" [matAutocomplete]="autoJ" />
              <mat-autocomplete #autoJ="matAutocomplete">
                <mat-option value="Mañana">Mañana</mat-option>
                <mat-option value="Tarde">Tarde</mat-option>
                <mat-option value="Noche">Noche</mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Nivel</mat-label>
              <input matInput formControlName="nivel" [matAutocomplete]="autoN" />
              <mat-autocomplete #autoN="matAutocomplete">
                <mat-option value="Primaria">Primaria</mat-option>
                <mat-option value="Secundaria">Secundaria</mat-option>
                <mat-option value="Media">Media</mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Capacidad</mat-label><input matInput type="number" formControlName="capacidad" /></mat-form-field>
            <div class="page-actions span2">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
              <button mat-stroked-button type="button" (click)="limpiar()">Limpiar</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header><mat-card-title>Cursos</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Buscar curso</mat-label>
            <input matInput [formControl]="searchCtrl" [matAutocomplete]="auto" />
            <mat-autocomplete #auto="matAutocomplete" [displayWith]="display" (optionSelected)="editar($event.option.value)">
              @for (c of filtrados$ | async; track c.idCurso) {
                <mat-option [value]="c">{{ c.grado }} — {{ c.jornada }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
          <table mat-table [dataSource]="(filtrados$ | async) || []" class="table">
            <ng-container matColumnDef="grado"><th mat-header-cell *matHeaderCellDef>Grado</th><td mat-cell *matCellDef="let c">{{ c.grado }}</td></ng-container>
            <ng-container matColumnDef="jornada"><th mat-header-cell *matHeaderCellDef>Jornada</th><td mat-cell *matCellDef="let c">{{ c.jornada }}</td></ng-container>
            <ng-container matColumnDef="nivel"><th mat-header-cell *matHeaderCellDef>Nivel</th><td mat-cell *matCellDef="let c">{{ c.nivel }}</td></ng-container>
            <ng-container matColumnDef="cap"><th mat-header-cell *matHeaderCellDef>Capacidad</th><td mat-cell *matCellDef="let c">{{ c.capacidad }}</td></ng-container>
            <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c"><div class="table-actions"><button mat-icon-button type="button" (click)="editar(c)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" color="warn" (click)="eliminar(c)"><mat-icon>delete</mat-icon></button></div></td>
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
export class CursosComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  cols = ['grado', 'jornada', 'nivel', 'cap', 'acc'];
  editingId: number | null = null;
  private data$ = new BehaviorSubject<Curso[]>([]);
  searchCtrl = this.fb.nonNullable.control('');
  form = this.fb.nonNullable.group({
    grado: ['', Validators.required],
    jornada: ['Mañana', Validators.required],
    nivel: ['Secundaria', Validators.required],
    capacidad: [30, Validators.required]
  });
  filtrados$!: Observable<Curso[]>;

  ngOnInit(): void {
    this.cargar();
    this.filtrados$ = combineLatest([this.data$, this.searchCtrl.valueChanges.pipe(startWith(''))]).pipe(
      map(([items, q]) => items.filter((c) => `${c.grado} ${c.jornada} ${c.nivel}`.toLowerCase().includes(String(q).toLowerCase())))
    );
  }

  display = (c: Curso | string) => (typeof c === 'string' ? c : c ? `${c.grado} (${c.jornada})` : '');
  cargar(): void {
    this.api.getCursos().subscribe({ next: (d) => this.data$.next(d), error: () => this.snack.open('Error al cargar cursos', 'Cerrar', { duration: 3000 }) });
  }
  editar(c: Curso): void { this.editingId = c.idCurso; this.form.patchValue(c); }
  limpiar(): void { this.editingId = null; this.form.reset({ grado: '', jornada: 'Mañana', nivel: 'Secundaria', capacidad: 30 }); }
  guardar(): void {
    if (this.form.invalid) return;
    const body = this.form.getRawValue();
    const req$ = this.editingId ? this.api.updateCurso(this.editingId, body) : this.api.createCurso(body);
    req$.subscribe({
      next: () => { this.snack.open('Curso guardado', 'OK', { duration: 2500 }); this.limpiar(); this.cargar(); },
      error: () => this.snack.open('No se pudo guardar', 'Cerrar', { duration: 3000 })
    });
  }
  eliminar(c: Curso): void {
    if (!confirm('¿Eliminar curso?')) return;
    this.api.deleteCurso(c.idCurso).subscribe({
      next: () => { this.snack.open('Eliminado', 'OK', { duration: 2000 }); this.cargar(); },
      error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
    });
  }
}
