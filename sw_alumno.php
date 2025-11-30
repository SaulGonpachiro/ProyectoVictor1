<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

session_start();
require 'Conexion.php';

try {
    $data   = json_decode(file_get_contents('php://input'), true);
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
        /* ====== ENDPOINTS CRUD ADMIN ALUMNOS ====== */

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

        /* ====== ENDPOINTS ALUMNO (FRONT PEDIR BOCADILLO) ====== */

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

/* ============================================================
   FUNCIONES CRUD ADMIN ALUMNOS
   ============================================================ */

function listarAlumnos($db)
{
    $sql = "SELECT nombre, id_email_usuario, monedero, id_curso_alumno
            FROM alumno
            ORDER BY nombre";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $alumnos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'alumnos' => $alumnos,
    ]);
}

/**
 * Crea un alumno y, si no existe, también un usuario asociado.
 * Password por defecto: '1234' (hash).
 */
function crearAlumno($db, $data)
{
    $nombre    = trim($data['nombre'] ?? '');
    $email     = trim($data['id_email_usuario'] ?? '');
    $monedero  = $data['monedero'] ?? 0;
    $curso     = trim($data['id_curso_alumno'] ?? '');

    if ($nombre === '' || $email === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Nombre y email son obligatorios.',
        ]);
        return;
    }

    $monedero = floatval(str_replace(',', '.', $monedero));

    try {
        $db->beginTransaction();

        // ¿Ya existe un alumno con ese nombre?
        $stmt = $db->prepare("SELECT COUNT(*) FROM alumno WHERE nombre = :nombre");
        $stmt->bindParam(':nombre', $nombre);
        $stmt->execute();
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Ya existe un alumno con ese nombre (PK).',
            ]);
            return;
        }

        // Comprobar si existe usuario con ese email
        $stmt = $db->prepare("SELECT COUNT(*) FROM usuario WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $existeUsuario = $stmt->fetchColumn() > 0;

        if (!$existeUsuario) {
            // Crear usuario básico para que respete la FK
            $passwordHash = password_hash('1234', PASSWORD_DEFAULT);
            $tipoUsuario  = 'alumnado';

            $stmt = $db->prepare("INSERT INTO usuario (email, password, tipo_usuario)
                                  VALUES (:email, :password, :tipo)");
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $passwordHash);
            $stmt->bindParam(':tipo', $tipoUsuario);
            $stmt->execute();
        }

        // Insertar alumno
        $sql = "INSERT INTO alumno (nombre, id_email_usuario, monedero, id_curso_alumno)
                VALUES (:nombre, :email, :monedero, :curso)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':monedero', $monedero);
        $stmt->bindParam(':curso', $curso);
        $stmt->execute();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Alumno creado correctamente.',
        ]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear alumno: ' . $e->getMessage(),
        ]);
    }
}

function actualizarAlumno($db, $data)
{
    $nombreOriginal = trim($data['nombre_original'] ?? '');
    $nombreNuevo    = trim($data['nombre'] ?? '');
    $emailNuevo     = trim($data['id_email_usuario'] ?? '');
    $monedero       = $data['monedero'] ?? 0;
    $curso          = trim($data['id_curso_alumno'] ?? '');

    if ($nombreOriginal === '' || $nombreNuevo === '' || $emailNuevo === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Nombre original, nombre y email son obligatorios.',
        ]);
        return;
    }

    $monedero = floatval(str_replace(',', '.', $monedero));

    try {
        $db->beginTransaction();

        // Obtenemos el email actual del alumno
        $stmt = $db->prepare("SELECT id_email_usuario FROM alumno WHERE nombre = :nombre");
        $stmt->bindParam(':nombre', $nombreOriginal);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $db->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Alumno no encontrado.',
            ]);
            return;
        }

        $emailActual = $row['id_email_usuario'];

        // Si cambia el email, actualizamos la tabla usuario (ON UPDATE CASCADE se encargará de alumno)
        if ($emailActual !== $emailNuevo) {
            // Comprobar si ya existe otro usuario con el nuevo email
            $stmt = $db->prepare("SELECT COUNT(*) FROM usuario WHERE email = :email");
            $stmt->bindParam(':email', $emailNuevo);
            $stmt->execute();
            if ($stmt->fetchColumn() > 0) {
                $db->rollBack();
                echo json_encode([
                    'success' => false,
                    'message' => 'Ya existe un usuario con ese email.',
                ]);
                return;
            }

            $stmt = $db->prepare("UPDATE usuario SET email = :nuevoEmail WHERE email = :viejoEmail");
            $stmt->bindParam(':nuevoEmail', $emailNuevo);
            $stmt->bindParam(':viejoEmail', $emailActual);
            $stmt->execute();
            // La FK alumno.id_email_usuario se actualiza sola por ON UPDATE CASCADE.
        }

        // Actualizar datos del alumno
        $sql = "UPDATE alumno
                SET nombre = :nombreNuevo,
                    monedero = :monedero,
                    id_curso_alumno = :curso
                WHERE nombre = :nombreOriginal";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':nombreNuevo', $nombreNuevo);
        $stmt->bindParam(':monedero', $monedero);
        $stmt->bindParam(':curso', $curso);
        $stmt->bindParam(':nombreOriginal', $nombreOriginal);
        $stmt->execute();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Alumno actualizado correctamente.',
        ]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar alumno: ' . $e->getMessage(),
        ]);
    }
}

