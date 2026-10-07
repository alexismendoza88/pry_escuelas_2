using AutoMapper;
using ColegioApp.Application.DTOs;
using ColegioApp.Application.Services;
using ColegioApp.Domain.Ports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ColegioApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class AlumnosController : ControllerBase
{
    private readonly AlumnoService _service;
    private readonly IMapper _mapper;
    private readonly IAlcanceEstudiante _alcance;

    public AlumnosController(AlumnoService service, IMapper mapper, IAlcanceEstudiante alcance)
    {
        _service = service;
        _mapper = mapper;
        _alcance = alcance;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AlumnoDto>>> GetAll(CancellationToken ct)
    {
        var items = await _service.ListAsync(ct);
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null)
            items = items.Where(a => ids.Contains(a.IdAlumnos)).ToList();
        return Ok(_mapper.Map<IEnumerable<AlumnoDto>>(items));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AlumnoDto>> GetById(int id, CancellationToken ct)
    {
        var ids = await _alcance.ObtenerIdsAlumnosAsync(ct);
        if (ids is not null && !ids.Contains(id))
            return NotFound();
        var item = await _service.GetAsync(id, ct);
        if (item is null) return NotFound();
        return Ok(_mapper.Map<AlumnoDto>(item));
    }

    [HttpPost]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<AlumnoDto>> Create([FromBody] CreateAlumnoRequest request, CancellationToken ct)
    {
        var created = await _service.CreateAsync(request, ct);
        var dto = _mapper.Map<AlumnoDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,profesor")]
    public async Task<ActionResult<AlumnoDto>> Update(int id, [FromBody] UpdateAlumnoRequest request, CancellationToken ct)
    {
        var updated = await _service.UpdateAsync(id, request, ct);
        if (updated is null) return NotFound();
        return Ok(_mapper.Map<AlumnoDto>(updated));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
