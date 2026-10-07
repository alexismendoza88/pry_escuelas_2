using ColegioApp.Domain.Entities;
using ColegioApp.Domain.Ports;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace ColegioApp.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("DbInitializer");
        var config = sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
        var cs = config.GetConnectionString("DefaultConnection")
                 ?? config.GetConnectionString("Default")
                 ?? throw new InvalidOperationException("Falta ConnectionStrings:DefaultConnection");

        await EnsureDatabaseExistsAsync(cs, logger);

        var db = sp.GetRequiredService<ColegioDbContext>();
        var created = await db.Database.EnsureCreatedAsync();
        logger.LogInformation(created
            ? "EF Core creó las tablas en la base de datos."
            : "Las tablas ya existían (EnsureCreated).");

        await EnsureAccessSchemaAsync(db, logger);
        await SeedAccessAsync(db, logger);

        if (await db.Usuarios.AnyAsync())
        {
            logger.LogInformation("Seed omitido: ya hay datos.");
            await SeedAcudienteDemoAsync(db, sp.GetRequiredService<IPasswordHasher>(), logger);
            return;
        }

        var hasher = sp.GetRequiredService<IPasswordHasher>();
        var hash = hasher.Hash("Password123!");

        db.Profesores.AddRange(
            new Profesor { Nombre = "Laura", Apellido = "Gómez", Correo = "laura.gomez@colegio.edu", Telefono = "3001112233", Especialidad = "Matemáticas" },
            new Profesor { Nombre = "Carlos", Apellido = "Ruiz", Correo = "carlos.ruiz@colegio.edu", Telefono = "3002223344", Especialidad = "Lengua" },
            new Profesor { Nombre = "Ana", Apellido = "Pérez", Correo = "ana.perez@colegio.edu", Telefono = "3003334455", Especialidad = "Ciencias" });
        await db.SaveChangesAsync();

        db.Alumnos.AddRange(
            new Alumno { Nombre = "Juan", Apellido = "Martínez", FechaNacimiento = new DateOnly(2012, 3, 15), Direccion = "Calle 10 #5-20", Telefono = "3101112233", GradoActual = "6A", NombreAcudiente = "María Martínez", TelefonoAcudiente = "3109998877", AnoActual = "2026" },
            new Alumno { Nombre = "Sofía", Apellido = "López", FechaNacimiento = new DateOnly(2011, 7, 22), Direccion = "Carrera 8 #12-40", Telefono = "3102223344", GradoActual = "7B", NombreAcudiente = "Pedro López", TelefonoAcudiente = "3108887766", AnoActual = "2026" },
            new Alumno { Nombre = "Andrés", Apellido = "Ramírez", FechaNacimiento = new DateOnly(2013, 1, 8), Direccion = "Av. 3 #45-10", Telefono = "3103334455", GradoActual = "5A", NombreAcudiente = "Lucía Ramírez", TelefonoAcudiente = "3107776655", AnoActual = "2026" },
            new Alumno { Nombre = "Valentina", Apellido = "Torres", FechaNacimiento = new DateOnly(2010, 11, 30), Direccion = "Calle 22 #8-15", Telefono = "3104445566", GradoActual = "8A", NombreAcudiente = "Diego Torres", TelefonoAcudiente = "3106665544", AnoActual = "2026" },
            new Alumno { Nombre = "Mateo", Apellido = "Castro", FechaNacimiento = new DateOnly(2012, 5, 19), Direccion = "Carrera 15 #30-02", Telefono = "3105556677", GradoActual = "6A", NombreAcudiente = "Elena Castro", TelefonoAcudiente = "3105554433", AnoActual = "2026" });
        await db.SaveChangesAsync();

        db.Cursos.AddRange(
            new Curso { Grado = "5A", Jornada = "Mañana", Nivel = "Primaria", Capacidad = 30 },
            new Curso { Grado = "6A", Jornada = "Mañana", Nivel = "Secundaria", Capacidad = 35 },
            new Curso { Grado = "7B", Jornada = "Tarde", Nivel = "Secundaria", Capacidad = 35 },
            new Curso { Grado = "8A", Jornada = "Mañana", Nivel = "Secundaria", Capacidad = 32 });
        await db.SaveChangesAsync();

        var profes = await db.Profesores.OrderBy(p => p.IdProfesores).ToListAsync();
        db.Materias.AddRange(
            new Materia { Codigo = "MAT-601", Nombre = "Matemáticas 6", IdProfesor = profes[0].IdProfesores },
            new Materia { Codigo = "LEN-601", Nombre = "Lengua Castellana 6", IdProfesor = profes[1].IdProfesores },
            new Materia { Codigo = "CIE-701", Nombre = "Ciencias Naturales 7", IdProfesor = profes[2].IdProfesores },
            new Materia { Codigo = "MAT-801", Nombre = "Matemáticas 8", IdProfesor = profes[0].IdProfesores },
            new Materia { Codigo = "LEN-501", Nombre = "Lengua Castellana 5", IdProfesor = profes[1].IdProfesores });
        await db.SaveChangesAsync();

        var alumnos = await db.Alumnos.OrderBy(a => a.IdAlumnos).ToListAsync();
        var cursos = await db.Cursos.OrderBy(c => c.IdCurso).ToListAsync();
        var materias = await db.Materias.OrderBy(m => m.IdMateria).ToListAsync();

        db.Matriculas.AddRange(
            new Matricula { IdEstudiante = alumnos[0].IdAlumnos, IdGrado = cursos[1].IdCurso, Anio = 2026, Estado = "activa" },
            new Matricula { IdEstudiante = alumnos[1].IdAlumnos, IdGrado = cursos[2].IdCurso, Anio = 2026, Estado = "activa" },
            new Matricula { IdEstudiante = alumnos[2].IdAlumnos, IdGrado = cursos[0].IdCurso, Anio = 2026, Estado = "activa" },
            new Matricula { IdEstudiante = alumnos[3].IdAlumnos, IdGrado = cursos[3].IdCurso, Anio = 2026, Estado = "activa" },
            new Matricula { IdEstudiante = alumnos[4].IdAlumnos, IdGrado = cursos[1].IdCurso, Anio = 2026, Estado = "activa" });

        db.Horarios.AddRange(
            new Horario { IdMateria = materias[0].IdMateria, IdProfesor = profes[0].IdProfesores, IdCurso = cursos[1].IdCurso, Dia = "Lunes", HoraInicio = TimeSpan.FromHours(7), HoraFinal = TimeSpan.FromHours(8) },
            new Horario { IdMateria = materias[1].IdMateria, IdProfesor = profes[1].IdProfesores, IdCurso = cursos[1].IdCurso, Dia = "Martes", HoraInicio = TimeSpan.FromHours(8), HoraFinal = TimeSpan.FromHours(9) },
            new Horario { IdMateria = materias[2].IdMateria, IdProfesor = profes[2].IdProfesores, IdCurso = cursos[2].IdCurso, Dia = "Miércoles", HoraInicio = TimeSpan.FromHours(9), HoraFinal = TimeSpan.FromHours(10) });

        db.Notas.AddRange(
            new Nota { IdEstudiante = alumnos[0].IdAlumnos, IdMateria = materias[0].IdMateria, Periodo = "P1", Valor = 4.5m, Observaciones = "Excelente" },
            new Nota { IdEstudiante = alumnos[1].IdAlumnos, IdMateria = materias[2].IdMateria, Periodo = "P1", Valor = 3.8m });

        db.Asistencias.AddRange(
            new Asistencia { IdEstudiante = alumnos[0].IdAlumnos, IdMateria = materias[0].IdMateria, Fecha = new DateOnly(2026, 7, 20), Estado = "presente" },
            new Asistencia { IdEstudiante = alumnos[4].IdAlumnos, IdMateria = materias[0].IdMateria, Fecha = new DateOnly(2026, 7, 20), Estado = "ausente", Observaciones = "Incapacidad" });

        db.Pagos.AddRange(
            new Pago { IdEstudiante = alumnos[0].IdAlumnos, Concepto = "Pensión Julio 2026", Monto = 350000m, FechaEmision = new DateOnly(2026, 7, 1), FechaDeVencimiento = new DateOnly(2026, 7, 15), FechaPago = new DateOnly(2026, 7, 10), Estado = "pagado", MetodoDePago = "transferencia" },
            new Pago { IdEstudiante = alumnos[1].IdAlumnos, Concepto = "Pensión Julio 2026", Monto = 350000m, FechaEmision = new DateOnly(2026, 7, 1), FechaDeVencimiento = new DateOnly(2026, 7, 15), Estado = "pendiente" });

        db.Usuarios.AddRange(
            new Usuario { NombreDeUsuario = "admin", ContrasenaHash = hash, Rol = "admin", Activo = true },
            new Usuario { NombreDeUsuario = "laura.gomez", ContrasenaHash = hash, Rol = "profesor", IdPersona = profes[0].IdProfesores, Activo = true },
            new Usuario { NombreDeUsuario = "juan.martinez", ContrasenaHash = hash, Rol = "alumno", IdPersona = alumnos[0].IdAlumnos, Activo = true });

        await db.SaveChangesAsync();
        await SeedAcudienteDemoAsync(db, hasher, logger);
        logger.LogInformation("Seed cargado. Login: admin / Password123!");
    }

    private static async Task EnsureAccessSchemaAsync(ColegioDbContext db, ILogger logger)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync("""ALTER TABLE "Usuarios" ALTER COLUMN "Rol" TYPE VARCHAR(50);""");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudo ampliar la columna Usuarios.Rol.");
        }

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "Roles" (
              "idRoles" SERIAL PRIMARY KEY,
              "Codigo" VARCHAR(50) NOT NULL UNIQUE,
              "Nombre" VARCHAR(80) NOT NULL,
              "Descripcion" VARCHAR(255) NULL,
              "Activo" BOOLEAN NOT NULL DEFAULT TRUE,
              "EsSistema" BOOLEAN NOT NULL DEFAULT FALSE
            );

            CREATE TABLE IF NOT EXISTS "Vistas" (
              "idVistas" SERIAL PRIMARY KEY,
              "Codigo" VARCHAR(50) NOT NULL UNIQUE,
              "Nombre" VARCHAR(80) NOT NULL,
              "Ruta" VARCHAR(80) NOT NULL,
              "Orden" INT NOT NULL DEFAULT 0,
              "SoloAdmin" BOOLEAN NOT NULL DEFAULT FALSE
            );

            CREATE TABLE IF NOT EXISTS "RolVistas" (
              "ID_Rol" INT NOT NULL REFERENCES "Roles" ("idRoles") ON UPDATE CASCADE ON DELETE CASCADE,
              "ID_Vista" INT NOT NULL REFERENCES "Vistas" ("idVistas") ON UPDATE CASCADE ON DELETE CASCADE,
              PRIMARY KEY ("ID_Rol", "ID_Vista")
            );

            CREATE TABLE IF NOT EXISTS "AcudienteAlumnos" (
              "ID_Usuario" INT NOT NULL REFERENCES "Usuarios" ("idUsuarios") ON UPDATE CASCADE ON DELETE CASCADE,
              "ID_Alumno" INT NOT NULL REFERENCES "Alumnos" ("idAlumnos") ON UPDATE CASCADE ON DELETE CASCADE,
              PRIMARY KEY ("ID_Usuario", "ID_Alumno")
            );
            """);
        logger.LogInformation("Esquema de roles y vistas verificado.");
    }

    private static async Task SeedAccessAsync(ColegioDbContext db, ILogger logger)
    {
        foreach (var item in AccesoCatalogo.Vistas)
        {
            var existing = await db.Vistas.FirstOrDefaultAsync(v => v.Codigo == item.Codigo);
            if (existing is null)
            {
                db.Vistas.Add(new Vista
                {
                    Codigo = item.Codigo,
                    Nombre = item.Nombre,
                    Ruta = item.Ruta,
                    Orden = item.Orden,
                    SoloAdmin = item.SoloAdmin
                });
            }
            else
            {
                existing.Nombre = item.Nombre;
                existing.Ruta = item.Ruta;
                existing.Orden = item.Orden;
                existing.SoloAdmin = item.SoloAdmin;
            }
        }
        await db.SaveChangesAsync();

        await EnsureRolAsync(db, AccesoCatalogo.RolAdmin, "Administrador", "Acceso total al sistema", true);
        await EnsureRolAsync(db, AccesoCatalogo.RolProfesor, "Profesor", "Gestión académica", true);
        await EnsureRolAsync(db, AccesoCatalogo.RolAlumno, "Alumno", "Consulta de información escolar", true);
        await EnsureRolAsync(db, AccesoCatalogo.RolAcudiente, "Acudiente", "Consulta de la información de sus hijos", true);
        await db.SaveChangesAsync();

        var vistas = await db.Vistas.ToListAsync();
        await EnsureRolVistasAsync(db, AccesoCatalogo.RolAdmin, vistas.Select(v => v.Codigo).ToArray(), replace: true);
        await EnsureRolVistasAsync(db, AccesoCatalogo.RolProfesor, AccesoCatalogo.VistasProfesor, replace: false);
        await EnsureRolVistasAsync(db, AccesoCatalogo.RolAlumno, AccesoCatalogo.VistasAlumno, replace: false);
        await EnsureRolVistasAsync(db, AccesoCatalogo.RolAcudiente, AccesoCatalogo.VistasAcudiente, replace: false);
        await db.SaveChangesAsync();
        logger.LogInformation("Perfiles y permisos de vistas sincronizados.");
    }

    private static async Task EnsureRolAsync(ColegioDbContext db, string codigo, string nombre, string descripcion, bool esSistema)
    {
        var rol = await db.Roles.FirstOrDefaultAsync(r => r.Codigo == codigo);
        if (rol is null)
        {
            db.Roles.Add(new Rol
            {
                Codigo = codigo,
                Nombre = nombre,
                Descripcion = descripcion,
                Activo = true,
                EsSistema = esSistema
            });
            return;
        }

        rol.Nombre = nombre;
        rol.EsSistema = esSistema;
        if (string.IsNullOrWhiteSpace(rol.Descripcion))
            rol.Descripcion = descripcion;
    }

    private static async Task EnsureRolVistasAsync(ColegioDbContext db, string codigoRol, string[] codigosVista, bool replace)
    {
        var rol = await db.Roles.FirstOrDefaultAsync(r => r.Codigo == codigoRol);
        if (rol is null) return;

        var actuales = await db.RolVistas.Where(x => x.IdRol == rol.IdRoles).ToListAsync();
        if (!replace && actuales.Count > 0)
            return;

        if (replace)
            db.RolVistas.RemoveRange(actuales);

        var vistas = await db.Vistas.Where(v => codigosVista.Contains(v.Codigo)).ToListAsync();
        var existentes = actuales.Select(x => x.IdVista).ToHashSet();
        foreach (var vista in vistas)
        {
            if (replace || !existentes.Contains(vista.IdVistas))
                db.RolVistas.Add(new RolVista { IdRol = rol.IdRoles, IdVista = vista.IdVistas });
        }
    }

    private static async Task SeedAcudienteDemoAsync(ColegioDbContext db, IPasswordHasher hasher, ILogger logger)
    {
        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.NombreDeUsuario == "maria.martinez");
        if (user is null)
        {
            user = new Usuario
            {
                NombreDeUsuario = "maria.martinez",
                ContrasenaHash = hasher.Hash("Password123!"),
                Rol = AccesoCatalogo.RolAcudiente,
                Activo = true
            };
            db.Usuarios.Add(user);
            await db.SaveChangesAsync();
        }
        else if (!string.Equals(user.Rol, AccesoCatalogo.RolAcudiente, StringComparison.OrdinalIgnoreCase))
        {
            user.Rol = AccesoCatalogo.RolAcudiente;
            await db.SaveChangesAsync();
        }

        var hijos = await db.Alumnos
            .Where(a => a.NombreAcudiente != null && a.NombreAcudiente.Contains("María"))
            .Select(a => a.IdAlumnos)
            .ToListAsync();
        if (hijos.Count == 0)
        {
            var primero = await db.Alumnos.OrderBy(a => a.IdAlumnos).Select(a => a.IdAlumnos).FirstOrDefaultAsync();
            if (primero > 0) hijos.Add(primero);
        }

        var actuales = await db.AcudienteAlumnos.Where(x => x.IdUsuario == user.IdUsuarios).Select(x => x.IdAlumno).ToListAsync();
        foreach (var idAlumno in hijos.Except(actuales))
            db.AcudienteAlumnos.Add(new AcudienteAlumno { IdUsuario = user.IdUsuarios, IdAlumno = idAlumno });

        await db.SaveChangesAsync();
        logger.LogInformation("Acudiente de prueba: maria.martinez / Password123! ({Count} hijo(s)).", hijos.Count);
    }

    private static async Task EnsureDatabaseExistsAsync(string connectionString, ILogger logger)
    {
        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        var dbName = builder.Database;
        if (string.IsNullOrWhiteSpace(dbName))
            throw new InvalidOperationException("La connection string no incluye Database.");

        builder.Database = "postgres";
        await using var conn = new NpgsqlConnection(builder.ConnectionString);
        await conn.OpenAsync();
        await using var check = new NpgsqlCommand("SELECT 1 FROM pg_database WHERE datname = @n", conn);
        check.Parameters.AddWithValue("n", dbName);
        var exists = await check.ExecuteScalarAsync() is not null;
        if (!exists)
        {
            await using var create = new NpgsqlCommand($"CREATE DATABASE \"{dbName}\" WITH ENCODING 'UTF8'", conn);
            await create.ExecuteNonQueryAsync();
            logger.LogInformation("Base de datos {Db} creada.", dbName);
        }
    }
}
