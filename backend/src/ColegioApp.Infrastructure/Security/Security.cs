using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ColegioApp.Domain.Entities;
using ColegioApp.Domain.Ports;
using ColegioApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ColegioApp.Infrastructure.Security;

public class BcryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);
    public bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config) => _config = config;

    public string GenerateToken(Usuario usuario)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresMinutes = int.Parse(_config["Jwt:ExpiresMinutes"] ?? "120");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.IdUsuarios.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, usuario.NombreDeUsuario),
            new(ClaimTypes.Name, usuario.NombreDeUsuario),
            new(ClaimTypes.Role, usuario.Rol),
            new("personaId", usuario.IdPersona?.ToString() ?? string.Empty)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class AlcanceEstudiante : IAlcanceEstudiante
{
    private readonly IHttpContextAccessor _http;
    private readonly ColegioDbContext _db;

    public AlcanceEstudiante(IHttpContextAccessor http, ColegioDbContext db)
    {
        _http = http;
        _db = db;
    }

    public async Task<IReadOnlySet<int>?> ObtenerIdsAlumnosAsync(CancellationToken ct = default)
    {
        var user = _http.HttpContext?.User;
        var rol = user?.FindFirst(ClaimTypes.Role)?.Value;
        if (string.IsNullOrWhiteSpace(rol)
            || string.Equals(rol, AccesoCatalogo.RolAdmin, StringComparison.OrdinalIgnoreCase)
            || string.Equals(rol, AccesoCatalogo.RolProfesor, StringComparison.OrdinalIgnoreCase))
            return null;

        if (string.Equals(rol, AccesoCatalogo.RolAcudiente, StringComparison.OrdinalIgnoreCase))
        {
            if (!TryGetUserId(user, out var userId))
                return new HashSet<int>();
            var ids = await _db.AcudienteAlumnos.AsNoTracking()
                .Where(x => x.IdUsuario == userId)
                .Select(x => x.IdAlumno)
                .ToListAsync(ct);
            return ids.ToHashSet();
        }

        if (string.Equals(rol, AccesoCatalogo.RolAlumno, StringComparison.OrdinalIgnoreCase))
        {
            var persona = user?.FindFirst("personaId")?.Value;
            if (int.TryParse(persona, out var idAlumno) && idAlumno > 0)
                return new HashSet<int> { idAlumno };
            return new HashSet<int>();
        }

        return null;
    }

    private static bool TryGetUserId(ClaimsPrincipal? user, out int userId)
    {
        userId = 0;
        var raw = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                  ?? user?.FindFirst("sub")?.Value;
        return int.TryParse(raw, out userId) && userId > 0;
    }
}
