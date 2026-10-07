using ColegioApp.Domain.Entities;
using ColegioApp.Domain.Ports;
using ColegioApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ColegioApp.Infrastructure.Repositories;

public class AlumnoRepository : IAlumnoRepository
{
    private readonly ColegioDbContext _db;

    public AlumnoRepository(ColegioDbContext db) => _db = db;

    public async Task<IReadOnlyList<Alumno>> GetAllAsync(CancellationToken ct = default)
        => await _db.Alumnos.AsNoTracking().OrderBy(a => a.Apellido).ToListAsync(ct);

    public Task<Alumno?> GetByIdAsync(int id, CancellationToken ct = default)
        => _db.Alumnos.FirstOrDefaultAsync(a => a.IdAlumnos == id, ct);

    public async Task<Alumno> AddAsync(Alumno alumno, CancellationToken ct = default)
    {
        _db.Alumnos.Add(alumno);
        await _db.SaveChangesAsync(ct);
        return alumno;
    }

    public async Task UpdateAsync(Alumno alumno, CancellationToken ct = default)
    {
        _db.Alumnos.Update(alumno);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Alumnos.FindAsync([id], ct);
        if (entity is null) return;
        _db.Alumnos.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}

public class UsuarioRepository : IUsuarioRepository
{
    private readonly ColegioDbContext _db;

    public UsuarioRepository(ColegioDbContext db) => _db = db;

    public Task<Usuario?> GetByUsernameAsync(string username, CancellationToken ct = default)
        => _db.Usuarios.AsNoTracking()
            .FirstOrDefaultAsync(u => u.NombreDeUsuario == username, ct);

    public async Task<IReadOnlyList<string>> GetVistaCodigosByRolAsync(string rol, CancellationToken ct = default)
    {
        if (string.Equals(rol, AccesoCatalogo.RolAdmin, StringComparison.OrdinalIgnoreCase))
        {
            return await _db.Vistas.AsNoTracking()
                .OrderBy(v => v.Orden)
                .Select(v => v.Codigo)
                .ToListAsync(ct);
        }

        var codigos = await (
            from rv in _db.RolVistas.AsNoTracking()
            join r in _db.Roles.AsNoTracking() on rv.IdRol equals r.IdRoles
            join v in _db.Vistas.AsNoTracking() on rv.IdVista equals v.IdVistas
            where r.Codigo == rol && r.Activo
            orderby v.Orden
            select v.Codigo
        ).ToListAsync(ct);
        return codigos;
    }
}
