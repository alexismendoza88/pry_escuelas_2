using ColegioApp.Domain.Entities;
using ColegioApp.Domain.Ports;
using ColegioApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColegioApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class MatriculasController : ControllerBase
{
    private readonly ColegioDbContext _db;
    private readonly IAlcanceEstudiante _alcance;
    public MatriculasController(ColegioDbContext db, IAlcanceEstudiante alcance)
    {
        _db = db;
        _alcance = alcance;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Matricula>>> GetAll(CancellationToken ct)
    {
        var query = _db.Matriculas.AsNoTracking().AsQueryable();
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null)
            query = query.Where(x => ids.Contains(x.IdEstudiante));
        return Ok(await query.OrderByDescending(x => x.Anio).ToListAsync(ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Matricula>> Get(int id, CancellationToken ct)
    {
        var item = await _db.Matriculas.FindAsync([id], ct);
        if (item is null) return NotFound();
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null && !ids.Contains(item.IdEstudiante))
            return NotFound();
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<Matricula>> Create([FromBody] Matricula model, CancellationToken ct)
    {
        model.IdMatriculas = 0;
        if (string.IsNullOrWhiteSpace(model.Estado)) model.Estado = "activa";
        _db.Matriculas.Add(model);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = model.IdMatriculas }, model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<Matricula>> Update(int id, [FromBody] Matricula model, CancellationToken ct)
    {
        var entity = await _db.Matriculas.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.IdEstudiante = model.IdEstudiante;
        entity.IdGrado = model.IdGrado;
        entity.Anio = model.Anio;
        entity.Estado = model.Estado;
        await _db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Matriculas.FindAsync([id], ct);
        if (entity is null) return NotFound();
        _db.Matriculas.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class HorariosController : ControllerBase
{
    private readonly ColegioDbContext _db;
    public HorariosController(ColegioDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Horario>>> GetAll(CancellationToken ct)
        => Ok(await _db.Horarios.AsNoTracking().ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Horario>> Get(int id, CancellationToken ct)
    {
        var item = await _db.Horarios.FindAsync([id], ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<Horario>> Create([FromBody] Horario model, CancellationToken ct)
    {
        model.IdHorarios = 0;
        _db.Horarios.Add(model);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = model.IdHorarios }, model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<Horario>> Update(int id, [FromBody] Horario model, CancellationToken ct)
    {
        var entity = await _db.Horarios.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.IdMateria = model.IdMateria;
        entity.IdProfesor = model.IdProfesor;
        entity.IdCurso = model.IdCurso;
        entity.Dia = model.Dia;
        entity.HoraInicio = model.HoraInicio;
        entity.HoraFinal = model.HoraFinal;
        await _db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Horarios.FindAsync([id], ct);
        if (entity is null) return NotFound();
        _db.Horarios.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class NotasController : ControllerBase
{
    private readonly ColegioDbContext _db;
    private readonly IAlcanceEstudiante _alcance;
    public NotasController(ColegioDbContext db, IAlcanceEstudiante alcance)
    {
        _db = db;
        _alcance = alcance;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Nota>>> GetAll(CancellationToken ct)
    {
        var query = _db.Notas.AsNoTracking().AsQueryable();
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null)
            query = query.Where(x => ids.Contains(x.IdEstudiante));
        return Ok(await query.ToListAsync(ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Nota>> Get(int id, CancellationToken ct)
    {
        var item = await _db.Notas.FindAsync([id], ct);
        if (item is null) return NotFound();
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null && !ids.Contains(item.IdEstudiante))
            return NotFound();
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<Nota>> Create([FromBody] Nota model, CancellationToken ct)
    {
        model.IdNotas = 0;
        _db.Notas.Add(model);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = model.IdNotas }, model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<Nota>> Update(int id, [FromBody] Nota model, CancellationToken ct)
    {
        var entity = await _db.Notas.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.IdEstudiante = model.IdEstudiante;
        entity.IdMateria = model.IdMateria;
        entity.Periodo = model.Periodo;
        entity.Valor = model.Valor;
        entity.Observaciones = model.Observaciones;
        await _db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin,profesor")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Notas.FindAsync([id], ct);
        if (entity is null) return NotFound();
        _db.Notas.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class AsistenciasController : ControllerBase
{
    private readonly ColegioDbContext _db;
    private readonly IAlcanceEstudiante _alcance;
    public AsistenciasController(ColegioDbContext db, IAlcanceEstudiante alcance)
    {
        _db = db;
        _alcance = alcance;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Asistencia>>> GetAll(CancellationToken ct)
    {
        var query = _db.Asistencias.AsNoTracking().AsQueryable();
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null)
            query = query.Where(x => ids.Contains(x.IdEstudiante));
        return Ok(await query.OrderByDescending(x => x.Fecha).ToListAsync(ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Asistencia>> Get(int id, CancellationToken ct)
    {
        var item = await _db.Asistencias.FindAsync([id], ct);
        if (item is null) return NotFound();
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null && !ids.Contains(item.IdEstudiante))
            return NotFound();
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<Asistencia>> Create([FromBody] Asistencia model, CancellationToken ct)
    {
        model.IdAsistencia = 0;
        _db.Asistencias.Add(model);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = model.IdAsistencia }, model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<Asistencia>> Update(int id, [FromBody] Asistencia model, CancellationToken ct)
    {
        var entity = await _db.Asistencias.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.IdEstudiante = model.IdEstudiante;
        entity.IdMateria = model.IdMateria;
        entity.Fecha = model.Fecha;
        entity.Estado = model.Estado;
        entity.Observaciones = model.Observaciones;
        await _db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Asistencias.FindAsync([id], ct);
        if (entity is null) return NotFound();
        _db.Asistencias.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class PagosController : ControllerBase
{
    private readonly ColegioDbContext _db;
    private readonly IAlcanceEstudiante _alcance;
    public PagosController(ColegioDbContext db, IAlcanceEstudiante alcance)
    {
        _db = db;
        _alcance = alcance;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Pago>>> GetAll(CancellationToken ct)
    {
        var query = _db.Pagos.AsNoTracking().AsQueryable();
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null)
            query = query.Where(x => ids.Contains(x.IdEstudiante));
        return Ok(await query.OrderByDescending(x => x.FechaEmision).ToListAsync(ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Pago>> Get(int id, CancellationToken ct)
    {
        var item = await _db.Pagos.FindAsync([id], ct);
        if (item is null) return NotFound();
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null && !ids.Contains(item.IdEstudiante))
            return NotFound();
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<Pago>> Create([FromBody] Pago model, CancellationToken ct)
    {
        model.IdPagos = 0;
        if (string.IsNullOrWhiteSpace(model.Estado)) model.Estado = "pendiente";
        _db.Pagos.Add(model);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = model.IdPagos }, model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<Pago>> Update(int id, [FromBody] Pago model, CancellationToken ct)
    {
        var entity = await _db.Pagos.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.IdEstudiante = model.IdEstudiante;
        entity.Concepto = model.Concepto;
        entity.Monto = model.Monto;
        entity.FechaEmision = model.FechaEmision;
        entity.FechaDeVencimiento = model.FechaDeVencimiento;
        entity.FechaPago = model.FechaPago;
        entity.Estado = model.Estado;
        entity.MetodoDePago = model.MetodoDePago;
        await _db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Pagos.FindAsync([id], ct);
        if (entity is null) return NotFound();
        _db.Pagos.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

