using ColegioApp.Application.DTOs;
using ColegioApp.Domain.Entities;
using ColegioApp.Domain.Ports;

namespace ColegioApp.Application.Services;

public class AuthService
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokens;

    public AuthService(IUsuarioRepository usuarios, IPasswordHasher hasher, ITokenService tokens)
    {
        _usuarios = usuarios;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _usuarios.GetByUsernameAsync(request.Username, ct);
        if (user is null || !user.Activo)
            return null;

        if (!_hasher.Verify(request.Password, user.ContrasenaHash))
            return null;

        var token = _tokens.GenerateToken(user);
        var vistas = await _usuarios.GetVistaCodigosByRolAsync(user.Rol, ct);
        return new LoginResponse(token, user.NombreDeUsuario, user.Rol, 120, vistas);
    }

    public async Task<MeResponse?> GetMeAsync(string username, CancellationToken ct = default)
    {
        var user = await _usuarios.GetByUsernameAsync(username, ct);
        if (user is null || !user.Activo)
            return null;
        var vistas = await _usuarios.GetVistaCodigosByRolAsync(user.Rol, ct);
        return new MeResponse(user.NombreDeUsuario, user.Rol, vistas);
    }
}

public class AlumnoService
{
    private readonly IAlumnoRepository _repo;

    public AlumnoService(IAlumnoRepository repo) => _repo = repo;

    public Task<IReadOnlyList<Alumno>> ListAsync(CancellationToken ct = default)
        => _repo.GetAllAsync(ct);

    public Task<Alumno?> GetAsync(int id, CancellationToken ct = default)
        => _repo.GetByIdAsync(id, ct);

    public async Task<Alumno> CreateAsync(CreateAlumnoRequest request, CancellationToken ct = default)
    {
        var entity = new Alumno
        {
            Nombre = request.Nombre,
            Apellido = request.Apellido,
            FechaNacimiento = request.FechaNacimiento,
            Direccion = request.Direccion,
            Telefono = request.Telefono,
            GradoActual = request.GradoActual,
            NombreAcudiente = request.NombreAcudiente,
            TelefonoAcudiente = request.TelefonoAcudiente,
            AnoActual = request.AnoActual
        };
        return await _repo.AddAsync(entity, ct);
    }

    public async Task<Alumno?> UpdateAsync(int id, UpdateAlumnoRequest request, CancellationToken ct = default)
    {
        var entity = await _repo.GetByIdAsync(id, ct);
        if (entity is null) return null;

        entity.Nombre = request.Nombre;
        entity.Apellido = request.Apellido;
        entity.FechaNacimiento = request.FechaNacimiento;
        entity.Direccion = request.Direccion;
        entity.Telefono = request.Telefono;
        entity.GradoActual = request.GradoActual;
        entity.NombreAcudiente = request.NombreAcudiente;
        entity.TelefonoAcudiente = request.TelefonoAcudiente;
        entity.AnoActual = request.AnoActual;

        await _repo.UpdateAsync(entity, ct);
        return entity;
    }

    public Task DeleteAsync(int id, CancellationToken ct = default)
        => _repo.DeleteAsync(id, ct);
}
