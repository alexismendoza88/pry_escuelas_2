# Frontend Angular — Colegio AppCol

## Requisitos
- Node 18+ (recomendado LTS)
- API .NET en `http://localhost:5026`

## Arranque

```bash
cd frontend
npm install
npm start
```

Abre http://localhost:4200

Login seed: `admin` / `Password123!`

## Funciones
- Angular Material (toolbar, sidenav, forms, autocomplete, tables)
- Login JWT + interceptor
- Módulos con **búsqueda**, **autocomplete** y **guardar**:
  - Alumnos, Profesores, Cursos, Materias, Matrículas, Pagos

## API
Configurada en `src/environments/environment.ts`:

```ts
apiUrl: 'http://localhost:5026/api/v1'
```
