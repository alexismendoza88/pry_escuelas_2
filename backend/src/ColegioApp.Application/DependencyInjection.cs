using AutoMapper;
using ColegioApp.Application.DTOs;
using ColegioApp.Application.Services;
using ColegioApp.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;

namespace ColegioApp.Application;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Alumno, AlumnoDto>()
            .ForMember(d => d.Id, o => o.MapFrom(s => s.IdAlumnos));
    }
}

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(MappingProfile));
        services.AddScoped<AuthService>();
        services.AddScoped<AlumnoService>();
        return services;
    }
}
