using Npgsql;

var host = "localhost";
var port = 5432;
var user = "postgres";
var password = "pic103";
var dbName = "colegio_appcol";

var root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
// When run via `dotnet script` style from tools folder, prefer cwd-relative:
var projectRoot = Directory.GetCurrentDirectory();
if (!Directory.Exists(Path.Combine(projectRoot, "docker", "postgres", "init")))
{
    projectRoot = Path.GetFullPath(Path.Combine(projectRoot, ".."));
}

var schemaPath = Path.Combine(projectRoot, "docker", "postgres", "init", "01_schema.sql");
var seedPath = Path.Combine(projectRoot, "docker", "postgres", "init", "02_seed.sql");

static string ReadSql(string path)
{
    var bytes = File.ReadAllBytes(path);
    try { return System.Text.Encoding.UTF8.GetString(bytes); }
    catch { return System.Text.Encoding.GetEncoding(1252).GetString(bytes); }
}

Console.WriteLine($"DB_TARGET {dbName}");
Console.WriteLine($"ROOT {projectRoot}");

await using (var admin = new NpgsqlConnection($"Host={host};Port={port};Database=postgres;Username={user};Password={password}"))
{
    await admin.OpenAsync();
    Console.WriteLine("CONNECTED_OK");
    await using var check = new NpgsqlCommand("SELECT 1 FROM pg_database WHERE datname = @n", admin);
    check.Parameters.AddWithValue("n", dbName);
    var exists = await check.ExecuteScalarAsync() is not null;
    if (!exists)
    {
        await using var create = new NpgsqlCommand($"CREATE DATABASE {dbName} WITH ENCODING 'UTF8'", admin);
        await create.ExecuteNonQueryAsync();
        Console.WriteLine($"DB_CREATED {dbName}");
    }
    else
    {
        Console.WriteLine($"DB_EXISTS {dbName}");
    }
}

await using (var conn = new NpgsqlConnection($"Host={host};Port={port};Database={dbName};Username={user};Password={password}"))
{
    await conn.OpenAsync();
    foreach (var path in new[] { schemaPath, seedPath })
    {
        var sql = ReadSql(path);
        Console.WriteLine($"EXEC {Path.GetFileName(path)}");
        await using var cmd = new NpgsqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync();
    }

    await using (var c1 = new NpgsqlCommand("""SELECT COUNT(*) FROM "Alumnos" """, conn))
        Console.WriteLine($"ALUMNOS {await c1.ExecuteScalarAsync()}");
    await using (var c2 = new NpgsqlCommand("""SELECT COUNT(*) FROM "Usuarios" """, conn))
        Console.WriteLine($"USUARIOS {await c2.ExecuteScalarAsync()}");
    await using (var c3 = new NpgsqlCommand("""SELECT "Nombre_de_Usuario", "Rol" FROM "Usuarios" ORDER BY "idUsuarios" """, conn))
    await using (var r = await c3.ExecuteReaderAsync())
    {
        while (await r.ReadAsync())
            Console.WriteLine($"USER {r.GetString(0)} {r.GetString(1)}");
    }
}

Console.WriteLine("SEED_OK");
