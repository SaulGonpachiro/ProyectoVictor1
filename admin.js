// verificar que el usuario es de administrador
function verificarAcceso() {
    const authKey = localStorage.getItem("auth_key");
    const tipoUsuario = localStorage.getItem("tipo_usuario");

    // Verificar si el auth_key existe y si el tipoUsuario es administrador
    if (!authKey || tipoUsuario !== 'admin') {
        // Guardar el mensaje de error en localStorage
        localStorage.setItem("error_message", "No tienes permisos para acceder a esta página.");
        
        window.location.href = "index.html"; // Redirigir si no cumple los permisos
    }
}
