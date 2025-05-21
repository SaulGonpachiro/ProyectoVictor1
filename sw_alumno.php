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
            'message' => 'Acción no especificada.',
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
    $stmt->bindParam(':alumno', $alumno);
    $stmt->execute();

    $saldo = $stmt->fetchColumn();

    if ($saldo === false) {
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

    $queryPedido = "
        SELECT id_bocadillo_pedido 
        FROM pedidos 
        WHERE id_alumno_bocadillo = :alumno AND fecha = date(now())";
    $stmtPedido = $db->prepare($queryPedido);
    $stmtPedido->bindParam(':alumno', $alumno);
    $stmtPedido->execute();
    $pedido = $stmtPedido->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'bocadillos' => $bocadillos,
        'pedido_actual' => $pedido['id_bocadillo_pedido'] ?? null,
    ]);
}

function hacerPedido($db, $data) {
    $alumno = $data['alumno'] ?? null;
    $bocadillo = $data['bocadillo'] ?? null;

    if (!$alumno || !$bocadillo) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios: alumno y/o bocadillo.',
        ]);
        exit;
    }

    // Obtener la hora actual
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
    $stmtSaldo->bindParam(':alumno', $alumno);
    $stmtSaldo->execute();
    $saldo = $stmtSaldo->fetchColumn();

    if ($saldo === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Alumno no encontrado.',
        ]);
        exit;
    }

    // Obtener el precio del bocadillo nuevo
    $queryPrecioNuevo = "SELECT precio_venta_publico FROM bocadillo WHERE nombre_bocadillo = :bocadillo";
    $stmtPrecioNuevo = $db->prepare($queryPrecioNuevo);
    $stmtPrecioNuevo->bindParam(':bocadillo', $bocadillo);
    $stmtPrecioNuevo->execute();
    $precioNuevo = $stmtPrecioNuevo->fetchColumn();

    if ($precioNuevo === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Bocadillo no encontrado.',
        ]);
        exit;
    }

    // Verificar si el alumno ya tiene un pedido para hoy
    $queryCheck = "SELECT id_bocadillo_pedido FROM pedidos WHERE id_alumno_bocadillo = :alumno AND fecha = date(now())";
    $stmtCheck = $db->prepare($queryCheck);
    $stmtCheck->bindParam(':alumno', $alumno);
    $stmtCheck->execute();
    $pedidoExistente = $stmtCheck->fetchColumn();

    if ($pedidoExistente) {
        // Obtener el precio del bocadillo antiguo
        $queryPrecioAntiguo = "SELECT precio_venta_publico FROM bocadillo WHERE nombre_bocadillo = :bocadillo";
        $stmtPrecioAntiguo = $db->prepare($queryPrecioAntiguo);
        $stmtPrecioAntiguo->bindParam(':bocadillo', $pedidoExistente);
        $stmtPrecioAntiguo->execute();
        $precioAntiguo = $stmtPrecioAntiguo->fetchColumn();

        // Actualizar saldo (devolver precio antiguo y cobrar precio nuevo)
        $nuevoSaldo = $saldo + $precioAntiguo - $precioNuevo;
    } else {
        // Cobrar precio nuevo
        $nuevoSaldo = $saldo - $precioNuevo;
    }

    if ($nuevoSaldo < 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Saldo insuficiente en el monedero.',
        ]);
        exit;
    }

    // Actualizar el saldo del alumno
    $queryUpdateSaldo = "UPDATE alumno SET monedero = :nuevoSaldo WHERE nombre = :alumno";
    $stmtUpdateSaldo = $db->prepare($queryUpdateSaldo);
    $stmtUpdateSaldo->bindParam(':nuevoSaldo', $nuevoSaldo);
    $stmtUpdateSaldo->bindParam(':alumno', $alumno);
    $stmtUpdateSaldo->execute();

    if ($pedidoExistente) {
        // Actualizar el pedido existente
        $queryUpdatePedido = "
            UPDATE pedidos 
            SET id_bocadillo_pedido = :bocadillo, precio_pedido = :precioNuevo
            WHERE id_alumno_bocadillo = :alumno AND fecha = date(now())";
        $stmtUpdatePedido = $db->prepare($queryUpdatePedido);
        $stmtUpdatePedido->bindParam(':bocadillo', $bocadillo);
        $stmtUpdatePedido->bindParam(':precioNuevo', $precioNuevo);
        $stmtUpdatePedido->bindParam(':alumno', $alumno);
        $stmtUpdatePedido->execute();
    } else {
        // Insertar un nuevo pedido
        $queryInsertPedido = "
            INSERT INTO pedidos (id_alumno_bocadillo, id_bocadillo_pedido, precio_pedido, fecha) 
            VALUES (:alumno, :bocadillo, :precioNuevo, date(now()))";
        $stmtInsertPedido = $db->prepare($queryInsertPedido);
        $stmtInsertPedido->bindParam(':alumno', $alumno);
        $stmtInsertPedido->bindParam(':bocadillo', $bocadillo);
        $stmtInsertPedido->bindParam(':precioNuevo', $precioNuevo);
        $stmtInsertPedido->execute();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Pedido realizado y saldo actualizado con éxito.',
    ]);
}


function getHistoricoPedidosAlumno($db, $data){
    $alumno = $data['alumno'] ?? null;

    if (!$alumno) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos: alumno.',
        ]);
        exit;
    }

    $db = DB::getInstance();
    $query = "
        SELECT 
            a.nombre AS alumno, 
            b.nombre_bocadillo AS bocadillo,
            b.tipo_bocadillo AS tipo, 
            p.precio_pedido, 
            p.fecha, 
            p.fecha_recogida 
        FROM pedidos p
        JOIN alumno a ON p.id_alumno_bocadillo = a.nombre
        JOIN bocadillo b ON p.id_bocadillo_pedido = b.nombre_bocadillo 
        WHERE a.nombre = :alumno
        ORDER BY p.fecha DESC
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
