namespace ColegioApp.Application.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username, string Rol, int ExpiresInMinutes, IReadOnlyList<string> Vistas);
public record MeResponse(string Username, string Rol, IReadOnlyList<string> Vistas);
public class AlumnoDto
{
    public int Id { get; set; }
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
public record CreateAlumnoRequest(string Nombre, string Apellido, DateOnly? FechaNacimiento, string? Direccion, string? Telefono, string? GradoActual, string? NombreAcudiente, string? TelefonoAcudiente, string? AnoActual);
public record UpdateAlumnoRequest(string Nombre, string Apellido, DateOnly? FechaNacimiento, string? Direccion, string? Telefono, string? GradoActual, string? NombreAcudiente, string? TelefonoAcudiente, string? AnoActual);
