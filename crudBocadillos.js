// crudBocadillos.js

document.addEventListener("DOMContentLoaded", () => {
    // En el HTML ya llamas a verificarAcceso(), aquí solo cargamos datos y eventos
    cargarBocadillos();

    const form = document.getElementById("form-bocadillo");
    if (form) {
        form.addEventListener("submit", guardarBocadillo);
    }
});

// Cambia esto por el PHP que vayas a usar (igual que hicimos con sw_alumno.php)
const API_BOCADILLOS = "sw_bocadillo.php";

function mostrarMensajeBocadillos(texto, esError = false) {
    const p = document.getElementById("bocadillos-mensaje");
    if (!p) return;
    p.textContent = texto;
    p.style.color = esError ? "red" : "green";
}

// ====================== LISTAR ======================
function cargarBocadillos() {
    fetch(`${API_BOCADILLOS}?action=listarBocadillos`)
        .then(r => r.json())
        .then(data => {
            if (!data.success) {
                mostrarMensajeBocadillos(data.message || "Error al cargar bocadillos", true);
                return;
            }

            const tbody = document.getElementById("tbody-bocadillos");
            if (!tbody) return;

            tbody.innerHTML = "";

            data.bocadillos.forEach(b => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${b.nombre_bocadillo}</td>
                    <td>${b.ingredientes ?? ""}</td>
                    <td>${b.tipo_bocadillo ?? ""}</td>
                    <td>${parseFloat(b.precio_venta_publico).toFixed(2)} €</td>
                    <td>${b.alergenos ?? ""}</td>
                    <td>${b.dia_semana}</td>
                    <td>
                        <button type="button" class="btn-edit" onclick='editarBocadillo(${JSON.stringify(b)})'>Editar</button>
                        <button type="button" class="btn-delete" onclick="eliminarBocadillo(${JSON.stringify(b.nombre_bocadillo)})">Eliminar</button>
                    </td>
                `;

                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeBocadillos("Error de comunicación con el servidor.", true);
        });
}

// ====================== FORMULARIO ======================
function limpiarFormularioBocadillo() {
    const nombreOriginal = document.getElementById("bocadillo-nombre-original");
    const nombre = document.getElementById("bocadillo-nombre");
    const ingredientes = document.getElementById("bocadillo-ingredientes");
    const tipo = document.getElementById("bocadillo-tipo");
    const precio = document.getElementById("bocadillo-precio");
    const alergenos = document.getElementById("bocadillo-alergenos");
    const dia = document.getElementById("bocadillo-dia");

    if (nombreOriginal) nombreOriginal.value = "";
    if (nombre) nombre.value = "";
    if (ingredientes) ingredientes.value = "";
    if (tipo) tipo.value = "";
    if (precio) precio.value = "";
    if (alergenos) alergenos.value = "";
    if (dia) dia.value = "";
}

function editarBocadillo(b) {
    document.getElementById("bocadillo-nombre-original").value = b.nombre_bocadillo;
    document.getElementById("bocadillo-nombre").value = b.nombre_bocadillo;
    document.getElementById("bocadillo-ingredientes").value = b.ingredientes ?? "";
    document.getElementById("bocadillo-tipo").value = b.tipo_bocadillo ?? "";
    document.getElementById("bocadillo-precio").value = b.precio_venta_publico;
    document.getElementById("bocadillo-alergenos").value = b.alergenos ?? "";
    document.getElementById("bocadillo-dia").value = b.dia_semana;
}

// ====================== GUARDAR (CREATE / UPDATE) ======================
function guardarBocadillo(e) {
    e.preventDefault();

    const nombreOriginal = document.getElementById("bocadillo-nombre-original").value;

    const bocadillo = {
        nombre_bocadillo: document.getElementById("bocadillo-nombre").value.trim(),
        ingredientes: document.getElementById("bocadillo-ingredientes").value.trim(),
        tipo_bocadillo: document.getElementById("bocadillo-tipo").value.trim(),
        precio_venta_publico: document.getElementById("bocadillo-precio").value.trim(),
        alergenos: document.getElementById("bocadillo-alergenos").value.trim(),
        dia_semana: document.getElementById("bocadillo-dia").value
    };

    if (!bocadillo.nombre_bocadillo || !bocadillo.dia_semana || !bocadillo.precio_venta_publico) {
        mostrarMensajeBocadillos("Nombre, precio y día de la semana son obligatorios.", true);
        return;
    }

    const action = nombreOriginal ? "actualizarBocadillo" : "crearBocadillo";
    if (nombreOriginal) bocadillo.nombre_original = nombreOriginal;

    fetch(`${API_BOCADILLOS}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bocadillo),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarMensajeBocadillos(data.message || "Bocadillo guardado correctamente.");
                limpiarFormularioBocadillo();
                cargarBocadillos();
            } else {
                mostrarMensajeBocadillos(data.message || "No se pudo guardar el bocadillo.", true);
            }
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeBocadillos("Error de comunicación con el servidor.", true);
        });
}

// ====================== ELIMINAR ======================
function eliminarBocadillo(nombre_bocadillo) {
    if (!confirm("¿Seguro que quieres eliminar este bocadillo?")) return;

    fetch(`${API_BOCADILLOS}?action=eliminarBocadillo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_bocadillo }),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarMensajeBocadillos(data.message || "Bocadillo eliminado correctamente.");
                cargarBocadillos();
            } else {
                mostrarMensajeBocadillos(data.message || "No se pudo eliminar el bocadillo.", true);
            }
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeBocadillos("Error de comunicación con el servidor.", true);
        });
}
