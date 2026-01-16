

// --- FUNCIÓN 1: REGISTRO ---          //RECORDATORIO DE "=" SU FUNCIÓN ES ASIGNAR Y "==" ES COMPARAR
function registrarUsuario() {
    const nombre = document.getElementById("reg-nombre").value;
    const email = document.getElementById("reg-email").value;
    const contraseña = document.getElementById("reg-pass").value;

    if (nombre === "" || email === "" || contraseña === "") {
        alert("Todos los campos son obligatorios.");
        return;
    }

    // Traer la base de datos o iniciarla vacía
    const listaUsuarios = JSON.parse(localStorage.getItem("db_usuarios")) || [];

    // Crear el nuevo usuario (con saldo 0)
    const usuario = {
        nombre: nombre,
        email: email,
        contraseña: contraseña,
        saldo: 0
    };

    //  Guardar
    listaUsuarios.push(usuario);
    localStorage.setItem("db_usuarios", JSON.stringify(listaUsuarios));

    alert("Usuario registrado exitosamente");
    window.location.reload();
}

// -- LOGIN ---
function login() {

    const emailIngreso = document.getElementById("user-email").value;
    const contraseñaIngreso = document.getElementById("user-pass").value;

    //Traer la lista
    const listaUsuarios = JSON.parse(localStorage.getItem("db_usuarios")) || [];

    //Buscar al usuario
    const usuarioValido = listaUsuarios.find(
        usuario => usuario.email === emailIngreso && usuario.contraseña === contraseñaIngreso
    );

    if (usuarioValido) {
        //Guardamos datos clave para la sesión
        localStorage.setItem("nombre_usuario", usuarioValido.nombre); // Para el saludo
        localStorage.setItem("email_usuario", usuarioValido.email);   // Para identificarlo en depósitos

        // Redirigir.
        window.location.href = "menu.html";
    } else {
        alert("Correo o contraseña incorrectas");
    }
}

//  LÓGICA DE MENÚ (Saludo y Saldo) ---
$(document).ready(function () {

    // A. Identificar quién está conectado
    const emailLogueado = localStorage.getItem("email_usuario");
    const nombreLogueado = localStorage.getItem("nombre_usuario");

    // Si estamos en la página menú y no hay usuario, mandarlo al login.
    // (Verificamos si existe el elemento 'saludo' para saber si estamos en menu.html)
    if ($("#SaludoNav").length > 0 && !emailLogueado) {
        window.location.href = "login.html";
        return;
    }

    // Poner el nombre en el Navbar.
    if (nombreLogueado) {
  
        $("#SaludoNav").text(nombreLogueado); 
    }

    //  Mostrar el saldo real (nuevo).
   
    const listaUsuarios = JSON.parse(localStorage.getItem("db_usuarios")) || [];
    
    //  Buscamos al usuario actual por su email.
    const usuarioActual = listaUsuarios.find(user => user.email === emailLogueado);

    //  Mostrar el saldo actual.
    if (usuarioActual) {
        $("#saldo-display").text("$ " + usuarioActual.saldo);
    }
});


// Es el depósito a una cuenta "propia".
function depositar() {
    // 1. VALIDACIONES
    const emailUsuario = localStorage.getItem("email_usuario");
    if (!emailUsuario) {
        alert("Inicie Sesión para realizar un depósito");
        window.location.href = "login.html";
        return;
    }

    const monto = Number(document.getElementById("monto-depositar").value);
    
    if (monto <= 0 || isNaN(monto)) {
        alert("Por favor, ingrese un monto válido.");
        return;
    }

    // 2. Buscar usuario.
    const listaUsuarios = JSON.parse(localStorage.getItem("db_usuarios")) || [];
    const usuarioEncontrado = listaUsuarios.find(user => user.email === emailUsuario);

    if (usuarioEncontrado) {
        //  Actualizar saldo.
        usuarioEncontrado.saldo = Number(usuarioEncontrado.saldo) + monto;

        // ---lógica de historial ---
        
        //  Si no tiene la "carpeta" de transacciones, la creamos.
        if (!usuarioEncontrado.transacciones) {
            usuarioEncontrado.transacciones = [];
        }

        // B. Se crea  el recibo.
        const nuevaTransaccion = {
            fecha: new Date().toLocaleDateString(), // <--- OJO: Faltaban los () aquí
            tipo: "Depósito",
            monto: monto
        };

        // C. guardar  el recibo en la carpeta.
        usuarioEncontrado.transacciones.push(nuevaTransaccion);

        // -------------------------------------

        // 4. Guardar todo y salir.
        localStorage.setItem("db_usuarios", JSON.stringify(listaUsuarios));

        alert("¡Depósito realizado con éxito!");
        window.location.href = "menu.html";

    } else {
        alert("Error: Usuario no encontrado.");
    }
}


