// crudAlumnos.js

document.addEventListener("DOMContentLoaded", () => {
    // verificarAcceso() ya se llama en el HTML (script inline en crudAlumnos.html)
    cargarAlumnos();

    const form = document.getElementById("form-alumno");
    if (form) {
        form.addEventListener("submit", guardarAlumno);
    }
});

const API_ALUMNOS = "sw_alumno.php";

function mostrarMensajeAlumnos(texto, esError = false) {
    const p = document.getElementById("alumnos-mensaje");
    if (!p) return;
    p.textContent = texto;
    p.style.color = esError ? "red" : "green";
}

// ====================== LISTAR ======================
function cargarAlumnos() {
    fetch(`${API_ALUMNOS}?action=listarAlumnos`)
        .then(r => r.json())
        .then(data => {
            if (!data.success) {
                mostrarMensajeAlumnos(data.message || "Error al cargar alumnos", true);
                return;
            }

            const tbody = document.getElementById("tbody-alumnos");
            if (!tbody) return;

            tbody.innerHTML = "";

            data.alumnos.forEach(al => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${al.nombre}</td>
                    <td>${al.id_email_usuario}</td>
                    <td>${parseFloat(al.monedero).toFixed(2)} €</td>
                    <td>${al.id_curso_alumno ? al.id_curso_alumno : ""}</td>
                    <td>
                        <button type="button" class="btn-small" onclick='editarAlumno(${JSON.stringify(al)})'>Editar</button>
                        <button type="button" class="btn-small danger" onclick="eliminarAlumno(${JSON.stringify(al.nombre)})">Eliminar</button>
                    </td>
                `;

                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeAlumnos("Error de comunicación con el servidor.", true);
        });
}

// ====================== FORMULARIO ======================
function limpiarFormularioAlumno() {
    const nombreOriginal = document.getElementById("alumno-nombre-original");
    const nombre = document.getElementById("alumno-nombre");
    const email = document.getElementById("alumno-email");
    const monedero = document.getElementById("alumno-monedero");
    const curso = document.getElementById("alumno-curso");

    if (nombreOriginal) nombreOriginal.value = "";
    if (nombre) nombre.value = "";
    if (email) email.value = "";
    if (monedero) monedero.value = "";
    if (curso) curso.value = "";
}

function editarAlumno(al) {
    document.getElementById("alumno-nombre-original").value = al.nombre;
    document.getElementById("alumno-nombre").value = al.nombre;
    document.getElementById("alumno-email").value = al.id_email_usuario;
    document.getElementById("alumno-monedero").value = al.monedero;
    document.getElementById("alumno-curso").value = al.id_curso_alumno ? al.id_curso_alumno : "";
}

// ====================== GUARDAR (CREATE / UPDATE) ======================
function guardarAlumno(e) {
    e.preventDefault();

    const nombreOriginal = document.getElementById("alumno-nombre-original").value;

    const alumno = {
        nombre: document.getElementById("alumno-nombre").value.trim(),
        id_email_usuario: document.getElementById("alumno-email").value.trim(),
        monedero: document.getElementById("alumno-monedero").value.trim(),
        id_curso_alumno: document.getElementById("alumno-curso").value.trim()
    };

    if (!alumno.nombre || !alumno.id_email_usuario) {
        mostrarMensajeAlumnos("Nombre y email son obligatorios.", true);
        return;
    }

    const action = nombreOriginal ? "actualizarAlumno" : "crearAlumno";
    if (nombreOriginal) alumno.nombre_original = nombreOriginal;

    fetch(`${API_ALUMNOS}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumno),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarMensajeAlumnos(data.message || "Alumno guardado correctamente.");
                limpiarFormularioAlumno();
                cargarAlumnos();
            } else {
                mostrarMensajeAlumnos(data.message || "No se pudo guardar el alumno.", true);
            }
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeAlumnos("Error de comunicación con el servidor.", true);
        });
}

// ====================== ELIMINAR ======================
function eliminarAlumno(nombre) {
    if (!confirm("¿Seguro que quieres eliminar este alumno?")) return;

    fetch(`${API_ALUMNOS}?action=eliminarAlumno`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarMensajeAlumnos(data.message || "Alumno eliminado correctamente.");
                cargarAlumnos();
            } else {
                mostrarMensajeAlumnos(data.message || "No se pudo eliminar el alumno.", true);
            }
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeAlumnos("Error de comunicación con el servidor.", true);
        });
}
