// Verificar que el usuario es administrador
function verificarAcceso() {
    const authKey = localStorage.getItem("auth_key");
    const tipoUsuario = localStorage.getItem("tipo_usuario");

    // Si no hay auth_key o no es admin, bloquear acceso
    if (!authKey || tipoUsuario !== 'admin') {
        localStorage.setItem(
            "error_message",
            "No tienes permisos para acceder a esta página."
        );
        window.location.href = "index.html"; // Volver al login
    }
}

// Cerrar sesión para admin (y cualquier otro usuario)
function logoutAdmin() {
    localStorage.clear();
    window.location.href = "index.html";
}