//------------------TRANSFERENCIA--------------------------
function transferir() {
    console.log(" INICIO DE TRANSFERENCIA");

    // 1. Obtención de datos.
    const emailRemitente = localStorage.getItem("email_usuario");
    const emailDestino = document.getElementById("email-destino").value;
    const monto = Number(document.getElementById("monto-transferencia").value);

    // 2. Validaciones.
    if (!emailRemitente) {
        alert("Sesión no válida");
        window.location.href = "login.html";
        return;
    }
    if (emailRemitente === emailDestino) {
        alert("No puedes enviarte dinero a ti mismo.");
        return;
    }
    if (monto <= 0 || isNaN(monto)) {
        alert("Ingresa un monto válido.");
        return;
    }

    //  Buscar usuarios
    const listaUsuarios = JSON.parse(localStorage.getItem("db_usuarios")) || [];
    const usuarioRemitente = listaUsuarios.find(user => user.email === emailRemitente);
    const usuarioDestino = listaUsuarios.find(user => user.email === emailDestino);

    if (!usuarioRemitente) { alert("ERROR: Tu usuario no existe"); return; }
    if (!usuarioDestino) { alert("El correo del destinatario no existe."); return; }

    if (usuarioRemitente.saldo < monto) {
        alert("Fondos insuficientes. Tu saldo es $" + usuarioRemitente.saldo);
        return;
    }

    // Mover el dinero (saldo)
    usuarioRemitente.saldo = Number(usuarioRemitente.saldo) - monto;
    usuarioDestino.saldo = (Number(usuarioDestino.saldo) || 0) + monto;

    // lógica de historial (doble) 

    //  Inicializar arrays si no existen
    if (!usuarioRemitente.transacciones) usuarioRemitente.transacciones = [];
    if (!usuarioDestino.transacciones) usuarioDestino.transacciones = [];

    const fechaHoy = new Date().toLocaleDateString();

    // B. Recibo propio
    usuarioRemitente.transacciones.push({
        fecha: fechaHoy,
        tipo: "Transferencia Enviada",
        detalle: `A: ${emailDestino}`,
        monto: -monto // Negativo
    });

    //  Recibo para el otro
    usuarioDestino.transacciones.push({
        fecha: fechaHoy,
        tipo: "Transferencia Recibida",
        detalle: `De: ${emailRemitente}`,
        monto: monto // Positivo
    });

    // ---------------------------------------------

    // Guardar y salir.
    localStorage.setItem("db_usuarios", JSON.stringify(listaUsuarios));

    alert("¡Transferencia realizada con éxito!");
    window.location.href = "menu.html";
}


// ----------- Cerrar sesión ---------------------
function salir() {

    // Borrar "sesión".
    localStorage.removeItem("email_usuario");
    localStorage.removeItem("nombre_usuario");
    window.location.href = "index.html"
}

//  CARGAR HISTORIAL EN LA TABLA 
function cargarHistorial() {
    //  Buscamos la tabla en el HTML (asegúrate que tu <tbody> tenga este ID).
    const tabla = document.getElementById("tabla-movimientos");
    
    // Si no existe la tabla (ej: estamos en el login), paramos para no dar error.
    if (!tabla) return; 

    // 2. Traer al usuario logueado.
    const emailUsuario = localStorage.getItem("email_usuario");
    const listaUsuarios = JSON.parse(localStorage.getItem("db_usuarios")) || [];
    const usuario = listaUsuarios.find(u => u.email === emailUsuario);

    //  Limpiar la tabla antes de llenarla.
    tabla.innerHTML = "";

    // Validar si tiene historial.
    if (!usuario || !usuario.transacciones || usuario.transacciones.length === 0) {
        tabla.innerHTML = '<tr><td colspan="4" class="text-center">No tienes movimientos aún.</td></tr>';
        return;
    }

    // Recorrer el historial y dibujar las filas.
    // (.reverse() sirve para mostrar lo más nuevo arriba)
    // Usamos [...usuario.transacciones] para hacer una copia y no romper el original al revertir.
    [...usuario.transacciones].reverse().forEach(mov => {
        
        // verde si es positivo, rojo si es negativo.
        const colorMonto = mov.monto > 0 ? "text-success" : "text-danger";
        const simbolo = mov.monto > 0 ? "+" : "";

        const fila = `
            <tr>
                <td>${mov.fecha}</td>
                <td>${mov.tipo}</td>
                <td>${mov.detalle || "-"}</td>
                <td class="${colorMonto} font-weight-bold">
                    ${simbolo}$${mov.monto}
                </td>
            </tr>
        `;
        
        // Insertar en el HTML.
        tabla.innerHTML += fila;
    });
}

//  LÓGICA DE MENÚ
$(document).ready(function () {

    // A. Identificar quién está conectado.
    const emailLogueado = localStorage.getItem("email_usuario");
    const nombreLogueado = localStorage.getItem("nombre_usuario");

    // Si estamos en página interna y no hay usuario, ir al login.
    if ($("#SaludoNav").length > 0 && !emailLogueado) {
        window.location.href = "login.html";
        return;
    }

  
    if (nombreLogueado) {
        $("#SaludoNav").text(nombreLogueado); 
    }

  
    const listaUsuarios = JSON.parse(localStorage.getItem("db_usuarios")) || [];
    const usuarioActual = listaUsuarios.find(user => user.email === emailLogueado);

    if (usuarioActual) {
        $("#saldo-display").text("$ " + usuarioActual.saldo);
    }

    // Cargar historial.
    cargarHistorial(); 
});







// --- CARGAR CONTACTOS PARA AUTOCOMPLETAR ---
function cargarContactos() {
    //  Buscamos el elemento "datalist" en el HTML
    const datalist = document.getElementById("lista-contactos");
    if (!datalist) return; // Si no estamos en la página de transferencias, no hacemos nada.

    //Traemos a todos los usuarios
    const listaUsuarios = JSON.parse(localStorage.getItem("db_usuarios")) || [];
    const miEmail = localStorage.getItem("email_usuario");

    //Limpiamos la lista.
    datalist.innerHTML = "";

    // se llena la lista con todos MENOS conmigo mismo.
    listaUsuarios.forEach(user => {

        // Solo agrego si el email NO es el mío.
        if (user.email !== miEmail) {
            const opcion = document.createElement("option");
            opcion.value = user.email; // Lo que se escribe en el input
            opcion.label = user.nombre; // Lo que se ve como ayuda
            datalist.appendChild(opcion);
        }
    });
}

$(document).ready(function () {
    cargarHistorial();
    cargarContactos();
});