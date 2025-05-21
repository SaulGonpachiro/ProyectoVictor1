// verificar que el usuario es de alumno
function verificarAcceso() {
    const authKey = localStorage.getItem("auth_key");
    const tipoUsuario = localStorage.getItem("tipo_usuario");

    // Verificar si el auth_key existe y si el tipoUsuario es alumno
    if (!authKey || tipoUsuario !== 'alumnado') {
        // Guardar el mensaje de error en localStorage
        localStorage.setItem("error_message", "No tienes permisos para acceder a esta página.");

        window.location.href = "index.html"; // Redirigir si no cumple los permisos
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('auth_key');
    localStorage.removeItem('tipo_usuario');
    localStorage.removeItem('nombre_alumno');
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", function () {
    fetchBocadillos();
});

function mostrarSaldo() {
    const nombreAlumno = localStorage.getItem("nombre_alumno");

    if (!nombreAlumno) {
        console.error("No se pudo obtener el nombre del alumno.");
        return;
    }

    fetch("sw_alumno.php?action=getSaldoAlumno", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ alumno: nombreAlumno }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const saldoAlumno = document.getElementById("saldo-alumno");
                saldoAlumno.textContent = `Saldo: ${parseFloat(data.saldo).toFixed(2)} €`;
            } else {
                console.error("Error al obtener el saldo: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al obtener el saldo:", error);
        });
}


// funcion para traer los bocadillos del backend
function fetchBocadillos() {
    const nombreAlumno = localStorage.getItem("nombre_alumno");

    if (!nombreAlumno) {
        alert("No se ha encontrado el nombre del alumno.");
        console.error("Error: nombre_alumno no encontrado en localStorage.");
        return;
    }

    console.log("Enviando solicitud con nombreAlumno:", nombreAlumno);

    fetch("sw_alumno.php?action=getBocadillosAlumno", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ alumno: nombreAlumno }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                imprimirBocadillos(data.bocadillos, data.pedido_actual);
            } else {
                alert("Error al cargar bocadillos: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al cargar bocadillos:", error);
            alert("Hubo un error al cargar los bocadillos.");
        });
}

function imprimirBocadillos(bocadillos, pedidoActual) {
    const container = document.querySelector("#bocadillos-container");
    container.innerHTML = "";

    bocadillos.forEach((bocadillo) => {
        const card = document.createElement("div");
        card.className = "bocadillo-card";

        const isSelected = bocadillo.nombre_bocadillo === pedidoActual;

        // Agregar una clase especial para el bocadillo seleccionado
        if (isSelected) {
            card.classList.add("bocadillo-seleccionado");
        }

        card.innerHTML = `
            <h3>${bocadillo.nombre_bocadillo}</h3>
            <p><strong>Ingredientes:</strong> ${bocadillo.ingredientes}</p>
            <p><strong>Tipo:</strong> ${bocadillo.tipo_bocadillo}</p>
            <p><strong>Alérgenos:</strong> ${bocadillo.alergenos}</p>
            <p><strong>Precio:</strong> ${parseFloat(bocadillo.precio_venta_publico).toFixed(2)}€</p>
            ${isSelected ? "<div class='seleccionado-mensaje'>Seleccionado</div>" : "<button>Elegir</button>"}
        `;

        if (!isSelected) {
            const button = card.querySelector("button");
            button.addEventListener("click", () =>
                seleccionarBocadillo(bocadillo.nombre_bocadillo)
            );
        }

        container.appendChild(card);
    });
}


// Enviar el pedido
function seleccionarBocadillo(nombreBocadillo) {
    const nombreAlumno = localStorage.getItem("nombre_alumno");

    if (!nombreAlumno) {
        alert("No se pudo identificar al alumno.");
        return;
    }

    fetch("sw_alumno.php?action=hacerPedido", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ alumno: nombreAlumno, bocadillo: nombreBocadillo }),
    })
        .then((response) => response.json())
        .then((data) => {
            const mensajeError = document.getElementById("mensaje-error");

            if (data.success) {
                mensajeError.style.display = "none";
                mensajeError.textContent = "";
                window.location.href = "historicoPedidosAlumno.html"; // Redirigir o actualizar la página
            } else {
                console.error("Error al realizar el pedido:", data.message);
                mensajeError.textContent = data.message; // Muestra el mensaje específico del servidor
                mensajeError.style.display = "block"; // Muestra el mensaje en el contenedor
            }
        })
        .catch((error) => {
            console.error("Error capturado en la solicitud:", error);
            const mensajeError = document.getElementById("mensaje-error");
            if (mensajeError) {
                mensajeError.textContent = "Hubo un error inesperado al realizar el pedido. Por favor, inténtelo de nuevo.";
                mensajeError.style.display = "block";
            }
        });
}