function verificarAcceso() {
    const authKey = localStorage.getItem("auth_key");
    const tipoUsuario = localStorage.getItem("tipo_usuario");

    if (!authKey || tipoUsuario !== 'cocina') {
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
    fetchHistorico(1); // Cargar la página inicial con datos

    const filterButton = document.getElementById("filter-button");
    const resetButton = document.getElementById("reset-button");

    filterButton.addEventListener("click", function () {
        const column = document.getElementById("filter-column").value;
        const filterValue = document.getElementById("filter-value").value;

        if (filterValue.trim() === "") {
            mostrarError("Por favor, introduce un valor para filtrar.");
            return;
        }

        filtrarPorColumna(column, filterValue);
    });

    resetButton.addEventListener("click", function () {
        document.getElementById("filter-value").value = "";
        fetchHistorico(1); // Restablecer la tabla con los datos originales
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

function fetchHistorico(currentPage) {
    ocultarError(); // Oculta errores previos
    fetch("sw_cocina.php?action=getHistoricoPedidosCocina") // Solicitar el histórico de pedidos
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const itemsPerPage = 10;
                const totalPages = Math.ceil(data.pedidos.length / itemsPerPage);

                // Actualizar la tabla con la página actual
                const paginatedData = paginarRegistros(data.pedidos, currentPage, itemsPerPage);
                rellenarHistorico(paginatedData, currentPage, totalPages); // Llenar la tabla

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
                mostrarError("Error al cargar el histórico: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al cargar el histórico:", error);
            mostrarError("Hubo un error al cargar el histórico.");
        });
}

// Función para paginar los datos
function paginarRegistros(pedidos, currentPage, itemsPerPage) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return pedidos.slice(startIndex, endIndex);
}

function rellenarHistorico(pedidos, currentPage, totalPages) {
    const tableBody = document.querySelector("#historico-table tbody");
    tableBody.innerHTML = ""; // Limpia las filas anteriores

    pedidos.forEach((pedido) => {
        const row = document.createElement("tr");

        // Crea celdas dinámicas
        const alumnoCell = document.createElement("td");
        alumnoCell.textContent = pedido.alumno;

        const cursoCell = document.createElement("td");
        cursoCell.textContent = pedido.curso;

        const bocadilloCell = document.createElement("td");
        bocadilloCell.textContent = pedido.bocadillo;

        const tipoCell = document.createElement("td");
        tipoCell.textContent = pedido.tipo;

        const precioCell = document.createElement("td");
        const precio = parseFloat(pedido.precio_pedido);
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
        row.appendChild(alumnoCell);
        row.appendChild(cursoCell);
        row.appendChild(bocadilloCell);
        row.appendChild(tipoCell);
        row.appendChild(precioCell);
        row.appendChild(fechaCell);
        row.appendChild(fechaRecogidaCell);

        // Añade fila a la tabla
        tableBody.appendChild(row);
    });
}

// Función para cambiar de página
function pasarPagina(direction) {
    const currentPageInput = document.getElementById("page-input");
    let currentPage = parseInt(currentPageInput.value, 10); // Obtener la página actual desde el input
    const itemsPerPage = 10;

    fetch("sw_cocina.php?action=getHistoricoPedidosCocina")
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
                rellenarHistorico(paginatedData, currentPage, totalPages);

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

    fetch("sw_cocina.php?action=getHistoricoPedidosCocina")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const itemsPerPage = 10;
                const totalPages = Math.ceil(data.pedidos.length / itemsPerPage);

                // Si la página ingresada es válida, recargar la tabla
                if (targetPage >= 1 && targetPage <= totalPages) {
                    const paginatedData = paginarRegistros(data.pedidos, targetPage, itemsPerPage);
                    rellenarHistorico(paginatedData, targetPage, totalPages);

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

function filtrarPorColumna(column, filterValue) {
    ocultarError();
    fetch("sw_cocina.php?action=getHistoricoPedidosCocina")
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const filteredData = data.pedidos.filter((pedido) => {
                    return pedido[column] && pedido[column].toLowerCase().includes(filterValue.toLowerCase());
                });

                // Actualizar la tabla con los datos filtrados
                const paginatedData = paginarRegistros(filteredData, 1, 10);
                rellenarHistorico(paginatedData, 1, Math.ceil(filteredData.length / 10));
            } else {
                mostrarError("Error al cargar los pedidos: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error al cargar los pedidos:", error);
            mostrarError("Hubo un error al cargar los pedidos.");
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