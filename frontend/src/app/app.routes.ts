import { Routes } from '@angular/router';
import { authGuard, vistaGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'alumnos' },
      { path: 'alumnos', data: { vista: 'alumnos' }, canActivate: [vistaGuard], loadComponent: () => import('./pages/alumnos/alumnos.component').then(m => m.AlumnosComponent) },
      { path: 'profesores', data: { vista: 'profesores' }, canActivate: [vistaGuard], loadComponent: () => import('./pages/profesores/profesores.component').then(m => m.ProfesoresComponent) },
      { path: 'cursos', data: { vista: 'cursos' }, canActivate: [vistaGuard], loadComponent: () => import('./pages/cursos/cursos.component').then(m => m.CursosComponent) },
      { path: 'materias', data: { vista: 'materias' }, canActivate: [vistaGuard], loadComponent: () => import('./pages/materias/materias.component').then(m => m.MateriasComponent) },
      { path: 'matriculas', data: { vista: 'matriculas' }, canActivate: [vistaGuard], loadComponent: () => import('./pages/matriculas/matriculas.component').then(m => m.MatriculasComponent) },
      { path: 'pagos', data: { vista: 'pagos' }, canActivate: [vistaGuard], loadComponent: () => import('./pages/pagos/pagos.component').then(m => m.PagosComponent) },
      { path: 'usuarios', data: { vista: 'usuarios' }, canActivate: [vistaGuard], loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'perfiles', data: { vista: 'perfiles' }, canActivate: [vistaGuard], loadComponent: () => import('./pages/perfiles/perfiles.component').then(m => m.PerfilesComponent) }
    ]
  },
  { path: '**', redirectTo: 'alumnos' }
];
