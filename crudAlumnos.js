// crudAlumnos.js

document.addEventListener("DOMContentLoaded", () => {
    cargarAlumnos();

    const form = document.getElementById("form-alumno");
    if (form) form.addEventListener("submit", guardarAlumno);

    const inputBusqueda = document.getElementById("alumnos-busqueda");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("keyup", () => {
            paginaActualAlumnos = 1;
            pintarAlumnos();
        });
    }

    const filtroCurso = document.getElementById("alumnos-curso-filtro");
    if (filtroCurso) {
        filtroCurso.addEventListener("change", () => {
            paginaActualAlumnos = 1;
            pintarAlumnos();
        });
    }
});

// =========================
//  VARIABLES GLOBALES
// =========================
const API_ALUMNOS = "sw_alumno.php";
let listaAlumnos = [];
let alumnosFiltrados = [];
let paginaActualAlumnos = 1;
const ALUMNOS_POR_PAGINA = 8;

// =========================
//  UTILIDAD MENSAJES
// =========================
function mostrarMensajeAlumnos(texto, esError = false) {
    const p = document.getElementById("alumnos-mensaje");
    if (!p) return;
    p.textContent = texto;
    p.style.color = esError ? "red" : "green";
}

// =========================
//  CARGAR ALUMNOS
// =========================
function cargarAlumnos() {
    fetch(`${API_ALUMNOS}?action=listarAlumnos`)
        .then(r => r.json())
        .then(data => {
            if (!data.success) {
                mostrarMensajeAlumnos(data.message || "Error al cargar alumnos", true);
                return;
            }

            listaAlumnos = data.alumnos || [];
            paginaActualAlumnos = 1;   // siempre empezamos en la página 1
            pintarAlumnos();
        })
        .catch(err => {
            console.error(err);
            mostrarMensajeAlumnos("Error de comunicación con el servidor.", true);
        });
}

// =========================
//  PINTAR ALUMNOS + PAGINAR
// =========================
function pintarAlumnos() {
    const tbody = document.getElementById("tbody-alumnos");
    if (!tbody) return;

    const inputBusqueda = document.getElementById("alumnos-busqueda");
    const filtroCurso = document.getElementById("alumnos-curso-filtro");

    const texto = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : "";
    const cursoSel = filtroCurso ? filtroCurso.value : "";

    let resultado = listaAlumnos;

    // Filtro por texto (nombre)
    if (texto !== "") {
        resultado = resultado.filter(al =>
            (al.nombre || "").toLowerCase().includes(texto)
        );
    }

    // Filtro por curso
    if (cursoSel !== "") {
        resultado = resultado.filter(al =>
            (al.id_curso_alumno || "") === cursoSel
        );
    }

    alumnosFiltrados = resultado;

    // ===== PAGINACIÓN =====
    const totalAlumnos = resultado.length;
    const totalPaginas = Math.max(1, Math.ceil(totalAlumnos / ALUMNOS_POR_PAGINA));

    if (paginaActualAlumnos > totalPaginas) paginaActualAlumnos = totalPaginas;
    if (paginaActualAlumnos < 1) paginaActualAlumnos = 1;

    const inicio = (paginaActualAlumnos - 1) * ALUMNOS_POR_PAGINA;
    const fin = inicio + ALUMNOS_POR_PAGINA;

    const pagina = resultado.slice(inicio, fin);

    // Limpiamos tabla y pintamos solo los de esta página
    tbody.innerHTML = "";

    pagina.forEach(al => {
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

    // Paginador
    pintarPaginacionAlumnos(totalPaginas, totalAlumnos);
}

// =========================
//  PINTAR PAGINADOR
// =========================
function pintarPaginacionAlumnos(totalPaginas, totalAlumnos) {
    const container = document.getElementById("paginacion-alumnos");
    if (!container) return;

    container.innerHTML = "";

    if (totalPaginas <= 1) {
        // Si solo hay una página, solo ponemos info
        container.textContent = `Mostrando ${totalAlumnos} alumno(s)`;
        return;
    }

    const info = document.createElement("span");
    info.className = "paginacion-info";
    info.textContent = `Página ${paginaActualAlumnos} de ${totalPaginas}`;
    container.appendChild(info);


    const botones = document.createElement("div");
    botones.className = "paginacion-botones";
    container.appendChild(botones);

    const crearBoton = (texto, pagina, disabled = false, active = false) => {
        const btn = document.createElement("button");
        btn.textContent = texto;
        btn.className = "paginacion-btn";
        if (active) btn.classList.add("activo");
        if (disabled) {
            btn.disabled = true;
        } else {
            btn.addEventListener("click", () => {
                paginaActualAlumnos = pagina;
                pintarAlumnos();
            });
        }
        botones.appendChild(btn);
    };

    // Anterior
    crearBoton("«", paginaActualAlumnos - 1, paginaActualAlumnos === 1);

    // Números
    for (let i = 1; i <= totalPaginas; i++) {
        crearBoton(String(i), i, false, i === paginaActualAlumnos);
    }

    // Siguiente
    crearBoton("»", paginaActualAlumnos + 1, paginaActualAlumnos === totalPaginas);
}

// =========================
//  FORMULARIO / CRUD
// =========================
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
