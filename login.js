function loginUser() {
    // Obtiene los valores del formulario de login
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validación de campos (opcional)
    if (!email || !password) {
        alert("Por favor, completa ambos campos.");
        return; // Si falta algún campo, no continuar
    }

    // URL del servicio web de login
    const url = "login_sw.php";
   
    const data = {
        email: email,
        password: password
    };

    // Realiza la solicitud con fetch
    fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then((response) => response.json())  // Asegúrate de que la respuesta es JSON
    .then(function (json) {
        console.log(json); // Verifica qué respuesta se recibe en la consola

        // Verifica si el login fue exitoso
        if (json.success) {
            // Almacenar el auth_key en localStorage (o cookies) para su uso posterior
            localStorage.setItem('auth_key', json.auth_key);
            localStorage.setItem('tipo_usuario', json.tipo_usuario);

            const tipoUsuario = localStorage.getItem('tipo_usuario');

            if (json.tipo_usuario === 'alumnado' && json.nombre) {
                localStorage.setItem('nombre_alumno', json.nombre);
            }

            if (tipoUsuario === "admin") {
                window.location.href = "adminDashboard.html";
            } else if (tipoUsuario === "alumnado") {
                window.location.href = "pedirBocadillo.html";
            } else if (tipoUsuario === "cocina") {
                window.location.href = "cocinaDashboard.html";
            } else {
                alert("Tipo de usuario desconocido.");
            }

            // Redirige a la página principal en caso de login exitoso
            //window.location.href = "pedirBocadillo.html";
        } else {
            // Mostrar mensaje de error
            alert(json.message);
        }
    })
    .catch((error) => {
        console.error("Error al realizar la solicitud:", error);
        alert("Hubo un error al procesar la solicitud.");
    });
}

function faltaPermisos(){
    // Verificar si hay un mensaje de error en localStorage
    const errorMessage = localStorage.getItem('error_message');
    if (errorMessage) {
        // Mostrar el mensaje de error
        alert(errorMessage);

        // Limpiar el mensaje de error después de mostrarlo
        localStorage.removeItem('error_message');
    }
}