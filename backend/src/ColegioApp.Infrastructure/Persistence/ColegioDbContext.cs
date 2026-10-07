using ColegioApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ColegioApp.Infrastructure.Persistence;

public class ColegioDbContext : DbContext
{
    public ColegioDbContext(DbContextOptions<ColegioDbContext> options) : base(options) { }

    public DbSet<Alumno> Alumnos => Set<Alumno>();
    public DbSet<Profesor> Profesores => Set<Profesor>();
    public DbSet<Curso> Cursos => Set<Curso>();
    public DbSet<Materia> Materias => Set<Materia>();
    public DbSet<Matricula> Matriculas => Set<Matricula>();
    public DbSet<Horario> Horarios => Set<Horario>();
    public DbSet<Nota> Notas => Set<Nota>();
    public DbSet<Asistencia> Asistencias => Set<Asistencia>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Vista> Vistas => Set<Vista>();
    public DbSet<RolVista> RolVistas => Set<RolVista>();
    public DbSet<AcudienteAlumno> AcudienteAlumnos => Set<AcudienteAlumno>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alumno>(e =>
        {
            e.ToTable("Alumnos");
            e.HasKey(x => x.IdAlumnos);
            e.Property(x => x.IdAlumnos).HasColumnName("idAlumnos").ValueGeneratedOnAdd();
            e.Property(x => x.Nombre).HasColumnName("NOMBRE").HasMaxLength(50).IsRequired();
            e.Property(x => x.Apellido).HasColumnName("APELLIDO").HasMaxLength(50).IsRequired();
            e.Property(x => x.FechaNacimiento).HasColumnName("FECHA_NACIMIENTO");
            e.Property(x => x.Direccion).HasColumnName("DIRECCION");
            e.Property(x => x.Telefono).HasColumnName("TELEFONO").HasMaxLength(20);
            e.Property(x => x.GradoActual).HasColumnName("GRADO_ACTUAL").HasMaxLength(20);
            e.Property(x => x.NombreAcudiente).HasColumnName("NOMBRE_ACUDIENTE").HasMaxLength(100);
            e.Property(x => x.TelefonoAcudiente).HasColumnName("TELEFONO_ACUDIENTE").HasMaxLength(20);
            e.Property(x => x.AnoActual).HasColumnName("ANO_ACTUAL").HasMaxLength(8);
        });

        modelBuilder.Entity<Profesor>(e =>
        {
            e.ToTable("Profesores");
            e.HasKey(x => x.IdProfesores);
            e.Property(x => x.IdProfesores).HasColumnName("idPROFESORES").ValueGeneratedOnAdd();
            e.Property(x => x.Nombre).HasColumnName("NOMBRE").HasMaxLength(50).IsRequired();
            e.Property(x => x.Apellido).HasColumnName("APELLIDO").HasMaxLength(50).IsRequired();
            e.Property(x => x.Correo).HasColumnName("CORREO").HasMaxLength(100).IsRequired();
            e.Property(x => x.Telefono).HasColumnName("TELEFONO").HasMaxLength(20);
            e.Property(x => x.Especialidad).HasColumnName("ESPECIALIDAD").HasMaxLength(100);
        });

        modelBuilder.Entity<Curso>(e =>
        {
            e.ToTable("Curso");
            e.HasKey(x => x.IdCurso);
            e.Property(x => x.IdCurso).HasColumnName("idCurso").ValueGeneratedOnAdd();
            e.Property(x => x.Grado).HasMaxLength(20).IsRequired();
            e.Property(x => x.Jornada).HasMaxLength(20).IsRequired();
            e.Property(x => x.Nivel).HasMaxLength(30).IsRequired();
            e.Property(x => x.Capacidad);
        });

        modelBuilder.Entity<Materia>(e =>
        {
            e.ToTable("Materia");
            e.HasKey(x => x.IdMateria);
            e.Property(x => x.IdMateria).HasColumnName("idMateria").ValueGeneratedOnAdd();
            e.Property(x => x.Codigo).HasMaxLength(20).IsRequired();
            e.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
            e.Property(x => x.IdProfesor).HasColumnName("ID_Profesor");
        });

        modelBuilder.Entity<Matricula>(e =>
        {
            e.ToTable("Matriculas");
            e.HasKey(x => x.IdMatriculas);
            e.Property(x => x.IdMatriculas).HasColumnName("idMatriculas").ValueGeneratedOnAdd();
            e.Property(x => x.IdEstudiante).HasColumnName("ID_Estudiante");
            e.Property(x => x.IdGrado).HasColumnName("ID_Grado");
            e.Property(x => x.Anio).HasColumnName("Anio");
            e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
        });

        modelBuilder.Entity<Horario>(e =>
        {
            e.ToTable("Horarios");
            e.HasKey(x => x.IdHorarios);
            e.Property(x => x.IdHorarios).HasColumnName("idHorarios").ValueGeneratedOnAdd();
            e.Property(x => x.IdMateria).HasColumnName("ID_Materia");
            e.Property(x => x.IdProfesor).HasColumnName("ID_Profesor");
            e.Property(x => x.IdCurso).HasColumnName("ID_Curso");
            e.Property(x => x.Dia).HasMaxLength(15).IsRequired();
            e.Property(x => x.HoraInicio).HasColumnName("Hora_Inicio");
            e.Property(x => x.HoraFinal).HasColumnName("Hora_Final");
        });

