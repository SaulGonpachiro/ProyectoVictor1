<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

session_start();
require 'Conexion.php';

login();

function login() {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? null;
    $password = $data['password'] ?? null;

    if ($email && $password) {
        $db = DB::getInstance();
        $stmt = $db->prepare("SELECT * FROM usuario WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() === 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            // Verificación de contraseña con password_verify() para mayor seguridad
            if (password_verify($password, $user['password'])) {

                // Generar un auth_key aleatorio
                $auth_key = bin2hex(random_bytes(16));

                // Actualizar el auth_key en la base de datos para el usuario
                $updateStmt = $db->prepare("UPDATE usuario SET auth_key = :auth_key WHERE email = :email");
                $updateStmt->bindParam(':auth_key', $auth_key);
                $updateStmt->bindParam(':email', $email);
                $updateStmt->execute();

                // Si el tipo_usuario es 'alumnado', obtener el nombre de la tabla 'alumno'
                $nombre = null;
                if ($user['tipo_usuario'] === 'alumnado') {
                    $alumnoStmt = $db->prepare("SELECT nombre FROM alumno WHERE id_email_usuario = :id_email_usuario");
                    $alumnoStmt->bindParam(':id_email_usuario', $user['email']);
                    $alumnoStmt->execute();

                    if ($alumnoStmt->rowCount() === 1) {
                        $alumno = $alumnoStmt->fetch(PDO::FETCH_ASSOC);
                        $nombre = $alumno['nombre'];
                    }
                }

                // Establecer la clave en la sesión (opcional)
                $_SESSION['auth_key'] = $auth_key;


                echo json_encode([
                    'success' => true,
                    'message' => "Login exitoso. Bienvenido",
                    'auth_key' => $auth_key,
                    'tipo_usuario' => $user['tipo_usuario'],
                    'nombre' => $nombre
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => "Contraseña incorrecta."
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => "Usuario incorrecto."
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => "Por favor, completa todos los campos."
        ]);
    }

    error_log(json_encode($data));

}
?>
