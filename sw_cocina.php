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
        case 'getPedidos':
            getPedidos($db, $data);
            break;

        case 'updateFechaRecogida':
            updateFechaRecogida($db, $data);
            break;

        case 'getHistoricoPedidosCocina':
            getHistoricoPedidosCocina($db, $data);
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

function getPedidos($db, $data){
    $query = "
        SELECT 
            a.nombre AS alumno, 
            b.nombre_bocadillo AS bocadillo, 
            p.precio_pedido, 
            p.fecha, 
            p.fecha_recogida 
        FROM pedidos p
        JOIN alumno a ON p.id_alumno_bocadillo = a.nombre
        JOIN bocadillo b ON p.id_bocadillo_pedido = b.nombre_bocadillo where p.fecha = date(now())
        ORDER BY p.fecha_recogida ASC";
    $stmt = $db->query($query);
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'pedidos' => $pedidos
    ]);
}

function updateFechaRecogida($db, $data){
    $alumno = $data['alumno'] ?? null;
    $fecha = $data['fecha'] ?? null;

    if (!$alumno || !$fecha) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios: alumno y/o fecha.',
        ]);
        exit;
    }

    // Actualizar la fecha_recogida a la fecha actual para el pedido correspondiente
    $stmt = $db->prepare("UPDATE pedidos SET fecha_recogida = date(NOW()) WHERE id_alumno_bocadillo = :alumno AND fecha = :fecha");
    $stmt->bindParam(':alumno', $alumno);
    $stmt->bindParam(':fecha', $fecha);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Fecha de recogida actualizada.',
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar la fecha de recogida.',
        ]);
    }
}

function getHistoricoPedidosCocina($db, $data){
    $query = "
        SELECT 
            a.nombre AS alumno, 
            a.id_curso_alumno AS curso,
            b.nombre_bocadillo AS bocadillo, 
            b.tipo_bocadillo AS tipo,
            p.precio_pedido, 
            p.fecha, 
            p.fecha_recogida 
        FROM pedidos p
        JOIN alumno a ON p.id_alumno_bocadillo = a.nombre
        JOIN bocadillo b ON p.id_bocadillo_pedido = b.nombre_bocadillo
        ORDER BY p.fecha DESC";
    $stmt = $db->query($query);
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'pedidos' => $pedidos
    ]);
}
?>