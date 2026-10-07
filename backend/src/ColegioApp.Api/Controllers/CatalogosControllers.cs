using ColegioApp.Domain.Entities;
using ColegioApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ColegioApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class ProfesoresController : ControllerBase
{
    private readonly ColegioDbContext _db;
    public ProfesoresController(ColegioDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Profesor>>> GetAll(CancellationToken ct)
        => Ok(await _db.Profesores.AsNoTracking().OrderBy(x => x.Apellido).ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Profesor>> Get(int id, CancellationToken ct)
    {
        var item = await _db.Profesores.FindAsync([id], ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<Profesor>> Create([FromBody] Profesor model, CancellationToken ct)
    {
        model.IdProfesores = 0;
        _db.Profesores.Add(model);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = model.IdProfesores }, model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<Profesor>> Update(int id, [FromBody] Profesor model, CancellationToken ct)
    {
        var entity = await _db.Profesores.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.Nombre = model.Nombre;
        entity.Apellido = model.Apellido;
        entity.Correo = model.Correo;
        entity.Telefono = model.Telefono;
        entity.Especialidad = model.Especialidad;
        await _db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Profesores.FindAsync([id], ct);
        if (entity is null) return NotFound();
        _db.Profesores.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class CursosController : ControllerBase
{
    private readonly ColegioDbContext _db;
    public CursosController(ColegioDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Curso>>> GetAll(CancellationToken ct)
        => Ok(await _db.Cursos.AsNoTracking().OrderBy(x => x.Grado).ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Curso>> Get(int id, CancellationToken ct)
    {
        var item = await _db.Cursos.FindAsync([id], ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<Curso>> Create([FromBody] Curso model, CancellationToken ct)
    {
        model.IdCurso = 0;
        _db.Cursos.Add(model);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = model.IdCurso }, model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<Curso>> Update(int id, [FromBody] Curso model, CancellationToken ct)
    {
        var entity = await _db.Cursos.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.Grado = model.Grado;
        entity.Jornada = model.Jornada;
        entity.Nivel = model.Nivel;
        entity.Capacidad = model.Capacidad;
        await _db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Cursos.FindAsync([id], ct);
        if (entity is null) return NotFound();
        _db.Cursos.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class MateriasController : ControllerBase
{
    private readonly ColegioDbContext _db;
    public MateriasController(ColegioDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Materia>>> GetAll(CancellationToken ct)
        => Ok(await _db.Materias.AsNoTracking().OrderBy(x => x.Codigo).ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Materia>> Get(int id, CancellationToken ct)
    {
        var item = await _db.Materias.FindAsync([id], ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<Materia>> Create([FromBody] Materia model, CancellationToken ct)
    {
        model.IdMateria = 0;
        _db.Materias.Add(model);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = model.IdMateria }, model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<Materia>> Update(int id, [FromBody] Materia model, CancellationToken ct)
    {
        var entity = await _db.Materias.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.Codigo = model.Codigo;
        entity.Nombre = model.Nombre;
        entity.IdProfesor = model.IdProfesor;
        await _db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await _db.Materias.FindAsync([id], ct);
        if (entity is null) return NotFound();
        _db.Materias.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
