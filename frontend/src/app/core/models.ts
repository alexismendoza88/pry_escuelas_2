export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  rol: string;
  expiresInMinutes: number;
  vistas: string[];
}

export interface MeResponse {
  username: string;
  rol: string;
  vistas: string[];
}

export interface AuthUser {
  username: string;
  rol: string;
  vistas: string[];
}

export interface VistaApp {
  id: number;
  codigo: string;
  nombre: string;
  ruta: string;
  orden: number;
  soloAdmin: boolean;
}

export interface RolApp {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  esSistema: boolean;
  vistasCount: number;
  vistas: string[];
}

export interface UsuarioApp {
  id: number;
  nombreDeUsuario: string;
  rol: string;
  idPersona?: number | null;
  activo: boolean;
  idsHijos?: number[];
}

export interface Alumno {
  id?: number;
  idAlumnos?: number;
  nombre: string;
  apellido: string;
  fechaNacimiento?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  gradoActual?: string | null;
  nombreAcudiente?: string | null;
  telefonoAcudiente?: string | null;
  anoActual?: string | null;
}

export interface Profesor {
  idProfesores: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string | null;
  especialidad?: string | null;
}

export interface Curso {
  idCurso: number;
  grado: string;
  jornada: string;
  nivel: string;
  capacidad: number;
}

export interface Materia {
  idMateria: number;
  codigo: string;
  nombre: string;
  idProfesor?: number | null;
}

export interface Matricula {
  idMatriculas: number;
  idEstudiante: number;
  idGrado: number;
  anio: number;
  estado: string;
}

export interface Pago {
  idPagos: number;
  idEstudiante: number;
  concepto: string;
  monto: number;
  fechaEmision: string;
  fechaDeVencimiento?: string | null;
  fechaPago?: string | null;
  estado: string;
  metodoDePago?: string | null;
}
