// verificar que el usuario es de cocina
function verificarAcceso() {
    const authKey = localStorage.getItem("auth_key");
    const tipoUsuario = localStorage.getItem("tipo_usuario");

    // Verificar si el auth_key existe y si el tipoUsuario es cocina
    if (!authKey || tipoUsuario !== 'cocina') {
        // Guardar el mensaje de error en localStorage
        localStorage.setItem("error_message", "No tienes permisos para acceder a esta página.");

        window.location.href = "index.html"; // Redirigir si no cumple los permisos
    }
}

// función para cerrar sesión
function logout() {
    // Elimina los datos del localStorage
    localStorage.removeItem('auth_key');
    localStorage.removeItem('tipo_usuario');
    localStorage.removeItem('nombre_alumno'); // Si existiera este dato

    // Redirige al index.html
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", function () {
    fetchPedidos();

    const filterButton = document.getElementById("filter-button");
    const resetButton = document.getElementById("reset-button");

    filterButton.addEventListener("click", function (event) {
        event.preventDefault();
        const column = document.getElementById("filter-column").value; // Verifica el valor
        const filterValue = document.getElementById("filter-value").value.trim(); // Limpia espacios

        if (!column || filterValue === "") {
            mostrarError("Por favor, selecciona una columna válida e introduce un valor para filtrar.");
            return;
        }

        filtrarPorColumna(column, filterValue);
    });


    resetButton.addEventListener("click", function (event) {
        event.preventDefault(); // Evita que el formulario se envíe
        document.getElementById("filter-value").value = "";
        fetchPedidos(); // Restablecer la tabla con los datos originales
    });

    // Botones de paginación
    const paginaPreviaBtn = document.getElementById("prev-page-btn");
    const paginaSiguienteBtn = document.getElementById("next-page-btn");
    const pageInput = document.getElementById("page-input");

    paginaPreviaBtn.addEventListener("click", function () {
        pasarPagina("prev");
    });

    paginaSiguienteBtn.addEventListener("click", function () {
        pasarPagina("next");
    });

    pageInput.addEventListener("change", function () {
        elegirPagina();
    });
});

function fetchPedidos() {
    ocultarError();
    fetch("sw_cocina.php?action=getPedidos")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Variables para la paginación
                const itemsPerPage = 10;
                let currentPage = 1;
                const totalPages = Math.ceil(data.pedidos.length / itemsPerPage);

                // Mostrar resumen de bocadillos
                generarResumenBocadillos(data.pedidos);

                // Actualizar la tabla con la página actual
                const paginatedData = paginarRegistros(data.pedidos, currentPage, itemsPerPage);
                rellenarTabla(paginatedData, currentPage, totalPages);

                // Actualizar la información de la página actual
                const pageInfo = document.getElementById("page-info");
                pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
                const pageInput = document.getElementById("page-input");
                pageInput.value = currentPage;

                // Deshabilitar botones de navegación según la página actual
                const paginaPreviaBtn = document.getElementById("prev-page-btn");
                const paginaSiguienteBtn = document.getElementById("next-page-btn");

                paginaPreviaBtn.disabled = currentPage === 1;
                paginaSiguienteBtn.disabled = currentPage === totalPages;
            } else {
                mostrarError("Error al cargar pedidos: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al cargar pedidos:", error);
            mostrarError("Hubo un error al cargar los pedidos.");
        });
}

// Función para paginar los datos
function paginarRegistros(pedidos, currentPage, itemsPerPage) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pedidos.slice(startIndex, endIndex);
}

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


// Función para rellenar la tabla con los pedidos paginados
function rellenarTabla(pedidos, currentPage, totalPages) {
    const tableBody = document.querySelector("#pedidos-table tbody");
    tableBody.innerHTML = ""; // Limpiar la tabla

    pedidos.forEach((pedido) => {
        const row = document.createElement("tr");

        // Crea las celdas para cada fila
        const alumnoCell = document.createElement("td");
        alumnoCell.textContent = pedido.alumno;

        const bocadilloCell = document.createElement("td");
        bocadilloCell.textContent = pedido.bocadillo;

        const precioCell = document.createElement("td");
        const precio = parseFloat(pedido.precio_pedido);
        precioCell.textContent = isNaN(precio) ? "N/A" : `${precio.toFixed(2)}€`;

        const fechaCell = document.createElement("td");
        fechaCell.textContent = pedido.fecha
            ? new Date(pedido.fecha).toLocaleDateString()
            : "Sin fecha";

        const fechaRecogidaCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        if (pedido.fecha_recogida) {
            checkbox.checked = true;
            checkbox.disabled = true;
        }

        checkbox.addEventListener("change", function () {
            if (this.checked) {
                marcarFechaRecogida(pedido.alumno, pedido.fecha);
            }
        });

        fechaRecogidaCell.appendChild(checkbox);

        row.appendChild(alumnoCell);
        row.appendChild(bocadilloCell);
        row.appendChild(precioCell);
        row.appendChild(fechaCell);
        row.appendChild(fechaRecogidaCell);

        tableBody.appendChild(row);
    });
}

