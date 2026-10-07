import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
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
import { Alumno, Pago } from '../../core/models';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    ReactiveFormsModule, AsyncPipe, CurrencyPipe, MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatButtonModule, MatTableModule, MatIconModule, MatSnackBarModule, MatCardModule
  ],
  template: `
    <div class="page-grid">
      @if (auth.canManage()) {
      <mat-card>
        <mat-card-header><mat-card-title>{{ editingId ? 'Editar pago' : 'Nuevo pago' }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="guardar()" class="page-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
              <mat-label>Alumno</mat-label>
              <input matInput formControlName="alumno" [matAutocomplete]="autoA" />
              <mat-autocomplete #autoA="matAutocomplete" [displayWith]="displayAlumno" (optionSelected)="onAlumno($event.option.value)">
                @for (a of alumnosFiltrados$ | async; track a.id || a.idAlumnos) {
                  <mat-option [value]="a">{{ a.nombre }} {{ a.apellido }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="span2">
              <mat-label>Concepto</mat-label>
              <input matInput formControlName="concepto" [matAutocomplete]="autoC" />
              <mat-autocomplete #autoC="matAutocomplete">
                <mat-option value="Pensión">Pensión</mat-option>
                <mat-option value="Matrícula">Matrícula</mat-option>
                <mat-option value="Materiales">Materiales</mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Monto</mat-label><input matInput type="number" formControlName="monto" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Estado</mat-label>
              <input matInput formControlName="estado" [matAutocomplete]="autoE" />
              <mat-autocomplete #autoE="matAutocomplete">
                <mat-option value="pendiente">pendiente</mat-option>
                <mat-option value="pagado">pagado</mat-option>
                <mat-option value="vencido">vencido</mat-option>
              </mat-autocomplete>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Fecha emisión</mat-label><input matInput type="date" formControlName="fechaEmision" /></mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Método de pago</mat-label><input matInput formControlName="metodoDePago" /></mat-form-field>
            <div class="page-actions span2">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
              <button mat-stroked-button type="button" (click)="limpiar()">Limpiar</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      }
      <mat-card>
        <mat-card-header><mat-card-title>Pagos</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
            <mat-label>Buscar pago</mat-label>
            <input matInput [formControl]="searchCtrl" />
          </mat-form-field>
          <table mat-table [dataSource]="(filtrados$ | async) || []" class="table">
            <ng-container matColumnDef="concepto"><th mat-header-cell *matHeaderCellDef>Concepto</th><td mat-cell *matCellDef="let p">{{ p.concepto }}</td></ng-container>
            <ng-container matColumnDef="alumno"><th mat-header-cell *matHeaderCellDef>Alumno</th><td mat-cell *matCellDef="let p">{{ nombreAlumno(p.idEstudiante) }}</td></ng-container>
            <ng-container matColumnDef="monto"><th mat-header-cell *matHeaderCellDef>Monto</th><td mat-cell *matCellDef="let p">{{ p.monto | currency:'COP':'symbol-narrow':'1.0-0' }}</td></ng-container>
            <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let p">{{ p.estado }}</td></ng-container>
            <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                @if (auth.canManage()) {
                  <div class="table-actions"><button mat-icon-button type="button" (click)="editar(p)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" color="warn" (click)="eliminar(p)"><mat-icon>delete</mat-icon></button></div>
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
export class PagosComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);
  cols = this.auth.canManage()
    ? ['concepto', 'alumno', 'monto', 'estado', 'acc']
    : ['concepto', 'alumno', 'monto', 'estado'];
  editingId: number | null = null;
  private data$ = new BehaviorSubject<Pago[]>([]);
  private alumnos$ = new BehaviorSubject<Alumno[]>([]);
  private alumnos: Alumno[] = [];
  searchCtrl = this.fb.nonNullable.control('');
  form = this.fb.group({
    alumno: [null as Alumno | string | null, Validators.required],
    idEstudiante: [0, Validators.required],
    concepto: ['', Validators.required],
    monto: [0, Validators.required],
    estado: ['pendiente', Validators.required],
    fechaEmision: [new Date().toISOString().slice(0, 10), Validators.required],
    metodoDePago: ['']
  });
  alumnosFiltrados$!: Observable<Alumno[]>;
  filtrados$!: Observable<Pago[]>;

  ngOnInit(): void {
    this.api.getAlumnos().subscribe((a) => {
      this.alumnos = a;
      this.alumnos$.next(a);
    });
    this.cargar();
    this.alumnosFiltrados$ = this.form.controls.alumno.valueChanges.pipe(
      startWith(''),
      map((v) => {
        const t = (typeof v === 'string' ? v : `${v?.nombre || ''} ${v?.apellido || ''}`).toLowerCase();
        return this.alumnos.filter((a) => `${a.nombre} ${a.apellido}`.toLowerCase().includes(t));
      })
    );
    this.filtrados$ = combineLatest([
      this.data$,
      this.alumnos$,
      this.searchCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([items, alumnos, q]) => {
        const t = String(q).toLowerCase().trim();
        return items.filter((p) => {
          if (!t) return true;
          return `${p.concepto} ${p.estado} ${this.nombreAlumno(p.idEstudiante, alumnos)}`.toLowerCase().includes(t);
        });
      })
    );
  }

  nombreAlumno(id: number, lista = this.alumnos): string {
    const a = lista.find((x) => (x.idAlumnos || x.id) === id);
    return a ? `${a.nombre} ${a.apellido}`.trim() : '—';
  }

  displayAlumno = (a: Alumno | string) => (typeof a === 'string' ? a : a ? `${a.nombre} ${a.apellido}` : '');
  onAlumno(a: Alumno): void { this.form.patchValue({ idEstudiante: a.idAlumnos || a.id || 0, alumno: a }); }
  cargar(): void {
    this.api.getPagos().subscribe({ next: (d) => this.data$.next(d), error: () => this.snack.open('Error al cargar pagos', 'Cerrar', { duration: 3000 }) });
  }
  editar(p: Pago): void {
    this.editingId = p.idPagos;
    const alumno = this.alumnos.find((a) => (a.idAlumnos || a.id) === p.idEstudiante) || null;
    this.form.patchValue({
      alumno, idEstudiante: p.idEstudiante, concepto: p.concepto, monto: p.monto,
      estado: p.estado, fechaEmision: p.fechaEmision?.toString().slice(0, 10), metodoDePago: p.metodoDePago || ''
    });
  }
  limpiar(): void {
    this.editingId = null;
    this.form.reset({ alumno: null, idEstudiante: 0, concepto: '', monto: 0, estado: 'pendiente', fechaEmision: new Date().toISOString().slice(0, 10), metodoDePago: '' });
  }
  guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = {
      idEstudiante: v.idEstudiante!, concepto: v.concepto!, monto: Number(v.monto),
      estado: v.estado!, fechaEmision: v.fechaEmision!, metodoDePago: v.metodoDePago || null
    };
    const req$ = this.editingId ? this.api.updatePago(this.editingId, body) : this.api.createPago(body);
    req$.subscribe({
      next: () => { this.snack.open('Pago guardado', 'OK', { duration: 2500 }); this.limpiar(); this.cargar(); },
      error: () => this.snack.open('No se pudo guardar', 'Cerrar', { duration: 3000 })
    });
  }
  eliminar(p: Pago): void {
    if (!confirm('¿Eliminar pago?')) return;
    this.api.deletePago(p.idPagos).subscribe({
      next: () => { this.snack.open('Eliminado', 'OK', { duration: 2000 }); this.cargar(); },
      error: () => this.snack.open('No se pudo eliminar', 'Cerrar', { duration: 3000 })
    });
  }
}
