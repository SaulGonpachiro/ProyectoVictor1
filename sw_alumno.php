<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

session_start();
require 'Conexion.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? null;

    if (!$action) {
        echo json_encode([
            'success' => false,
            'message' => 'No se especificó ninguna acción.',
        ]);
        exit;
    }

    $db = DB::getInstance();

    switch ($action) {
        case 'getSaldoAlumno':
            getSaldoAlumno($db, $data);
            break;

        case 'getBocadillosAlumno':
            getBocadillosAlumno($db, $data);
            break;

        case 'hacerPedido':
            hacerPedido($db, $data);
            break;

        case 'getHistoricoPedidosAlumno':
            getHistoricoPedidosAlumno($db, $data);
            break;

        // === ACCIONES CRUD ALUMNOS PARA ADMIN ===
        case 'listarAlumnos':
            listarAlumnos($db);
            break;

        case 'crearAlumno':
            crearAlumno($db, $data);
            break;

        case 'actualizarAlumno':
            actualizarAlumno($db, $data);
            break;

        case 'eliminarAlumno':
            eliminarAlumno($db, $data);
            break;

        default:
            echo json_encode([
                'success' => false,
                'message' => 'Acción no reconocida.',
            ]);
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor: ' . $e->getMessage(),
    ]);
}

// ========== FUNCIONES CRUD ALUMNOS (ADMIN) ==========

function listarAlumnos($db) {
    $stmt = $db->prepare("SELECT nombre, id_email_usuario, monedero, id_curso_alumno FROM alumno ORDER BY nombre");
    $stmt->execute();
    $alumnos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'alumnos' => $alumnos,
    ]);
}

function crearAlumno($db, $data) {
    $nombre = $data['nombre'] ?? null;
    $email = $data['id_email_usuario'] ?? null;
    $monedero = $data['monedero'] ?? 0;
    $curso = $data['id_curso_alumno'] ?? null;

    if (!$nombre || !$email) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos obligatorios: nombre o email.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("INSERT INTO alumno (nombre, id_email_usuario, monedero, id_curso_alumno)
                              VALUES (:nombre, :email, :monedero, :curso)");
        $stmt->execute([
            ':nombre'   => $nombre,
            ':email'    => $email,
            ':monedero' => $monedero,
            ':curso'    => $curso,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Alumno creado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear alumno: ' . $e->getMessage(),
        ]);
    }
}

function actualizarAlumno($db, $data) {
    $nombreOriginal = $data['nombre_original'] ?? null;
    $nombre = $data['nombre'] ?? null;
    $email = $data['id_email_usuario'] ?? null;
    $monedero = $data['monedero'] ?? 0;
    $curso = $data['id_curso_alumno'] ?? null;

    if (!$nombreOriginal) {
        echo json_encode([
            'success' => false,
            'message' => 'Falta el nombre original del alumno.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("UPDATE alumno
                              SET nombre = :nombre,
                                  id_email_usuario = :email,
                                  monedero = :monedero,
                                  id_curso_alumno = :curso
                              WHERE nombre = :nombre_original");
        $stmt->execute([
            ':nombre'          => $nombre,
            ':email'           => $email,
            ':monedero'        => $monedero,
            ':curso'           => $curso,
            ':nombre_original' => $nombreOriginal,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Alumno actualizado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar alumno: ' . $e->getMessage(),
        ]);
    }
}

function eliminarAlumno($db, $data) {
    $nombre = $data['nombre'] ?? null;

    if (!$nombre) {
        echo json_encode([
            'success' => false,
            'message' => 'Falta el nombre del alumno.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("DELETE FROM alumno WHERE nombre = :nombre");
        $stmt->execute([':nombre' => $nombre]);

        echo json_encode([
            'success' => true,
            'message' => 'Alumno eliminado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar alumno: ' . $e->getMessage(),
        ]);
    }
}

// ========== FUNCIONES EXISTENTES ==========

function getSaldoAlumno($db, $data) {
    $alumno = $data['alumno'] ?? null;

    if (!$alumno) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios: alumno.',
        ]);
        return;
    }

    $query = "SELECT monedero FROM alumno WHERE nombre = :alumno";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':alumno', $alumno, PDO::PARAM_STR);
    $stmt->execute();

    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resultado) {
        $saldo = floatval($resultado['monedero']);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Alumno no encontrado.',
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'saldo' => $saldo,
    ]);
}