        modelBuilder.Entity<Nota>(e =>
        {
            e.ToTable("Notas");
            e.HasKey(x => x.IdNotas);
            e.Property(x => x.IdNotas).HasColumnName("idNotas").ValueGeneratedOnAdd();
            e.Property(x => x.IdEstudiante).HasColumnName("ID_Estudiante");
            e.Property(x => x.IdMateria).HasColumnName("ID_Materia");
            e.Property(x => x.Periodo).HasMaxLength(20).IsRequired();
            e.Property(x => x.Valor).HasPrecision(4, 2);
            e.Property(x => x.Observaciones).HasMaxLength(255);
        });

        modelBuilder.Entity<Asistencia>(e =>
        {
            e.ToTable("Asistencia");
            e.HasKey(x => x.IdAsistencia);
            e.Property(x => x.IdAsistencia).HasColumnName("idAsistencia").ValueGeneratedOnAdd();
            e.Property(x => x.IdEstudiante).HasColumnName("ID_Estudiante");
            e.Property(x => x.IdMateria).HasColumnName("ID_Materia");
            e.Property(x => x.Fecha);
            e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
            e.Property(x => x.Observaciones).HasMaxLength(255);
        });

        modelBuilder.Entity<Pago>(e =>
        {
            e.ToTable("Pagos");
            e.HasKey(x => x.IdPagos);
            e.Property(x => x.IdPagos).HasColumnName("idPagos").ValueGeneratedOnAdd();
            e.Property(x => x.IdEstudiante).HasColumnName("ID_Estudiante");
            e.Property(x => x.Concepto).HasMaxLength(100).IsRequired();
            e.Property(x => x.Monto).HasPrecision(12, 2);
            e.Property(x => x.FechaEmision).HasColumnName("Fecha_Emision");
            e.Property(x => x.FechaDeVencimiento).HasColumnName("Fecha_de_Vencimiento");
            e.Property(x => x.FechaPago).HasColumnName("Fecha_Pago");
            e.Property(x => x.Estado).HasMaxLength(20).IsRequired();
            e.Property(x => x.MetodoDePago).HasColumnName("Metodo_de_Pago").HasMaxLength(40);
        });

        modelBuilder.Entity<Usuario>(e =>
        {
            e.ToTable("Usuarios");
            e.HasKey(x => x.IdUsuarios);
            e.Property(x => x.IdUsuarios).HasColumnName("idUsuarios").ValueGeneratedOnAdd();
            e.Property(x => x.NombreDeUsuario).HasColumnName("Nombre_de_Usuario").HasMaxLength(50).IsRequired();
            e.Property(x => x.ContrasenaHash).HasColumnName("ContrasenaHash").HasMaxLength(255).IsRequired();
            e.Property(x => x.Rol).HasMaxLength(50).IsRequired();
            e.Property(x => x.IdPersona).HasColumnName("ID_Persona");
            e.Property(x => x.Activo);
        });

        modelBuilder.Entity<Rol>(e =>
        {
            e.ToTable("Roles");
            e.HasKey(x => x.IdRoles);
            e.Property(x => x.IdRoles).HasColumnName("idRoles").ValueGeneratedOnAdd();
            e.Property(x => x.Codigo).HasMaxLength(50).IsRequired();
            e.Property(x => x.Nombre).HasMaxLength(80).IsRequired();
            e.Property(x => x.Descripcion).HasMaxLength(255);
            e.HasIndex(x => x.Codigo).IsUnique();
        });

        modelBuilder.Entity<Vista>(e =>
        {
            e.ToTable("Vistas");
            e.HasKey(x => x.IdVistas);
            e.Property(x => x.IdVistas).HasColumnName("idVistas").ValueGeneratedOnAdd();
            e.Property(x => x.Codigo).HasMaxLength(50).IsRequired();
            e.Property(x => x.Nombre).HasMaxLength(80).IsRequired();
            e.Property(x => x.Ruta).HasMaxLength(80).IsRequired();
            e.HasIndex(x => x.Codigo).IsUnique();
        });

        modelBuilder.Entity<RolVista>(e =>
        {
            e.ToTable("RolVistas");
            e.HasKey(x => new { x.IdRol, x.IdVista });
            e.Property(x => x.IdRol).HasColumnName("ID_Rol");
            e.Property(x => x.IdVista).HasColumnName("ID_Vista");
        });

        modelBuilder.Entity<AcudienteAlumno>(e =>
        {
            e.ToTable("AcudienteAlumnos");
            e.HasKey(x => new { x.IdUsuario, x.IdAlumno });
            e.Property(x => x.IdUsuario).HasColumnName("ID_Usuario");
            e.Property(x => x.IdAlumno).HasColumnName("ID_Alumno");
        });
    }
}