function eliminarAlumno($db, $data)
{
    $nombre = trim($data['nombre'] ?? '');

    if ($nombre === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Nombre del alumno requerido.',
        ]);
        return;
    }

    try {
        $db->beginTransaction();

        // Conseguimos el email del alumno para borrar también el usuario
        $stmt = $db->prepare("SELECT id_email_usuario FROM alumno WHERE nombre = :nombre");
        $stmt->bindParam(':nombre', $nombre);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $db->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Alumno no encontrado.',
            ]);
            return;
        }

        $email = $row['id_email_usuario'];

        // Al borrar el usuario se borrará el alumno por ON DELETE CASCADE
        // y, a su vez, los pedidos por la FK de pedidos->alumno (también ON DELETE CASCADE).
        $stmt = $db->prepare("DELETE FROM usuario WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Alumno y usuario asociados eliminados correctamente.',
        ]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar alumno: ' . $e->getMessage(),
        ]);
    }
}

/* ============================================================
   FUNCIONES PARA EL ALUMNO (SALDO, BOCADILLOS, PEDIDOS)
   ============================================================ */

function getSaldoAlumno($db, $data)
{
    $alumno = $data['alumno'] ?? null;

    if (!$alumno) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios: alumno.',
        ]);
        return;
    }

    $query = "SELECT monedero FROM alumno WHERE nombre = :alumno";
    $stmt  = $db->prepare($query);
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
        'saldo'   => $saldo,
    ]);
}

function getBocadillosAlumno($db, $data)
{
    $alumno = $data['alumno'] ?? null;

    if (!$alumno) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios: alumno.',
        ]);
        return;
    }

    // Bocadillos disponibles hoy (mismo día de la semana)
    $queryBocadillos = "
        SELECT nombre_bocadillo, ingredientes, tipo_bocadillo,
               precio_venta_publico, alergenos
        FROM bocadillo
        WHERE dia_semana = dayname(now())";
    $stmtBocadillos = $db->prepare($queryBocadillos);
    $stmtBocadillos->execute();
    $bocadillos = $stmtBocadillos->fetchAll(PDO::FETCH_ASSOC);

    // Pedido actual del alumno (si lo hay)
    $queryPedido = "
        SELECT id_bocadillo_pedido
        FROM pedidos
        WHERE id_alumno_bocadillo = :alumno
          AND fecha = date(now())";
    $stmtPedido = $db->prepare($queryPedido);
    $stmtPedido->bindParam(':alumno', $alumno);
    $stmtPedido->execute();
    $pedido = $stmtPedido->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'        => true,
        'bocadillos'     => $bocadillos,
        'pedido_actual'  => $pedido['id_bocadillo_pedido'] ?? null,
    ]);
}

