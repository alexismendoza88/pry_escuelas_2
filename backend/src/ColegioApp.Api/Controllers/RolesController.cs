using ColegioApp.Domain.Entities;
using ColegioApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColegioApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/vistas")]
public class VistasController : ControllerBase
{
    private readonly ColegioDbContext _db;
    public VistasController(ColegioDbContext db) => _db = db;

    public record VistaDto(int Id, string Codigo, string Nombre, string Ruta, int Orden, bool SoloAdmin);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VistaDto>>> GetAll(CancellationToken ct)
    {
        var items = await _db.Vistas.AsNoTracking()
            .OrderBy(v => v.Orden)
            .Select(v => new VistaDto(v.IdVistas, v.Codigo, v.Nombre, v.Ruta, v.Orden, v.SoloAdmin))
            .ToListAsync(ct);
        return Ok(items);
    }
}

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/v1/[controller]")]
public class RolesController : ControllerBase
{
    private readonly ColegioDbContext _db;
    public RolesController(ColegioDbContext db) => _db = db;

    public record RolDto(int Id, string Codigo, string Nombre, string? Descripcion, bool Activo, bool EsSistema, int VistasCount, IReadOnlyList<string> Vistas);
    public record CreateRolRequest(string Codigo, string Nombre, string? Descripcion, bool Activo, IReadOnlyList<string>? Vistas);
    public record UpdateRolRequest(string Nombre, string? Descripcion, bool Activo, IReadOnlyList<string> Vistas);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RolDto>>> GetAll(CancellationToken ct)
    {
        var roles = await MapRoles(await _db.Roles.AsNoTracking().OrderBy(r => r.Nombre).ToListAsync(ct), ct);
        return Ok(roles);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RolDto>> Get(int id, CancellationToken ct)
    {
        var rol = await _db.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.IdRoles == id, ct);
        if (rol is null) return NotFound();
        return Ok((await MapRoles([rol], ct))[0]);
    }

    [HttpPost]
    public async Task<ActionResult<RolDto>> Create([FromBody] CreateRolRequest request, CancellationToken ct)
    {
        var codigo = NormalizarCodigo(request.Codigo);
        if (string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { message = "Código y nombre del rol son obligatorios." });

        if (await _db.Roles.AnyAsync(r => r.Codigo == codigo, ct))
            return Conflict(new { message = "Ya existe un rol con ese código." });

        var entity = new Rol
        {
            Codigo = codigo,
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            Activo = request.Activo,
            EsSistema = false
        };
        _db.Roles.Add(entity);
        await _db.SaveChangesAsync(ct);
        await ReemplazarVistasAsync(entity, request.Vistas ?? [], ct);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = entity.IdRoles }, (await MapRoles([entity], ct))[0]);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RolDto>> Update(int id, [FromBody] UpdateRolRequest request, CancellationToken ct)
    {
        var entity = await _db.Roles.FirstOrDefaultAsync(r => r.IdRoles == id, ct);
        if (entity is null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { message = "El nombre del rol es obligatorio." });

        if (entity.EsSistema && string.Equals(entity.Codigo, AccesoCatalogo.RolAdmin, StringComparison.OrdinalIgnoreCase) && !request.Activo)
            return BadRequest(new { message = "El perfil administrador no se puede desactivar." });

        entity.Nombre = request.Nombre.Trim();
        entity.Descripcion = request.Descripcion?.Trim();
        entity.Activo = request.Activo;
        await ReemplazarVistasAsync(entity, request.Vistas, ct);
        await _db.SaveChangesAsync(ct);
        return Ok((await MapRoles([entity], ct))[0]);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Roles.FirstOrDefaultAsync(r => r.IdRoles == id, ct);
        if (entity is null) return NotFound();
        if (entity.EsSistema)
            return BadRequest(new { message = "Los perfiles de sistema no se pueden eliminar." });

        var enUso = await _db.Usuarios.AnyAsync(u => u.Rol == entity.Codigo, ct);
        if (enUso)
            return BadRequest(new { message = "No se puede eliminar un perfil que todavía tiene usuarios." });

        _db.Roles.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<List<RolDto>> MapRoles(IReadOnlyList<Rol> roles, CancellationToken ct)
    {
        var ids = roles.Select(r => r.IdRoles).ToList();
        var asignadas = await (
            from rv in _db.RolVistas.AsNoTracking()
            join v in _db.Vistas.AsNoTracking() on rv.IdVista equals v.IdVistas
            where ids.Contains(rv.IdRol)
            orderby v.Orden
            select new { rv.IdRol, v.Codigo }
        ).ToListAsync(ct);

        var totalVistas = await _db.Vistas.CountAsync(ct);
        return roles.Select(r =>
        {
            var vistas = string.Equals(r.Codigo, AccesoCatalogo.RolAdmin, StringComparison.OrdinalIgnoreCase)
                ? AccesoCatalogo.Vistas.Select(v => v.Codigo).ToList()
                : asignadas.Where(x => x.IdRol == r.IdRoles).Select(x => x.Codigo).Distinct().ToList();
            var count = string.Equals(r.Codigo, AccesoCatalogo.RolAdmin, StringComparison.OrdinalIgnoreCase)
                ? totalVistas
                : vistas.Count;
            return new RolDto(r.IdRoles, r.Codigo, r.Nombre, r.Descripcion, r.Activo, r.EsSistema, count, vistas);
        }).ToList();
    }

    private async Task ReemplazarVistasAsync(Rol rol, IReadOnlyList<string> codigos, CancellationToken ct)
    {
        var actuales = await _db.RolVistas.Where(x => x.IdRol == rol.IdRoles).ToListAsync(ct);
        _db.RolVistas.RemoveRange(actuales);

        IEnumerable<string> seleccion = (codigos ?? []).Select(c => c.Trim().ToLowerInvariant()).Distinct();
        if (string.Equals(rol.Codigo, AccesoCatalogo.RolAdmin, StringComparison.OrdinalIgnoreCase))
            seleccion = AccesoCatalogo.Vistas.Select(v => v.Codigo);
        else
            seleccion = seleccion.Where(c => AccesoCatalogo.Vistas.Any(v => v.Codigo == c && !v.SoloAdmin));

        var lista = seleccion.ToList();
        var vistas = await _db.Vistas.Where(v => lista.Contains(v.Codigo)).ToListAsync(ct);
        foreach (var vista in vistas)
            _db.RolVistas.Add(new RolVista { IdRol = rol.IdRoles, IdVista = vista.IdVistas });
    }

    private static string NormalizarCodigo(string? codigo)
        => (codigo ?? string.Empty).Trim().ToLowerInvariant().Replace(' ', '_');
}
