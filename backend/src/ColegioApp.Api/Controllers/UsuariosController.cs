using ColegioApp.Domain.Entities;
using ColegioApp.Domain.Ports;
using ColegioApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColegioApp.Api.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/v1/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly ColegioDbContext _db;
    private readonly IPasswordHasher _hasher;

    public UsuariosController(ColegioDbContext db, IPasswordHasher hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    public record UsuarioDto(int Id, string NombreDeUsuario, string Rol, int? IdPersona, bool Activo, IReadOnlyList<int> IdsHijos);
    public record CreateUsuarioRequest(string NombreDeUsuario, string Password, string Rol, int? IdPersona, bool Activo, IReadOnlyList<int>? IdsHijos);
    public record UpdateUsuarioRequest(string NombreDeUsuario, string? Password, string Rol, int? IdPersona, bool Activo, IReadOnlyList<int>? IdsHijos);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioDto>>> GetAll(CancellationToken ct)
    {
        var items = await _db.Usuarios.AsNoTracking().OrderBy(u => u.NombreDeUsuario).ToListAsync(ct);
        return Ok(await MapAsync(items, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> Get(int id, CancellationToken ct)
    {
        var u = await _db.Usuarios.AsNoTracking().FirstOrDefaultAsync(x => x.IdUsuarios == id, ct);
        if (u is null) return NotFound();
        return Ok((await MapAsync([u], ct))[0]);
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Create([FromBody] CreateUsuarioRequest request, CancellationToken ct)
    {
        var username = request.NombreDeUsuario.Trim();
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Usuario y contraseña son obligatorios." });

        var rol = request.Rol.Trim();
        if (!await _db.Roles.AnyAsync(r => r.Codigo == rol && r.Activo, ct))
            return BadRequest(new { message = "El rol no existe o está inactivo." });

        if (await _db.Usuarios.AnyAsync(u => u.NombreDeUsuario == username, ct))
            return Conflict(new { message = "Ese nombre de usuario ya existe." });

        var entity = new Usuario
        {
            NombreDeUsuario = username,
            ContrasenaHash = _hasher.Hash(request.Password),
            Rol = rol,
            IdPersona = request.IdPersona,
            Activo = request.Activo
        };
        _db.Usuarios.Add(entity);
        await _db.SaveChangesAsync(ct);
        await GuardarHijosAsync(entity, request.IdsHijos, ct);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = entity.IdUsuarios }, (await MapAsync([entity], ct))[0]);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> Update(int id, [FromBody] UpdateUsuarioRequest request, CancellationToken ct)
    {
        var entity = await _db.Usuarios.FirstOrDefaultAsync(x => x.IdUsuarios == id, ct);
        if (entity is null) return NotFound();

        var username = request.NombreDeUsuario.Trim();
        var rol = request.Rol.Trim();
        if (!await _db.Roles.AnyAsync(r => r.Codigo == rol && r.Activo, ct)
            && !string.Equals(entity.Rol, rol, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "El rol no existe o está inactivo." });

        if (await _db.Usuarios.AnyAsync(u => u.NombreDeUsuario == username && u.IdUsuarios != id, ct))
            return Conflict(new { message = "Ese nombre de usuario ya existe." });

        if (string.Equals(entity.NombreDeUsuario, "admin", StringComparison.OrdinalIgnoreCase)
            && (!request.Activo || !string.Equals(rol, AccesoCatalogo.RolAdmin, StringComparison.OrdinalIgnoreCase)))
            return BadRequest(new { message = "No se puede desactivar ni cambiar el rol del usuario admin." });

        entity.NombreDeUsuario = username;
        entity.Rol = rol;
        entity.IdPersona = request.IdPersona;
        entity.Activo = request.Activo;
        if (!string.IsNullOrWhiteSpace(request.Password))
            entity.ContrasenaHash = _hasher.Hash(request.Password);

        await GuardarHijosAsync(entity, request.IdsHijos, ct);
        await _db.SaveChangesAsync(ct);
        return Ok((await MapAsync([entity], ct))[0]);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Usuarios.FirstOrDefaultAsync(x => x.IdUsuarios == id, ct);
        if (entity is null) return NotFound();
        if (string.Equals(entity.NombreDeUsuario, "admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "No se puede eliminar el usuario administrador." });

        _db.Usuarios.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<List<UsuarioDto>> MapAsync(IReadOnlyList<Usuario> usuarios, CancellationToken ct)
    {
        var ids = usuarios.Select(u => u.IdUsuarios).ToList();
        var hijos = await _db.AcudienteAlumnos.AsNoTracking()
            .Where(x => ids.Contains(x.IdUsuario))
            .ToListAsync(ct);
        return usuarios.Select(u => new UsuarioDto(
            u.IdUsuarios,
            u.NombreDeUsuario,
            u.Rol,
            u.IdPersona,
            u.Activo,
            hijos.Where(h => h.IdUsuario == u.IdUsuarios).Select(h => h.IdAlumno).ToList()
        )).ToList();
    }

    private async Task GuardarHijosAsync(Usuario usuario, IReadOnlyList<int>? idsHijos, CancellationToken ct)
    {
        var actuales = await _db.AcudienteAlumnos.Where(x => x.IdUsuario == usuario.IdUsuarios).ToListAsync(ct);
        _db.AcudienteAlumnos.RemoveRange(actuales);

        if (!string.Equals(usuario.Rol, AccesoCatalogo.RolAcudiente, StringComparison.OrdinalIgnoreCase))
            return;

        var validos = (idsHijos ?? [])
            .Distinct()
            .Where(id => id > 0)
            .ToList();
        if (validos.Count == 0) return;

        var existentes = await _db.Alumnos.Where(a => validos.Contains(a.IdAlumnos)).Select(a => a.IdAlumnos).ToListAsync(ct);
        foreach (var idAlumno in existentes)
            _db.AcudienteAlumnos.Add(new AcudienteAlumno { IdUsuario = usuario.IdUsuarios, IdAlumno = idAlumno });
    }
}
