-- Datos de prueba COLEGIO_APPCOL
-- Contraseña de todos los usuarios seed: Password123!
-- Hash BCrypt generado para la API (.NET / BCrypt.Net)

USE COLEGIO_APPCOL;

INSERT INTO Profesores (idPROFESORES, NOMBRE, APELLIDO, CORREO, TELEFONO, ESPECIALIDAD) VALUES
(1, 'Laura', 'Gómez', 'laura.gomez@colegio.edu', '3001112233', 'Matemáticas'),
(2, 'Carlos', 'Ruiz', 'carlos.ruiz@colegio.edu', '3002223344', 'Lengua'),
(3, 'Ana', 'Pérez', 'ana.perez@colegio.edu', '3003334455', 'Ciencias');

INSERT INTO Alumnos (idAlumnos, NOMBRE, APELLIDO, FECHA_NACIMIENTO, DIRECCION, TELEFONO, GRADO_ACTUAL, NOMBRE_ACUDIENTE, TELEFONO_ACUDIENTE, ANO_ACTUAL) VALUES
(1, 'Juan', 'Martínez', '2012-03-15', 'Calle 10 #5-20', '3101112233', '6A', 'María Martínez', '3109998877', '2026'),
(2, 'Sofía', 'López', '2011-07-22', 'Carrera 8 #12-40', '3102223344', '7B', 'Pedro López', '3108887766', '2026'),
(3, 'Andrés', 'Ramírez', '2013-01-08', 'Av. 3 #45-10', '3103334455', '5A', 'Lucía Ramírez', '3107776655', '2026'),
(4, 'Valentina', 'Torres', '2010-11-30', 'Calle 22 #8-15', '3104445566', '8A', 'Diego Torres', '3106665544', '2026'),
(5, 'Mateo', 'Castro', '2012-05-19', 'Carrera 15 #30-02', '3105556677', '6A', 'Elena Castro', '3105554433', '2026');

INSERT INTO Curso (idCurso, Grado, Jornada, Nivel, Capacidad) VALUES
(1, '5A', 'Mañana', 'Primaria', 30),
(2, '6A', 'Mañana', 'Secundaria', 35),
(3, '7B', 'Tarde', 'Secundaria', 35),
(4, '8A', 'Mañana', 'Secundaria', 32);

INSERT INTO Materia (idMateria, Codigo, Nombre, ID_Profesor) VALUES
(1, 'MAT-601', 'Matemáticas 6', 1),
(2, 'LEN-601', 'Lengua Castellana 6', 2),
(3, 'CIE-701', 'Ciencias Naturales 7', 3),
(4, 'MAT-801', 'Matemáticas 8', 1),
(5, 'LEN-501', 'Lengua Castellana 5', 2);

INSERT INTO Matriculas (idMatriculas, ID_Estudiante, ID_Grado, Anio, Estado) VALUES
(1, 1, 2, 2026, 'activa'),
(2, 2, 3, 2026, 'activa'),
(3, 3, 1, 2026, 'activa'),
(4, 4, 4, 2026, 'activa'),
(5, 5, 2, 2026, 'activa');

INSERT INTO Horarios (idHorarios, ID_Materia, ID_Profesor, ID_Curso, Dia, Hora_Inicio, Hora_Final) VALUES
(1, 1, 1, 2, 'Lunes', '07:00:00', '08:00:00'),
(2, 2, 2, 2, 'Martes', '08:00:00', '09:00:00'),
(3, 3, 3, 3, 'Miércoles', '09:00:00', '10:00:00'),
(4, 4, 1, 4, 'Jueves', '07:00:00', '08:30:00'),
(5, 5, 2, 1, 'Viernes', '10:00:00', '11:00:00');

INSERT INTO Notas (idNotas, ID_Estudiante, ID_Materia, Periodo, Valor, Observaciones) VALUES
(1, 1, 1, 'P1', 4.5, 'Excelente participación'),
(2, 1, 2, 'P1', 4.0, NULL),
(3, 2, 3, 'P1', 3.8, 'Mejorar laboratorio'),
(4, 4, 4, 'P1', 4.2, NULL),
(5, 5, 1, 'P1', 3.5, 'Refuerzo recomendado'),
(6, 3, 5, 'P1', 4.7, 'Muy buen trabajo');

INSERT INTO Asistencia (idAsistencia, ID_Estudiante, ID_Materia, Fecha, Estado, Observaciones) VALUES
(1, 1, 1, '2026-07-20', 'presente', NULL),
(2, 1, 2, '2026-07-21', 'presente', NULL),
(3, 2, 3, '2026-07-22', 'tarde', 'Llegó 10 minutos tarde'),
(4, 5, 1, '2026-07-20', 'ausente', 'Incapacidad médica'),
(5, 4, 4, '2026-07-23', 'presente', NULL),
(6, 3, 5, '2026-07-24', 'presente', NULL);

INSERT INTO Pagos (idPagos, ID_Estudiante, Concepto, Monto, Fecha_Emision, Fecha_de_Vencimiento, Fecha_Pago, Estado, Metodo_de_Pago) VALUES
(1, 1, 'Pensión Julio 2026', 350000.00, '2026-07-01', '2026-07-15', '2026-07-10', 'pagado', 'transferencia'),
(2, 2, 'Pensión Julio 2026', 350000.00, '2026-07-01', '2026-07-15', NULL, 'pendiente', NULL),
(3, 3, 'Matrícula 2026', 500000.00, '2026-01-10', '2026-01-31', '2026-01-20', 'pagado', 'efectivo'),
(4, 4, 'Pensión Julio 2026', 350000.00, '2026-07-01', '2026-07-15', '2026-07-12', 'pagado', 'tarjeta'),
(5, 5, 'Pensión Julio 2026', 350000.00, '2026-07-01', '2026-07-15', NULL, 'vencido', NULL);

-- Password123! → BCrypt (cost 11)
INSERT INTO Usuarios (idUsuarios, Nombre_de_Usuario, ContrasenaHash, Rol, ID_Persona, Activo) VALUES
(1, 'admin', '$2b$11$dmO5EZr2mKlTKXc/DbgEZOhsWYCToY/eNnj79fvgmu8GCDiBYjhNq', 'admin', NULL, 1),
(2, 'laura.gomez', '$2b$11$dmO5EZr2mKlTKXc/DbgEZOhsWYCToY/eNnj79fvgmu8GCDiBYjhNq', 'profesor', 1, 1),
(3, 'carlos.ruiz', '$2b$11$dmO5EZr2mKlTKXc/DbgEZOhsWYCToY/eNnj79fvgmu8GCDiBYjhNq', 'profesor', 2, 1),
(4, 'juan.martinez', '$2b$11$dmO5EZr2mKlTKXc/DbgEZOhsWYCToY/eNnj79fvgmu8GCDiBYjhNq', 'alumno', 1, 1),
(5, 'sofia.lopez', '$2b$11$dmO5EZr2mKlTKXc/DbgEZOhsWYCToY/eNnj79fvgmu8GCDiBYjhNq', 'alumno', 2, 1);
