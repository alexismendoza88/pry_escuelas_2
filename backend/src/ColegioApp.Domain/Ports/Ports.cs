using ColegioApp.Domain.Entities;

namespace ColegioApp.Domain.Ports;

public interface IAlumnoRepository
{
    Task<IReadOnlyList<Alumno>> GetAllAsync(CancellationToken ct = default);
    Task<Alumno?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Alumno> AddAsync(Alumno alumno, CancellationToken ct = default);
    Task UpdateAsync(Alumno alumno, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IUsuarioRepository
{
    Task<Usuario?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetVistaCodigosByRolAsync(string rol, CancellationToken ct = default);
}

public interface ITokenService
{
    string GenerateToken(Usuario usuario);
}

public interface IPasswordHasher
{
    bool Verify(string password, string hash);
    string Hash(string password);
}

public interface IAlcanceEstudiante
{
    /// <summary>null = ve todos; conjunto vacío = no ve ninguno.</summary>
    Task<IReadOnlySet<int>?> ObtenerIdsAlumnosAsync(CancellationToken ct = default);
}