// Función para cambiar de página
function pasarPagina(direction) {
    const currentPageInput = document.getElementById("page-input");
    let currentPage = parseInt(currentPageInput.value, 10); // Obtener la página actual desde el input
    const itemsPerPage = 10;

    fetch("sw_cocina.php?action=getPedidos")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const totalPages = Math.ceil(data.pedidos.length / itemsPerPage); // Calcular el total de páginas

                // Cambiar la página según la dirección (prev o next)
                if (direction === "prev" && currentPage > 1) {
                    currentPage -= 1; // Retroceder una página
                } else if (direction === "next" && currentPage < totalPages) {
                    currentPage += 1; // Avanzar una página
                }

                // Actualizar la tabla con los pedidos de la página actual
                const paginatedData = paginarRegistros(data.pedidos, currentPage, itemsPerPage);
                rellenarTabla(paginatedData, currentPage, totalPages);

                // Actualizar la información de la página
                const pageInfo = document.getElementById("page-info");
                pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
                currentPageInput.value = currentPage;

                // Deshabilitar botones de navegación según la página actual
                const paginaPreviaBtn = document.getElementById("prev-page-btn");
                const paginaSiguienteBtn = document.getElementById("next-page-btn");

                paginaPreviaBtn.disabled = currentPage === 1;
                paginaSiguienteBtn.disabled = currentPage === totalPages;
            } else {
                mostrarError("Error al cargar los pedidos: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al cargar los pedidos:", error);
            mostrarError("Hubo un error al cargar los pedidos.");
        });
}



// Función para ir a una página específica
function elegirPagina() {
    const pageInput = document.getElementById("page-input");
    const targetPage = parseInt(pageInput.value, 10);

    fetch("sw_cocina.php?action=getPedidos")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const itemsPerPage = 10;
                const totalPages = Math.ceil(data.pedidos.length / itemsPerPage);

                // Si la página ingresada es válida, recargar la tabla
                if (targetPage >= 1 && targetPage <= totalPages) {
                    const paginatedData = paginarRegistros(data.pedidos, targetPage, itemsPerPage);
                    rellenarTabla(paginatedData, targetPage, totalPages);

                    // Actualizar la información de la página
                    const pageInfo = document.getElementById("page-info");
                    pageInfo.textContent = `Página ${targetPage} de ${totalPages}`;
                    pageInput.value = targetPage;

                    // Deshabilitar botones de navegación según la página actual
                    const paginaPreviaBtn = document.getElementById("prev-page-btn");
                    const paginaSiguienteBtn = document.getElementById("next-page-btn");

                    paginaPreviaBtn.disabled = targetPage === 1;
                    paginaSiguienteBtn.disabled = targetPage === totalPages;
                } else {
                    mostrarError("Número de página inválido.");
                }
            } else {
                mostrarError("Error al cargar los pedidos: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al cargar los pedidos:", error);
            mostrarError("Hubo un error al cargar los pedidos.");
        });
}

// Función para enviar el ID del pedido al backend
function marcarFechaRecogida(alumno, fecha) {
    ocultarError();
    console.log("Datos enviados al backend:", { alumno, fecha });

    fetch("sw_cocina.php?action=updateFechaRecogida", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ alumno: alumno, fecha: fecha }), // Enviar ambos datos
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {;
                fetchPedidos(); // Recargar los pedidos para reflejar cambios
            } else {
                mostrarError("Error al actualizar fecha de recogida: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al actualizar fecha de recogida:", error);
            mostrarError("Hubo un error al actualizar la fecha de recogida.");
        });
}

function filtrarPorColumna(column, filterValue) {
    ocultarError();
    fetch("sw_cocina.php?action=getPedidos")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Filtrar los pedidos según el valor ingresado
                const pedidosFiltrados = data.pedidos.filter((pedido) => {
                    const value = pedido[column]?.toString().toLowerCase(); // Convertir a string y minúsculas
                    return value && value.includes(filterValue.toLowerCase());
                });

                rellenarTabla(pedidosFiltrados);

                if (pedidosFiltrados.length === 0) {
                    mostrarError(`No se encontraron pedidos que coincidan con "${filterValue}".`);
                }
            } else {
                mostrarError("Error al cargar los pedidos: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al cargar los pedidos:", error);
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