function getBocadillosAlumno($db, $data) {
    $alumno = $data['alumno'] ?? null;

    if (!$alumno) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios: alumno.',
        ]);
        return;
    }

    $queryBocadillos = "
        SELECT nombre_bocadillo, ingredientes, tipo_bocadillo, precio_venta_publico, alergenos 
        FROM bocadillo 
        WHERE dia_semana = dayname(now())";
    $stmtBocadillos = $db->prepare($queryBocadillos);
    $stmtBocadillos->execute();

    $bocadillos = $stmtBocadillos->fetchAll(PDO::FETCH_ASSOC);

    if (!$bocadillos) {
        echo json_encode([
            'success' => false,
            'message' => 'No hay bocadillos disponibles para hoy.',
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'bocadillos' => $bocadillos
    ]);
}

function hacerPedido($db, $data) {
    $alumno = $data['alumno'] ?? null;
    $bocadillo = $data['bocadillo'] ?? null;
    $precio = $data['precio'] ?? null;

    if (!$alumno || !$bocadillo || !$precio) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios para realizar el pedido.',
        ]);
        exit;
    }

    $horaActual = new DateTime('now', new DateTimeZone('Europe/Madrid'));
    $horaInicio = new DateTime('09:00', new DateTimeZone('Europe/Madrid'));
    $horaFin = new DateTime('20:00', new DateTimeZone('Europe/Madrid'));

    if ($horaActual < $horaInicio || $horaActual > $horaFin) {
        echo json_encode([
            'success' => false,
            'message' => 'Los pedidos solo pueden realizarse entre las 9:00 y las 11:00.',
        ]);
        exit;
    }

    $db = DB::getInstance();

    // Verificar el saldo del alumno
    $querySaldo = "SELECT monedero FROM alumno WHERE nombre = :alumno";
    $stmtSaldo = $db->prepare($querySaldo);
    $stmtSaldo->bindParam(':alumno', $alumno, PDO::PARAM_STR);
    $stmtSaldo->execute();

    $resultadoSaldo = $stmtSaldo->fetch(PDO::FETCH_ASSOC);

    if (!$resultadoSaldo) {
        echo json_encode([
            'success' => false,
            'message' => 'No se encontró el alumno especificado.',
        ]);
        exit;
    }

    $saldoActual = floatval($resultadoSaldo['monedero']);

    // Verificar si el saldo es suficiente
    if ($saldoActual < $precio) {
        echo json_encode([
            'success' => false,
            'message' => 'Saldo insuficiente para realizar el pedido.',
        ]);
        exit;
    }

    $db->beginTransaction();

    try {
        // Insertar el pedido
        $queryInsert = "
            INSERT INTO pedidos (id_alumno_bocadillo, id_bocadillo_pedido, precio_pedido, fecha)
            VALUES (:alumno, :bocadillo, :precio, NOW())
        ";
        $stmtInsert = $db->prepare($queryInsert);

        $stmtInsert->bindParam(':alumno', $alumno, PDO::PARAM_STR);
        $stmtInsert->bindParam(':bocadillo', $bocadillo, PDO::PARAM_STR);
        $stmtInsert->bindParam(':precio', $precio, PDO::PARAM_STR);

        $stmtInsert->execute();

        // Actualizar el saldo del alumno
        $queryUpdateSaldo = "
            UPDATE alumno 
            SET monedero = monedero - :precio
            WHERE nombre = :alumno
        ";
        $stmtUpdateSaldo = $db->prepare($queryUpdateSaldo);
        $stmtUpdateSaldo->bindParam(':precio', $precio, PDO::PARAM_STR);
        $stmtUpdateSaldo->bindParam(':alumno', $alumno, PDO::PARAM_STR);

        $stmtUpdateSaldo->execute();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Pedido realizado con éxito y saldo actualizado.',
        ]);
    } catch (PDOException $e) {
        $db->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'Error al realizar el pedido: ' . $e->getMessage(),
        ]);
    }
}

function getHistoricoPedidosAlumno($db, $data) {
    $alumno = $data['alumno'] ?? null;

    if (!$alumno) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios: alumno.',
        ]);
        return;
    }

    // Consulta SQL para obtener los pedidos del alumno, incluyendo nombre de bocadillo y precio
    $query = "
        SELECT 
            p.id_pedido,
            p.fecha,
            p.fecha_recogida,
            p.precio_pedido,
            b.nombre_bocadillo,
            b.tipo_bocadillo
        FROM 
            pedidos p
        JOIN 
            bocadillo b ON p.id_bocadillo_pedido = b.nombre_bocadillo
        WHERE 
            p.id_alumno_bocadillo = :alumno
        ORDER BY 
            p.fecha DESC
    ";

    // Preparar la consulta SQL
    $stmt = $db->prepare($query);

    // Vincular el parámetro al valor del nombre del alumno
    $stmt->bindParam(':alumno', $alumno, PDO::PARAM_STR);

    // Ejecutar la consulta
    $stmt->execute();

    // Obtener los resultados
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'pedidos' => $pedidos
    ]);
}

?>
