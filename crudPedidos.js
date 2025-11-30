// crudPedidos.js

document.addEventListener("DOMContentLoaded", () => {
    cargarPedidos();

    const form = document.getElementById("form-pedido");
    if (form) {
        form.addEventListener("submit", guardarPedido);
    }
});

const API_PEDIDOS = "sw_pedidos.php";

function mostrarMensajePedidos(texto, esError = false) {
    const p = document.getElementById("pedidos-mensaje");
    if (!p) return;
    p.textContent = texto;
    p.style.color = esError ? "red" : "green";
}

// ====================== LISTAR ======================
function cargarPedidos() {
    fetch(`${API_PEDIDOS}?action=listarPedidos`)
        .then(r => r.json())
        .then(data => {
            if (!data.success) {
                mostrarMensajePedidos(data.message || "Error al cargar pedidos", true);
                return;
            }

            const tbody = document.getElementById("tbody-pedidos");
            if (!tbody) return;

            tbody.innerHTML = "";

            data.pedidos.forEach(p => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${p.id_pedido}</td>
                    <td>${p.id_alumno_bocadillo}</td>
                    <td>${p.id_bocadillo_pedido}</td>
                    <td>${parseFloat(p.precio_pedido).toFixed(2)} €</td>
                    <td>${p.fecha}</td>
                    <td>${p.fecha_recogida ?? ""}</td>
                    <td>
                        <button type="button" class="btn-edit" onclick='editarPedido(${JSON.stringify(p)})'>Editar</button>
                        <button type="button" class="btn-delete" onclick="eliminarPedido(${p.id_pedido})">Eliminar</button>
                    </td>
                `;

                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            mostrarMensajePedidos("Error de comunicación con el servidor.", true);
        });
}

// ====================== FORMULARIO ======================
function limpiarFormularioPedido() {
    document.getElementById("pedido-id-original").value = "";
    document.getElementById("pedido-id").value = "";
    document.getElementById("pedido-alumno").value = "";
    document.getElementById("pedido-bocadillo").value = "";
    document.getElementById("pedido-precio").value = "";
    document.getElementById("pedido-fecha").value = "";
    document.getElementById("pedido-fecha-recogida").value = "";
}

function editarPedido(p) {
    document.getElementById("pedido-id-original").value = p.id_pedido;
    document.getElementById("pedido-id").value = p.id_pedido;
    document.getElementById("pedido-alumno").value = p.id_alumno_bocadillo;
    document.getElementById("pedido-bocadillo").value = p.id_bocadillo_pedido;
    document.getElementById("pedido-precio").value = p.precio_pedido;
    document.getElementById("pedido-fecha").value = p.fecha;
    document.getElementById("pedido-fecha-recogida").value = p.fecha_recogida ?? "";
}

// ====================== GUARDAR (CREATE / UPDATE) ======================
function guardarPedido(e) {
    e.preventDefault();

    const idOriginal = document.getElementById("pedido-id-original").value;

    const pedido = {
        id_alumno_bocadillo: document.getElementById("pedido-alumno").value.trim(),
        id_bocadillo_pedido: document.getElementById("pedido-bocadillo").value.trim(),
        precio_pedido: document.getElementById("pedido-precio").value.trim(),
        fecha: document.getElementById("pedido-fecha").value,
        fecha_recogida: document.getElementById("pedido-fecha-recogida").value || null
    };

    if (!pedido.id_alumno_bocadillo || !pedido.id_bocadillo_pedido || !pedido.precio_pedido || !pedido.fecha) {
        mostrarMensajePedidos("Alumno, bocadillo, precio y fecha son obligatorios.", true);
        return;
    }

    const action = idOriginal ? "actualizarPedido" : "crearPedido";
    if (idOriginal) pedido.id_pedido_original = idOriginal;

    fetch(`${API_PEDIDOS}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarMensajePedidos(data.message || "Pedido guardado correctamente.");
                limpiarFormularioPedido();
                cargarPedidos();
            } else {
                mostrarMensajePedidos(data.message || "No se pudo guardar el pedido.", true);
            }
        })
        .catch(err => {
            console.error(err);
            mostrarMensajePedidos("Error de comunicación con el servidor.", true);
        });
}

// ====================== ELIMINAR ======================
function eliminarPedido(id_pedido) {
    if (!confirm("¿Seguro que quieres eliminar este pedido?")) return;

    fetch(`${API_PEDIDOS}?action=eliminarPedido`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pedido }),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarMensajePedidos(data.message || "Pedido eliminado correctamente.");
                cargarPedidos();
            } else {
                mostrarMensajePedidos(data.message || "No se pudo eliminar el pedido.", true);
            }
        })
        .catch(err => {
            console.error(err);
            mostrarMensajePedidos("Error de comunicación con el servidor.", true);
        });
}