function hacerPedido($db, $data)
{
    $alumno   = $data['alumno'] ?? null;
    $bocadillo = $data['bocadillo'] ?? null;

    if (!$alumno || !$bocadillo) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos necesarios: alumno y/o bocadillo.',
        ]);
        exit;
    }

    // Horario en que se pueden hacer pedidos
    $horaActual = new DateTime('now', new DateTimeZone('Europe/Madrid'));
    $horaInicio = new DateTime('09:00', new DateTimeZone('Europe/Madrid'));
    $horaFin    = new DateTime('20:00', new DateTimeZone('Europe/Madrid'));

    if ($horaActual < $horaInicio || $horaActual > $horaFin) {
        echo json_encode([
            'success' => false,
            'message' => 'Los pedidos solo pueden realizarse entre las 9:00 y las 11:00.',
        ]);
        exit;
    }

    // Saldo del alumno
    $querySaldo = "SELECT monedero FROM alumno WHERE nombre = :alumno";
    $stmtSaldo  = $db->prepare($querySaldo);
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

    // Precio del nuevo bocadillo
    $queryPrecioNuevo = "SELECT precio_venta_publico
                         FROM bocadillo
                         WHERE nombre_bocadillo = :bocadillo";
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

    // ¿Tiene ya pedido hoy?
    $queryCheck = "SELECT id_bocadillo_pedido
                   FROM pedidos
                   WHERE id_alumno_bocadillo = :alumno
                     AND fecha = date(now())";
    $stmtCheck = $db->prepare($queryCheck);
    $stmtCheck->bindParam(':alumno', $alumno);
    $stmtCheck->execute();
    $pedidoExistente = $stmtCheck->fetchColumn();

    if ($pedidoExistente) {
        // Precio del bocadillo antiguo
        $queryPrecioAntiguo = "SELECT precio_venta_publico
                               FROM bocadillo
                               WHERE nombre_bocadillo = :bocadillo";
        $stmtPrecioAntiguo = $db->prepare($queryPrecioAntiguo);
        $stmtPrecioAntiguo->bindParam(':bocadillo', $pedidoExistente);
        $stmtPrecioAntiguo->execute();
        $precioAntiguo = $stmtPrecioAntiguo->fetchColumn();

        // Devolver antiguo y cobrar nuevo
        $nuevoSaldo = $saldo + $precioAntiguo - $precioNuevo;
    } else {
        // Cobrar solo el nuevo
        $nuevoSaldo = $saldo - $precioNuevo;
    }

    if ($nuevoSaldo < 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Saldo insuficiente en el monedero.',
        ]);
        exit;
    }

    // Actualizar saldo
    $queryUpdateSaldo = "UPDATE alumno
                         SET monedero = :nuevoSaldo
                         WHERE nombre = :alumno";
    $stmtUpdateSaldo = $db->prepare($queryUpdateSaldo);
    $stmtUpdateSaldo->bindParam(':nuevoSaldo', $nuevoSaldo);
    $stmtUpdateSaldo->bindParam(':alumno', $alumno);
    $stmtUpdateSaldo->execute();

    if ($pedidoExistente) {
        // Actualizar pedido existente
        $queryUpdatePedido = "
            UPDATE pedidos
            SET id_bocadillo_pedido = :bocadillo,
                precio_pedido       = :precioNuevo
            WHERE id_alumno_bocadillo = :alumno
              AND fecha = date(now())";
        $stmtUpdatePedido = $db->prepare($queryUpdatePedido);
        $stmtUpdatePedido->bindParam(':bocadillo', $bocadillo);
        $stmtUpdatePedido->bindParam(':precioNuevo', $precioNuevo);
        $stmtUpdatePedido->bindParam(':alumno', $alumno);
        $stmtUpdatePedido->execute();
    } else {
        // Nuevo pedido
        $queryInsertPedido = "
            INSERT INTO pedidos (id_alumno_bocadillo, id_bocadillo_pedido,
                                 precio_pedido, fecha)
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

function getHistoricoPedidosAlumno($db, $data)
{
    $alumno = $data['alumno'] ?? null;

    if (!$alumno) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos: alumno.',
        ]);
        exit;
    }

    $query = "
        SELECT 
            a.nombre              AS alumno,
            b.nombre_bocadillo    AS bocadillo,
            b.tipo_bocadillo      AS tipo,
            p.precio_pedido,
            p.fecha,
            p.fecha_recogida
        FROM pedidos p
        JOIN alumno   a ON p.id_alumno_bocadillo = a.nombre
        JOIN bocadillo b ON p.id_bocadillo_pedido = b.nombre_bocadillo
        WHERE a.nombre = :alumno
        ORDER BY p.fecha DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':alumno', $alumno, PDO::PARAM_STR);
    $stmt->execute();
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'pedidos' => $pedidos,
    ]);
}

?>
