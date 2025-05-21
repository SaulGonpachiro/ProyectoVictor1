// Reutiliza la verificación de acceso
function verificarAcceso() {
    const authKey = localStorage.getItem("auth_key");
    const tipoUsuario = localStorage.getItem("tipo_usuario");

    if (!authKey || tipoUsuario !== 'alumnado') {
        localStorage.setItem("error_message", "No tienes permisos para acceder a esta página.");
        window.location.href = "index.html";
    }
}

function logout() {
    localStorage.removeItem('auth_key');
    localStorage.removeItem('tipo_usuario');
    localStorage.removeItem('nombre_alumno');
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", function () {
    fetchHistorico();

    const filterButton = document.getElementById("filter-button");
    const resetButton = document.getElementById("reset-button");

    filterButton.addEventListener("click", function () {
        const column = document.getElementById("filter-column").value;
        const filterValue = document.getElementById("filter-value").value;

        if (filterValue.trim() === "") {
            alert("Por favor, introduce un valor para filtrar.");
            return;
        }

        filtrarPorColumna(column, filterValue);
    });

    resetButton.addEventListener("click", function () {
        document.getElementById("filter-value").value = "";
        fetchHistorico(); // Restablecer la tabla con los datos originales
    });
});

// Función para generar el resumen de bocadillos
function generarResumenBocadillos(pedidos) {
    const resumenContainer = document.getElementById("bocadillos-resumen");
    resumenContainer.innerHTML = ""; // Limpiar el resumen anterior

    // Crear un mapa para contar bocadillos
    const resumen = {};
    pedidos.forEach((pedido) => {
        if (resumen[pedido.bocadillo]) {
            resumen[pedido.bocadillo]++;
        } else {
            resumen[pedido.bocadillo] = 1;
        }
    });

    // Crear elementos dinámicos para mostrar el resumen
    for (const [bocadillo, cantidad] of Object.entries(resumen)) {
        const resumenItem = document.createElement("div");
        resumenItem.classList.add("resumen-item");
        resumenItem.textContent = `${bocadillo}: ${cantidad} pedidos`;
        resumenContainer.appendChild(resumenItem);
    }
}

function fetchHistorico() {
    ocultarError();
    const nombreAlumno = localStorage.getItem("nombre_alumno");

    if (!nombreAlumno) {
        mostrarError("No se ha encontrado el nombre del alumno.");
        return;
    }

    fetch("sw_alumno.php?action=getHistoricoPedidosAlumno", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ alumno: nombreAlumno }) // Enviar el nombre del alumno al PHP
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                rellenarHistorico(data.pedidos);
            } else {
                mostrarError("Error al cargar el histórico: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al cargar el histórico:", error);
            mostrarError("Hubo un error al cargar el histórico.");
        });
}


function rellenarHistorico(pedidos) {
    const tableBody = document.querySelector("#historico-table tbody");
    tableBody.innerHTML = "";

    let totalGastado = 0; // Inicializar el total

    pedidos.forEach((pedido) => {
        const row = document.createElement("tr");

        const bocadilloCell = document.createElement("td");
        bocadilloCell.textContent = pedido.bocadillo;

        const tipoCell = document.createElement("td");
        tipoCell.textContent = pedido.tipo;

        const precioCell = document.createElement("td");
        const precio = parseFloat(pedido.precio_pedido);
        totalGastado += precio; // Sumar al total
        precioCell.textContent = `${precio.toFixed(2)}€`;

        const fechaCell = document.createElement("td");
        fechaCell.textContent = pedido.fecha
            ? new Date(pedido.fecha).toLocaleDateString()
            : "Sin fecha";

        const fechaRecogidaCell = document.createElement("td");
        fechaRecogidaCell.textContent = pedido.fecha_recogida
            ? "Sí"
            : "No";

        // Añade celdas a la fila
        row.appendChild(bocadilloCell);
        row.appendChild(tipoCell);
        row.appendChild(precioCell);
        row.appendChild(fechaCell);
        row.appendChild(fechaRecogidaCell);

        // Añade fila a la tabla
        tableBody.appendChild(row);
    });

    // Mostrar el total gastado en el contenedor correspondiente
    const totalContainer = document.getElementById("total-gastado");
    totalContainer.textContent = `${totalGastado.toFixed(2)}€`; // Mostrar con 2 decimales
}



function filtrarPorColumna(column, filterValue) {
    ocultarError();

    // Obtener el nombre del alumno desde el almacenamiento local
    const nombreAlumno = localStorage.getItem("nombre_alumno");

    if (!nombreAlumno) {
        mostrarError("No se ha encontrado el nombre del alumno.");
        return;
    }

    // Enviar solicitud al servidor con el filtro y el alumno
    fetch("sw_alumno.php?action=getHistoricoPedidosAlumno", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ alumno: nombreAlumno }), // Incluir el nombre del alumno en la solicitud
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Filtrar los pedidos según el valor ingresado
                const pedidosFiltrados = data.pedidos.filter((pedido) => {
                    const value = pedido[column]?.toString().toLowerCase(); // Convertir a string y minúsculas
                    return value && value.includes(filterValue.toLowerCase());
                });

                rellenarHistorico(pedidosFiltrados);

                if (pedidosFiltrados.length === 0) {
                    mostrarError(`No se encontraron pedidos que coincidan con "${filterValue}".`);
                }
            } else {
                mostrarError("Error al cargar los pedidos: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al filtrar los pedidos:", error);
            mostrarError("Hubo un error al filtrar los pedidos.");
        });
}


function mostrarError(mensaje) {
    const errorContainer = document.getElementById("error-message");
    errorContainer.textContent = mensaje; // Actualiza el texto del error
    errorContainer.classList.add("show"); // Muestra el contenedor
}

function ocultarError() {
    const errorContainer = document.getElementById("error-message");
    errorContainer.textContent = ""; // Limpia el mensaje
    errorContainer.classList.remove("show"); // Oculta el contenedor
}