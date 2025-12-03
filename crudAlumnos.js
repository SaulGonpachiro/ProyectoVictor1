// crudAlumnos.js

document.addEventListener("DOMContentLoaded", () => {
    cargarAlumnos();

    const form = document.getElementById("form-alumno");
    if (form) form.addEventListener("submit", guardarAlumno);

    const inputBusqueda = document.getElementById("alumnos-busqueda");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("keyup", pintarAlumnos);
    }

    const filtroCurso = document.getElementById("alumnos-curso-filtro");
    if (filtroCurso) {
        filtroCurso.addEventListener("change", pintarAlumnos);
    }
});

const API_ALUMNOS = "sw_alumno.php";
let listaAlumnos = [];

function mostrarMensajeAlumnos(texto, esError = false) {
    const p = document.getElementById("alumnos-mensaje");
    if (!p) return;
    p.textContent = texto;
    p.style.color = esError ? "red" : "green";
}

function cargarAlumnos() {
    fetch(`${API_ALUMNOS}?action=listarAlumnos`)
        .then(r => r.json())
        .then(data => {
            if (!data.success) {
                mostrarMensajeAlumnos(data.message || "Error al cargar alumnos", true);
                return;
            }

            listaAlumnos = data.alumnos || [];
            pintarAlumnos();
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeAlumnos("Error de comunicación con el servidor.", true);
        });
}

function pintarAlumnos() {
    const tbody = document.getElementById("tbody-alumnos");
    if (!tbody) return;

    const texto = document.getElementById("alumnos-busqueda").value.toLowerCase().trim();
    const cursoSel = document.getElementById("alumnos-curso-filtro").value;

    let resultado = listaAlumnos;

    if (texto !== "") {
        resultado = resultado.filter(al =>
            al.nombre.toLowerCase().includes(texto)
        );
    }

    if (cursoSel !== "") {
        resultado = resultado.filter(al =>
            (al.id_curso_alumno || "") === cursoSel
        );
    }

    tbody.innerHTML = "";

    resultado.forEach(al => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${al.nombre}</td>
            <td>${al.id_email_usuario}</td>
            <td>${parseFloat(al.monedero).toFixed(2)} €</td>
            <td>${al.id_curso_alumno || ""}</td>
            <td>
                <button class="btn-edit" onclick='editarAlumno(${JSON.stringify(al)})'>Editar</button>
                <button class="btn-delete" onclick='eliminarAlumno(${JSON.stringify(al.nombre)})'>Eliminar</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function limpiarFormularioAlumno() {
    document.getElementById("alumno-nombre-original").value = "";
    document.getElementById("alumno-nombre").value = "";
    document.getElementById("alumno-email").value = "";
    document.getElementById("alumno-monedero").value = "";
    document.getElementById("alumno-curso").value = "";
}

function editarAlumno(al) {
    document.getElementById("alumno-nombre-original").value = al.nombre;
    document.getElementById("alumno-nombre").value = al.nombre;
    document.getElementById("alumno-email").value = al.id_email_usuario;
    document.getElementById("alumno-monedero").value = al.monedero;
    document.getElementById("alumno-curso").value = al.id_curso_alumno || "";
}

function guardarAlumno(e) {
    e.preventDefault();

    const original = document.getElementById("alumno-nombre-original").value;

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

    const action = original ? "actualizarAlumno" : "crearAlumno";
    if (original) alumno.nombre_original = original;

    fetch(`${API_ALUMNOS}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumno),
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                mostrarMensajeAlumnos(data.message);
                limpiarFormularioAlumno();
                cargarAlumnos();
            } else {
                mostrarMensajeAlumnos(data.message, true);
            }
        });
}

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
                mostrarMensajeAlumnos(data.message);
                cargarAlumnos();
            } else {
                mostrarMensajeAlumnos(data.message, true);
            }
        });
}
