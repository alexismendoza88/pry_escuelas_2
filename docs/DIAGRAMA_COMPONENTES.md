# Diagrama de componentes del sistema

Vista lógica de **Colegio AppCol** a partir del modelo en `recursos/` y la API propuesta.

## Vista C4 — contenedores

```mermaid
flowchart TB
  users["Usuarios<br/>Admin · Profesor · Alumno · Acudiente"]

  subgraph frontend ["Cliente (futuro)"]
    WEB["Web App / SPA"]
    MOBILE["App móvil (opcional)"]
  end

  subgraph backend ["API Hexagonal"]
    API["REST API<br/>/api/v1"]
    APP["Casos de uso"]
    DOM["Dominio escolar"]
  end

  DB[("MySQL<br/>COLEGIO_APPCOL")]

  users --> WEB
  users --> MOBILE
  WEB --> API
  MOBILE --> API
  API --> APP --> DOM
  APP --> DB
```

## Componentes de la API

```mermaid
flowchart TB
  subgraph presentation ["Adaptadores de entrada"]
    AuthC["AuthController"]
    AlumnoC["AlumnoController"]
    ProfesorC["ProfesorController"]
    CursoC["CursoController"]
    MateriaC["MateriaController"]
    MatriculaC["MatriculaController"]
    HorarioC["HorarioController"]
    NotaC["NotaController"]
    AsistenciaC["AsistenciaController"]
    PagoC["PagoController"]
  end

  subgraph app ["Aplicación"]
    AuthS["AuthService / Login"]
    AlumnoS["CRUD Alumno"]
    MatriculaS["Matricular / Retirar"]
    AsistenciaS["Registrar asistencia"]
    NotaS["Registrar notas"]
    PagoS["Emitir / Cobrar"]
    HorarioS["Gestionar horarios"]
  end

  subgraph ports ["Puertos"]
    IAlumno["IAlumnoRepository"]
    IProf["IProfesorRepository"]
    ICurso["ICursoRepository"]
    IMat["IMateriaRepository"]
    IMatricula["IMatriculaRepository"]
    IHorario["IHorarioRepository"]
    INota["INotaRepository"]
    IAsist["IAsistenciaRepository"]
    IPago["IPagoRepository"]
    IUser["IUsuarioRepository"]
    IToken["ITokenService"]
  end

  subgraph infra ["Adaptadores de salida"]
    MySQLRepos["Repositorios MySQL"]
    Jwt["JwtService"]
  end

  DB[(COLEGIO_APPCOL)]

  AuthC --> AuthS
  AlumnoC --> AlumnoS
  ProfesorC --> AlumnoS
  CursoC --> MatriculaS
  MateriaC --> HorarioS
  MatriculaC --> MatriculaS
  HorarioC --> HorarioS
  NotaC --> NotaS
  AsistenciaC --> AsistenciaS
  PagoC --> PagoS

  AuthS --> IUser
  AuthS --> IToken
  AlumnoS --> IAlumno
  MatriculaS --> IMatricula
  MatriculaS --> IAlumno
  MatriculaS --> ICurso
  AsistenciaS --> IAsist
  NotaS --> INota
  PagoS --> IPago
  HorarioS --> IHorario
  HorarioS --> IMat
  HorarioS --> IProf

  IAlumno --> MySQLRepos
  IProf --> MySQLRepos
  ICurso --> MySQLRepos
  IMat --> MySQLRepos
  IMatricula --> MySQLRepos
  IHorario --> MySQLRepos
  INota --> MySQLRepos
  IAsist --> MySQLRepos
  IPago --> MySQLRepos
  IUser --> MySQLRepos
  IToken --> Jwt
  MySQLRepos --> DB
```

## Módulos de negocio y responsabilidades

| Componente | Responsabilidad | Tablas |
|------------|-----------------|--------|
| Identidad | Login, roles, sesión | Usuarios |
| Gestión académica | Alumnos, profesores, cursos, materias | Alumnos, Profesores, Curso, Materia |
| Matrícula | Inscripción anual a grado | Matriculas |
| Operación diaria | Horarios, asistencia, notas | Horarios, Asistencia, Notas |
| Cobranza | Pensiones y conceptos de pago | Pagos |

## Dependencias entre módulos

```mermaid
flowchart LR
  Identidad --> Academico
  Matricula --> Academico
  Operacion --> Academico
  Operacion --> Matricula
  Cobranza --> Academico
  Cobranza --> Matricula
```

Regla: **Académico** es el núcleo compartido; Identidad, Matrícula, Operación y Cobranza dependen de él, no al revés.
