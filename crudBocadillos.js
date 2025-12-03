// crudBocadillos.js

document.addEventListener("DOMContentLoaded", () => {
    cargarBocadillos();

    document.getElementById("form-bocadillo").addEventListener("submit", guardarBocadillo);

    const inputBusqueda = document.getElementById("bocadillo-busqueda");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("keyup", pintarBocadillos);
    }

    const filtroTipo = document.getElementById("bocadillo-tipo-filtro");
    if (filtroTipo) {
        filtroTipo.addEventListener("change", pintarBocadillos);
    }
});

const API_BOCADILLOS = "sw_bocadillo.php";
let listaBocadillos = [];

// Normaliza acentos y mayúsculas: "Frío" -> "frio"
function normalizarTipo(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}

function mostrarMensajeBocadillos(texto, error = false) {
    const p = document.getElementById("bocadillos-mensaje");
    if (!p) return;
    p.textContent = texto;
    p.style.color = error ? "red" : "green";
}

// ===============================
// Cargar
// ===============================
function cargarBocadillos() {
    fetch(`${API_BOCADILLOS}?action=listarBocadillos`)
        .then(r => r.json())
        .then(data => {
            if (!data.success) {
                mostrarMensajeBocadillos(data.message || "Error al cargar bocadillos", true);
                return;
            }

            listaBocadillos = data.bocadillos || [];
            pintarBocadillos();
        })
        .catch(() => mostrarMensajeBocadillos("Error comunicando con el servidor", true));
}

// ===============================
// Pintar tabla con filtros
// ===============================
function pintarBocadillos() {
    const tbody = document.getElementById("tbody-bocadillos");
    if (!tbody) return;

    tbody.innerHTML = "";

    const texto = document.getElementById("bocadillo-busqueda").value.toLowerCase().trim();
    const tipoFiltro = document.getElementById("bocadillo-tipo-filtro").value; // "frio" / "caliente" / ""

    let lista = listaBocadillos;

    if (texto !== "") {
        lista = lista.filter(b =>
            (b.nombre_bocadillo || "").toLowerCase().includes(texto)
        );
    }

    if (tipoFiltro !== "") {
        lista = lista.filter(b =>
            normalizarTipo(b.tipo_bocadillo) === tipoFiltro
        );
    }

    lista.forEach(b => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${b.nombre_bocadillo}</td>
            <td>${b.ingredientes || ""}</td>
            <td>${b.tipo_bocadillo || ""}</td>
            <td>${parseFloat(b.precio_venta_publico).toFixed(2)} €</td>
            <td>${b.alergenos || ""}</td>
            <td>${b.dia_semana}</td>
            <td>
                <button class="btn-edit" onclick='editarBocadillo(${JSON.stringify(b)})'>Editar</button>
                <button class="btn-delete" onclick='eliminarBocadillo(${JSON.stringify(b.nombre_bocadillo)})'>Eliminar</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ===============================
// Limpiar formulario
// ===============================
function limpiarFormularioBocadillo() {
    document.getElementById("bocadillo-original").value = "";
    document.getElementById("bocadillo-nombre").value = "";
    document.getElementById("bocadillo-ingredientes").value = "";
    document.getElementById("bocadillo-tipo").value = "";
    document.getElementById("bocadillo-precio").value = "";
    document.getElementById("bocadillo-alergenos").value = "";
    document.getElementById("bocadillo-dia").value = "Monday";
}

// ===============================
// Editar
// ===============================
function editarBocadillo(b) {
    document.getElementById("bocadillo-original").value      = b.nombre_bocadillo;
    document.getElementById("bocadillo-nombre").value        = b.nombre_bocadillo;
    document.getElementById("bocadillo-ingredientes").value  = b.ingredientes || "";

    const tipoNorm = normalizarTipo(b.tipo_bocadillo);
    if (tipoNorm === "frio" || tipoNorm === "caliente") {
        document.getElementById("bocadillo-tipo").value = tipoNorm;
    } else {
        document.getElementById("bocadillo-tipo").value = "";
    }

    document.getElementById("bocadillo-precio").value        = b.precio_venta_publico;
    document.getElementById("bocadillo-alergenos").value     = b.alergenos || "";
    document.getElementById("bocadillo-dia").value           = b.dia_semana;
}

// ===============================
// Guardar (crear / actualizar)
// ===============================
function guardarBocadillo(e) {
    e.preventDefault();

    const original = document.getElementById("bocadillo-original").value;

    const b = {
        nombre_bocadillo: document.getElementById("bocadillo-nombre").value.trim(),
        ingredientes:     document.getElementById("bocadillo-ingredientes").value.trim(),
        tipo_bocadillo:   document.getElementById("bocadillo-tipo").value.trim(), // "frio" / "caliente"
        precio_venta_publico: document.getElementById("bocadillo-precio").value.trim(),
        alergenos:        document.getElementById("bocadillo-alergenos").value.trim(),
        dia_semana:       document.getElementById("bocadillo-dia").value
    };

    if (!b.nombre_bocadillo || !b.precio_venta_publico || !b.dia_semana) {
        mostrarMensajeBocadillos("Nombre, precio y día son obligatorios.", true);
        return;
    }

    if (original) {
        b.nombre_original = original;
    }

    const action = original ? "actualizarBocadillo" : "crearBocadillo";

    fetch(`${API_BOCADILLOS}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b)
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
            mostrarMensajeBocadillos("Error comunicando con el servidor.", true);
        });
}

// ===============================
// Eliminar
// ===============================
function eliminarBocadillo(nombre) {
    if (!confirm("¿Eliminar este bocadillo?")) return;

    fetch(`${API_BOCADILLOS}?action=eliminarBocadillo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_bocadillo: nombre })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarMensajeBocadillos(data.message || "Bocadillo eliminado.");
                cargarBocadillos();
            } else {
                mostrarMensajeBocadillos(data.message || "No se pudo eliminar el bocadillo.", true);
            }
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeBocadillos("Error comunicando con el servidor.", true);
        });
}
