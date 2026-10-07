namespace ColegioApp.Domain.Entities;

public class Alumno
{
    public int IdAlumnos { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public DateOnly? FechaNacimiento { get; set; }
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? GradoActual { get; set; }
    public string? NombreAcudiente { get; set; }
    public string? TelefonoAcudiente { get; set; }
    public string? AnoActual { get; set; }
}

public class Profesor
{
    public int IdProfesores { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Especialidad { get; set; }
}

public class Curso
{
    public int IdCurso { get; set; }
    public string Grado { get; set; } = string.Empty;
    public string Jornada { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public int Capacidad { get; set; }
}

public class Materia
{
    public int IdMateria { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int? IdProfesor { get; set; }
}

public class Matricula
{
    public int IdMatriculas { get; set; }
    public int IdEstudiante { get; set; }
    public int IdGrado { get; set; }
    public short Anio { get; set; }
    public string Estado { get; set; } = "activa";
}

public class Horario
{
    public int IdHorarios { get; set; }
    public int IdMateria { get; set; }
    public int IdProfesor { get; set; }
    public int? IdCurso { get; set; }
    public string Dia { get; set; } = string.Empty;
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan HoraFinal { get; set; }
}

public class Nota
{
    public int IdNotas { get; set; }
    public int IdEstudiante { get; set; }
    public int IdMateria { get; set; }
    public string Periodo { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string? Observaciones { get; set; }
}

public class Asistencia
{
    public int IdAsistencia { get; set; }
    public int IdEstudiante { get; set; }
    public int IdMateria { get; set; }
    public DateOnly Fecha { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}

public class Pago
{
    public int IdPagos { get; set; }
    public int IdEstudiante { get; set; }
    public string Concepto { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateOnly FechaEmision { get; set; }
    public DateOnly? FechaDeVencimiento { get; set; }
    public DateOnly? FechaPago { get; set; }
    public string Estado { get; set; } = "pendiente";
    public string? MetodoDePago { get; set; }
}

public class Usuario
{
    public int IdUsuarios { get; set; }
    public string NombreDeUsuario { get; set; } = string.Empty;
    public string ContrasenaHash { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public int? IdPersona { get; set; }
    public bool Activo { get; set; } = true;
}

public class Rol
{
    public int IdRoles { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    public bool EsSistema { get; set; }
}

public class Vista
{
    public int IdVistas { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Ruta { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool SoloAdmin { get; set; }
}

public class RolVista
{
    public int IdRol { get; set; }
    public int IdVista { get; set; }
}

public class AcudienteAlumno
{
    public int IdUsuario { get; set; }
    public int IdAlumno { get; set; }
}

public static class AccesoCatalogo
{
    public const string RolAdmin = "admin";
    public const string RolProfesor = "profesor";
    public const string RolAlumno = "alumno";
    public const string RolAcudiente = "acudiente";

    public static readonly (string Codigo, string Nombre, string Ruta, int Orden, bool SoloAdmin)[] Vistas =
    [
        ("alumnos", "Alumnos", "/alumnos", 10, false),
        ("profesores", "Profesores", "/profesores", 20, false),
        ("cursos", "Cursos", "/cursos", 30, false),
        ("materias", "Materias", "/materias", 40, false),
        ("matriculas", "Matrículas", "/matriculas", 50, false),
        ("pagos", "Pagos", "/pagos", 60, false),
        ("usuarios", "Usuarios", "/usuarios", 70, true),
        ("perfiles", "Perfiles y permisos", "/perfiles", 80, true)
    ];

    public static readonly string[] VistasProfesor =
        ["alumnos", "profesores", "cursos", "materias", "matriculas"];

    public static readonly string[] VistasAlumno =
        ["cursos", "materias", "matriculas"];

    public static readonly string[] VistasAcudiente =
        ["alumnos", "matriculas", "pagos"];
}
