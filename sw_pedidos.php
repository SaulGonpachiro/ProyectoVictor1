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
        case 'listarPedidos':
            listarPedidos($db);
            break;

        case 'crearPedido':
            crearPedido($db, $data);
            break;

        case 'actualizarPedido':
            actualizarPedido($db, $data);
            break;

        case 'eliminarPedido':
            eliminarPedido($db, $data);
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

/* ==============================
   FUNCIONES CRUD PEDIDOS
   ============================== */

function listarPedidos($db) {
    $stmt = $db->prepare("
        SELECT id_pedido,
               id_alumno_bocadillo,
               id_bocadillo_pedido,
               precio_pedido,
               fecha,
               fecha_recogida
        FROM pedidos
        ORDER BY fecha DESC, id_pedido DESC
    ");
    $stmt->execute();
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'pedidos' => $pedidos,
    ]);
}

function crearPedido($db, $data) {
    $alumno   = $data['id_alumno_bocadillo'] ?? null;
    $bocadillo= $data['id_bocadillo_pedido'] ?? null;
    $precio   = $data['precio_pedido'] ?? null;
    $fecha    = $data['fecha'] ?? null;
    $fechaRec = $data['fecha_recogida'] ?? null;

    if (!$alumno || !$bocadillo || !$precio || !$fecha) {
        echo json_encode([
            'success' => false,
            'message' => 'Alumno, bocadillo, precio y fecha son obligatorios.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO pedidos
                (id_alumno_bocadillo, id_bocadillo_pedido, precio_pedido, fecha, fecha_recogida)
            VALUES
                (:alumno, :bocadillo, :precio, :fecha, :fecha_recogida)
        ");

        $stmt->execute([
            ':alumno'         => $alumno,
            ':bocadillo'      => $bocadillo,
            ':precio'         => $precio,
            ':fecha'          => $fecha,
            ':fecha_recogida' => $fechaRec ?: null,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Pedido creado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear pedido: ' . $e->getMessage(),
        ]);
    }
}

function actualizarPedido($db, $data) {
    $idOriginal = $data['id_pedido_original'] ?? null;
    $alumno     = $data['id_alumno_bocadillo'] ?? null;
    $bocadillo  = $data['id_bocadillo_pedido'] ?? null;
    $precio     = $data['precio_pedido'] ?? null;
    $fecha      = $data['fecha'] ?? null;
    $fechaRec   = $data['fecha_recogida'] ?? null;

    if (!$idOriginal) {
        echo json_encode([
            'success' => false,
            'message' => 'Falta el ID del pedido a actualizar.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("
            UPDATE pedidos
               SET id_alumno_bocadillo = :alumno,
                   id_bocadillo_pedido = :bocadillo,
                   precio_pedido       = :precio,
                   fecha               = :fecha,
                   fecha_recogida      = :fecha_recogida
             WHERE id_pedido          = :id_pedido
        ");

        $stmt->execute([
            ':alumno'         => $alumno,
            ':bocadillo'      => $bocadillo,
            ':precio'         => $precio,
            ':fecha'          => $fecha,
            ':fecha_recogida' => $fechaRec ?: null,
            ':id_pedido'      => $idOriginal,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Pedido actualizado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar pedido: ' . $e->getMessage(),
        ]);
    }
}

function eliminarPedido($db, $data) {
    $id = $data['id_pedido'] ?? null;

    if (!$id) {
        echo json_encode([
            'success' => false,
            'message' => 'Falta el ID del pedido.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("
            DELETE FROM pedidos
             WHERE id_pedido = :id
        ");
        $stmt->execute([':id' => $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Pedido eliminado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar pedido: ' . $e->getMessage(),
        ]);
    }
}

?>
