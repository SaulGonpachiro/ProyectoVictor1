<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

session_start();
require 'Conexion.php';

try {
    // Datos enviados en JSON
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

        case 'listarBocadillos':
            listarBocadillos($db);
            break;

        case 'crearBocadillo':
            crearBocadillo($db, $data);
            break;

        case 'actualizarBocadillo':
            actualizarBocadillo($db, $data);
            break;

        case 'eliminarBocadillo':
            eliminarBocadillo($db, $data);
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
   FUNCIONES CRUD BOCADILLOS
   ============================== */

function listarBocadillos($db) {
    $stmt = $db->prepare("
        SELECT nombre_bocadillo,
               ingredientes,
               tipo_bocadillo,
               precio_venta_publico,
               alergenos,
               dia_semana
        FROM bocadillo
        ORDER BY nombre_bocadillo
    ");
    $stmt->execute();
    $bocadillos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'     => true,
        'bocadillos'  => $bocadillos,
    ]);
}

function crearBocadillo($db, $data) {
    $nombre      = $data['nombre_bocadillo']      ?? null;
    $ingredientes= $data['ingredientes']          ?? null;
    $tipo        = $data['tipo_bocadillo']        ?? null;
    $precio      = $data['precio_venta_publico']  ?? null;
    $alergenos   = $data['alergenos']             ?? null;
    $dia         = $data['dia_semana']            ?? null;

    if (!$nombre || !$precio || !$dia) {
        echo json_encode([
            'success' => false,
            'message' => 'Nombre, precio y día de la semana son obligatorios.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO bocadillo
                (nombre_bocadillo, ingredientes, tipo_bocadillo,
                 precio_venta_publico, alergenos, dia_semana)
            VALUES
                (:nombre, :ingredientes, :tipo, :precio, :alergenos, :dia)
        ");

        $stmt->execute([
            ':nombre'       => $nombre,
            ':ingredientes' => $ingredientes,
            ':tipo'         => $tipo,
            ':precio'       => $precio,
            ':alergenos'    => $alergenos,
            ':dia'          => $dia,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Bocadillo creado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear bocadillo: ' . $e->getMessage(),
        ]);
    }
}

function actualizarBocadillo($db, $data) {
    $nombreOriginal = $data['nombre_original']     ?? null;
    $nombre         = $data['nombre_bocadillo']    ?? null;
    $ingredientes   = $data['ingredientes']        ?? null;
    $tipo           = $data['tipo_bocadillo']      ?? null;
    $precio         = $data['precio_venta_publico']?? null;
    $alergenos      = $data['alergenos']           ?? null;
    $dia            = $data['dia_semana']          ?? null;

    if (!$nombreOriginal) {
        echo json_encode([
            'success' => false,
            'message' => 'Falta el nombre original del bocadillo.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("
            UPDATE bocadillo
               SET nombre_bocadillo     = :nombre,
                   ingredientes         = :ingredientes,
                   tipo_bocadillo       = :tipo,
                   precio_venta_publico = :precio,
                   alergenos            = :alergenos,
                   dia_semana           = :dia
             WHERE nombre_bocadillo     = :nombre_original
        ");

        $stmt->execute([
            ':nombre'          => $nombre,
            ':ingredientes'    => $ingredientes,
            ':tipo'            => $tipo,
            ':precio'          => $precio,
            ':alergenos'       => $alergenos,
            ':dia'             => $dia,
            ':nombre_original' => $nombreOriginal,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Bocadillo actualizado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar bocadillo: ' . $e->getMessage(),
        ]);
    }
}

function eliminarBocadillo($db, $data) {
    $nombre = $data['nombre_bocadillo'] ?? null;

    if (!$nombre) {
        echo json_encode([
            'success' => false,
            'message' => 'Falta el nombre del bocadillo.',
        ]);
        return;
    }

    try {
        $stmt = $db->prepare("
            DELETE FROM bocadillo
             WHERE nombre_bocadillo = :nombre
        ");
        $stmt->execute([':nombre' => $nombre]);

        echo json_encode([
            'success' => true,
            'message' => 'Bocadillo eliminado correctamente.',
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar bocadillo: ' . $e->getMessage(),
        ]);
    }
}

?>
