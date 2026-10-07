import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alumno, Curso, Materia, Matricula, Pago, Profesor, RolApp, UsuarioApp, VistaApp } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Alumnos
  getAlumnos(): Observable<Alumno[]> {
    return this.http.get<Alumno[]>(`${this.base}/alumnos`);
  }
  getAlumno(id: number): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.base}/alumnos/${id}`);
  }
  createAlumno(body: Partial<Alumno>): Observable<Alumno> {
    return this.http.post<Alumno>(`${this.base}/alumnos`, body);
  }
  updateAlumno(id: number, body: Partial<Alumno>): Observable<Alumno> {
    return this.http.put<Alumno>(`${this.base}/alumnos/${id}`, body);
  }
  deleteAlumno(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/alumnos/${id}`);
  }

  // Profesores
  getProfesores(): Observable<Profesor[]> {
    return this.http.get<Profesor[]>(`${this.base}/profesores`);
  }
  createProfesor(body: Partial<Profesor>): Observable<Profesor> {
    return this.http.post<Profesor>(`${this.base}/profesores`, body);
  }
  updateProfesor(id: number, body: Partial<Profesor>): Observable<Profesor> {
    return this.http.put<Profesor>(`${this.base}/profesores/${id}`, body);
  }
  deleteProfesor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/profesores/${id}`);
  }

  // Cursos
  getCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.base}/cursos`);
  }
  createCurso(body: Partial<Curso>): Observable<Curso> {
    return this.http.post<Curso>(`${this.base}/cursos`, body);
  }
  updateCurso(id: number, body: Partial<Curso>): Observable<Curso> {
    return this.http.put<Curso>(`${this.base}/cursos/${id}`, body);
  }
  deleteCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/cursos/${id}`);
  }

  // Materias
  getMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(`${this.base}/materias`);
  }
  createMateria(body: Partial<Materia>): Observable<Materia> {
    return this.http.post<Materia>(`${this.base}/materias`, body);
  }
  updateMateria(id: number, body: Partial<Materia>): Observable<Materia> {
    return this.http.put<Materia>(`${this.base}/materias/${id}`, body);
  }
  deleteMateria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/materias/${id}`);
  }

  // Matriculas
  getMatriculas(): Observable<Matricula[]> {
    return this.http.get<Matricula[]>(`${this.base}/matriculas`);
  }
  createMatricula(body: Partial<Matricula>): Observable<Matricula> {
    return this.http.post<Matricula>(`${this.base}/matriculas`, body);
  }
  updateMatricula(id: number, body: Partial<Matricula>): Observable<Matricula> {
    return this.http.put<Matricula>(`${this.base}/matriculas/${id}`, body);
  }
  deleteMatricula(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/matriculas/${id}`);
  }

  // Pagos
  getPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.base}/pagos`);
  }
  createPago(body: Partial<Pago>): Observable<Pago> {
    return this.http.post<Pago>(`${this.base}/pagos`, body);
  }
  updatePago(id: number, body: Partial<Pago>): Observable<Pago> {
    return this.http.put<Pago>(`${this.base}/pagos/${id}`, body);
  }
  deletePago(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/pagos/${id}`);
  }

  getUsuarios(): Observable<UsuarioApp[]> {
    return this.http.get<UsuarioApp[]>(`${this.base}/usuarios`);
  }
  createUsuario(body: { nombreDeUsuario: string; password: string; rol: string; idPersona?: number | null; activo: boolean; idsHijos?: number[] }): Observable<UsuarioApp> {
    return this.http.post<UsuarioApp>(`${this.base}/usuarios`, body);
  }
  updateUsuario(id: number, body: { nombreDeUsuario: string; password?: string; rol: string; idPersona?: number | null; activo: boolean; idsHijos?: number[] }): Observable<UsuarioApp> {
    return this.http.put<UsuarioApp>(`${this.base}/usuarios/${id}`, body);
  }
  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/usuarios/${id}`);
  }

  getRoles(): Observable<RolApp[]> {
    return this.http.get<RolApp[]>(`${this.base}/roles`);
  }
  createRol(body: Partial<RolApp> & { vistas?: string[] }): Observable<RolApp> {
    return this.http.post<RolApp>(`${this.base}/roles`, body);
  }
  updateRol(id: number, body: { nombre: string; descripcion?: string | null; activo: boolean; vistas: string[] }): Observable<RolApp> {
    return this.http.put<RolApp>(`${this.base}/roles/${id}`, body);
  }
  deleteRol(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/roles/${id}`);
  }

  getVistas(): Observable<VistaApp[]> {
    return this.http.get<VistaApp[]>(`${this.base}/vistas`);
  }
}
