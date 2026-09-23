/* ============================================
   TEMAS DISPONIBLES
   ============================================ */
const TEMAS_DISPONIBLES = [
    'Verde', 'Azul', 'Rojo', 'Negro', 'Naranja', 'Morado',
    'Clásico', 'Dorado', 'Madera',
    'Kate', 'Cyberpunk', 'Volcano', 'Pixel', 'Esmeralda',
    'Candy', 'Oro', 'Pacifico', 'Halloween', 'Sport', 'Titan', 'Bronce'
];

/* ============================================
   FIGURA DIAGONAL POR DEFECTO
   ============================================ */
const FIGURA_DIAGONAL = {
    id: 'diagonal',
    nombre: 'Diagonal',
    patron: [
        [1,0,0,0,0],
        [0,1,0,0,0],
        [0,0,1,0,0],
        [0,0,0,1,0],
        [0,0,0,0,1]
    ],
    activa: true
};

/* ============================================
   ESTADO DEL EDITOR
   ============================================ */
let editorPatronActual = Array.from({length: 5}, () => Array(5).fill(0));

/* ============================================
   BLOQUEO DE MOVIMIENTO
   ============================================ */
let bloqueoMover = false;

/* ============================================
   ABRIR / CERRAR MODAL
   ============================================ */
function abrirConfiguracion() {
    const modal = document.getElementById('modalConfig');
    if (modal) {
        modal.classList.add('visible');
        cargarConfigEnModal();
        volverAlMenuConfig();
    }
}

function cerrarConfiguracion() {
    const modal = document.getElementById('modalConfig');
    if (modal) modal.classList.remove('visible');
}

/* ============================================
   NAVEGACIÓN ENTRE PANTALLAS DEL MODAL
   ============================================ */
function mostrarPantallaConfig(idPantalla) {
    document.querySelectorAll('.config-pantalla').forEach(p => p.classList.remove('visible'));
    const pantalla = document.getElementById(idPantalla);
    if (pantalla) pantalla.classList.add('visible');

    const titulo = document.getElementById('modalTitulo');
    if (!titulo) return;
    switch (idPantalla) {
        case 'pantallaAudio':            titulo.textContent = '🔊 Audio de voz'; break;
        case 'pantallaGeneral':          titulo.textContent = '⚙️ General'; break;
        case 'pantallaTemas':            titulo.textContent = '🎨 Temas'; break;
        case 'pantallaFiguras':          titulo.textContent = '🎯 Figuras'; break;
        case 'pantallaEditorFigura':     titulo.textContent = '✏️ Nueva figura'; break;
        case 'pantallaResaltados':       titulo.textContent = '✨ Resaltados'; break;
        case 'pantallaResaltadoFigura':  titulo.textContent = '🎯 Resaltado de figura'; break;
        case 'pantallaResaltadoNumero':  titulo.textContent = '🟡 Resaltado de número'; break;
        case 'pantallaVelocidad':        titulo.textContent = '⚡ Velocidad de bola'; break;
        case 'pantallaApariencia':       titulo.textContent = '📐 Apariencia'; break;
        default:                         titulo.textContent = '⚙️ Configuración';
    }

    const box = document.querySelector('.modal-box');
    if (box) box.scrollTop = 0;
}

function abrirSeccionConfig(nombre) {
    switch (nombre) {
        case 'audio':      mostrarPantallaConfig('pantallaAudio'); break;
        case 'general':    mostrarPantallaConfig('pantallaGeneral'); break;
        case 'temas':      mostrarPantallaConfig('pantallaTemas'); break;
        case 'figuras':    abrirPantallaFiguras(); break;
        case 'resaltados': mostrarPantallaConfig('pantallaResaltados'); break;
        case 'velocidad':  mostrarPantallaConfig('pantallaVelocidad'); break;
        case 'apariencia': mostrarPantallaConfig('pantallaApariencia'); break;
        default:           volverAlMenuConfig();
    }
}

function volverAlMenuConfig() {
    mostrarPantallaConfig('pantallaMenu');
}

/* ============================================
   CARGAR CONFIGURACIÓN EN EL MODAL
   ============================================ */
function cargarConfigEnModal() {
    try {
        const raw = localStorage.getItem('bingo_config');
        if (raw) {
            const config = JSON.parse(raw);
            const setVal = (id, v) => {
                const el = document.getElementById(id);
                if (el && v !== undefined) el.value = v;
            };
            setVal('cantCartones', config.cartones);
            setVal('usarBaseDatos', config.usarDB ? 'si' : 'no');
            setVal('formatoControl', config.formatoControl || '15x5');
            setVal('cantidadFiguras', config.cantidadFiguras);
            setVal('tamanoControl', config.tamanoControl);
            setVal('tamanoFiguras', config.tamanoFiguras);

            setVal('intensidadGlow', config.intensidadGlow !== undefined ? config.intensidadGlow : 95);
            setVal('intensidadSuave', config.intensidadSuave !== undefined ? config.intensidadSuave : 55);
            setVal('duracionPorCasilla', config.duracionPorCasilla !== undefined ? config.duracionPorCasilla : 260);

            setVal('intensidadGlowNumero', config.intensidadGlowNumero !== undefined ? config.intensidadGlowNumero : 95);
            setVal('intensidadHaloNumero', config.intensidadHaloNumero !== undefined ? config.intensidadHaloNumero : 55);

            setVal('velocidadBola', config.velocidadBola !== undefined ? config.velocidadBola : 650);

            const temasGuardados = Array.isArray(config.temasActivos) && config.temasActivos.length > 0
                ? config.temasActivos : ['Verde'];
            document.querySelectorAll('.tema-check').forEach(chk => {
                chk.checked = temasGuardados.includes(chk.value);
            });
        } else {
            document.querySelectorAll('.tema-check').forEach(chk => {
                chk.checked = chk.value === 'Verde';
            });
        }
    } catch (e) {}
    actualizarLabelsSliders();
    cargarControlesAudio();
}

/* ============================================
   LABELS DINÁMICOS DE LOS SLIDERS
   ============================================ */
function actualizarLabelsSliders() {
    const rangoTamano = document.getElementById('tamanoControl');
    const rangoFiguras = document.getElementById('tamanoFiguras');
    const valTamano = document.getElementById('valTamanoControl');
    const valFiguras = document.getElementById('valTamanoFiguras');
    if (rangoTamano && valTamano) {
        valTamano.textContent = rangoTamano.value + '%';
        rangoTamano.oninput = () => { valTamano.textContent = rangoTamano.value + '%'; };
    }
    if (rangoFiguras && valFiguras) {
        valFiguras.textContent = rangoFiguras.value + 'px';
        rangoFiguras.oninput = () => { valFiguras.textContent = rangoFiguras.value + 'px'; };
    }

    const rangoGlow = document.getElementById('intensidadGlow');
    const valGlow = document.getElementById('valIntensidadGlow');
    if (rangoGlow && valGlow) {
        valGlow.textContent = rangoGlow.value + '%';
        rangoGlow.oninput = () => { valGlow.textContent = rangoGlow.value + '%'; };
    }

    const rangoSuave = document.getElementById('intensidadSuave');
    const valSuave = document.getElementById('valIntensidadSuave');
    if (rangoSuave && valSuave) {
        valSuave.textContent = rangoSuave.value + '%';
        rangoSuave.oninput = () => { valSuave.textContent = rangoSuave.value + '%'; };
    }

    const rangoDur = document.getElementById('duracionPorCasilla');
    const valDur = document.getElementById('valDuracionPorCasilla');
    if (rangoDur && valDur) {
        valDur.textContent = rangoDur.value + ' ms';
        rangoDur.oninput = () => { valDur.textContent = rangoDur.value + ' ms'; };
    }

    const rangoGlowNum = document.getElementById('intensidadGlowNumero');
    const valGlowNum = document.getElementById('valIntensidadGlowNumero');
    if (rangoGlowNum && valGlowNum) {
        valGlowNum.textContent = rangoGlowNum.value + '%';
        rangoGlowNum.oninput = () => { valGlowNum.textContent = rangoGlowNum.value + '%'; };
    }

    const rangoHaloNum = document.getElementById('intensidadHaloNumero');
    const valHaloNum = document.getElementById('valIntensidadHaloNumero');
    if (rangoHaloNum && valHaloNum) {
        valHaloNum.textContent = rangoHaloNum.value + '%';
        rangoHaloNum.oninput = () => { valHaloNum.textContent = rangoHaloNum.value + '%'; };
    }

    const rangoVel = document.getElementById('velocidadBola');
    const valVel = document.getElementById('valVelocidadBola');
    if (rangoVel && valVel) {
        valVel.textContent = rangoVel.value + ' ms';
        rangoVel.oninput = () => { valVel.textContent = rangoVel.value + ' ms'; };
    }
}

/* ============================================
   🎛️ AUDIO DE VOZ - CARGAR Y GUARDAR
   ============================================ */
function cargarControlesAudio() {
    const rangoVol = document.getElementById('audioVolumen');
    const valVol = document.getElementById('valAudioVolumen');
    const rangoVel = document.getElementById('audioVelocidad');
    const valVel = document.getElementById('valAudioVelocidad');

    if (rangoVol && valVol) {
        const guardado = parseFloat(localStorage.getItem('audioVolumen'));
        const valor = !isNaN(guardado) ? guardado : 1.0;
        rangoVol.value = Math.round(valor * 100);
        valVol.textContent = Math.round(valor * 100) + '%';
        rangoVol.oninput = () => {
            const val = rangoVol.value;
            valVol.textContent = val + '%';
            localStorage.setItem('audioVolumen', val / 100);
        };
    }

    if (rangoVel && valVel) {
        const guardado = parseFloat(localStorage.getItem('audioVelocidad'));
        const valor = !isNaN(guardado) ? guardado : 1.0;
        rangoVel.value = Math.round(valor * 100);
        valVel.textContent = valor.toFixed(2) + 'x';
        rangoVel.oninput = () => {
            const val = rangoVel.value / 100;
            valVel.textContent = val.toFixed(2) + 'x';
            localStorage.setItem('audioVelocidad', val);
        };
    }
}

/* ============================================
   GUARDAR CONFIGURACIÓN
   ============================================ */
function guardarConfiguracion() {
    const temasActivos = [];
    document.querySelectorAll('.tema-check').forEach(chk => {
        if (chk.checked) temasActivos.push(chk.value);
    });
    if (temasActivos.length === 0) temasActivos.push('Verde');

    let figurasPersonalizadas = leerFigurasPersonalizadas();

    const config = {
        cartones: document.getElementById('cantCartones')?.value || '15',
        modo: '75',
        usarDB: document.getElementById('usarBaseDatos')?.value === 'si',
        formatoControl: document.getElementById('formatoControl')?.value || '15x5',
        cantidadFiguras: parseInt(document.getElementById('cantidadFiguras')?.value || '2'),
        tamanoControl: parseInt(document.getElementById('tamanoControl')?.value || '58'),
        tamanoFiguras: parseInt(document.getElementById('tamanoFiguras')?.value || '42'),
        intensidadGlow: parseInt(document.getElementById('intensidadGlow')?.value || '95'),
        intensidadSuave: parseInt(document.getElementById('intensidadSuave')?.value || '55'),
        duracionPorCasilla: parseInt(document.getElementById('duracionPorCasilla')?.value || '260'),
        intensidadGlowNumero: parseInt(document.getElementById('intensidadGlowNumero')?.value || '95'),
        intensidadHaloNumero: parseInt(document.getElementById('intensidadHaloNumero')?.value || '55'),
        velocidadBola: parseInt(document.getElementById('velocidadBola')?.value || '650'),
        temasActivos: temasActivos,
        figurasPersonalizadas: figurasPersonalizadas
    };
    localStorage.setItem('bingo_config', JSON.stringify(config));
    cerrarConfiguracion();
}

/* ============================================
   INICIAR JUEGO DIRECTO
   ============================================ */
function iniciarJuegoDirecto() {
    const existente = localStorage.getItem('bingo_config');
    if (!existente) {
        const temasActivos = [];
        document.querySelectorAll('.tema-check').forEach(chk => {
            if (chk.checked) temasActivos.push(chk.value);
        });
        if (temasActivos.length === 0) temasActivos.push('Verde');
        const config = {
            cartones: document.getElementById('cantCartones')?.value || '15',
            modo: '75',
            usarDB: document.getElementById('usarBaseDatos')?.value === 'si',
            formatoControl: document.getElementById('formatoControl')?.value || '15x5',
            cantidadFiguras: parseInt(document.getElementById('cantidadFiguras')?.value || '2'),
            tamanoControl: parseInt(document.getElementById('tamanoControl')?.value || '58'),
            tamanoFiguras: parseInt(document.getElementById('tamanoFiguras')?.value || '42'),
            intensidadGlow: parseInt(document.getElementById('intensidadGlow')?.value || '95'),
            intensidadSuave: parseInt(document.getElementById('intensidadSuave')?.value || '55'),
            duracionPorCasilla: parseInt(document.getElementById('duracionPorCasilla')?.value || '260'),
            intensidadGlowNumero: parseInt(document.getElementById('intensidadGlowNumero')?.value || '95'),
            intensidadHaloNumero: parseInt(document.getElementById('intensidadHaloNumero')?.value || '55'),
            velocidadBola: parseInt(document.getElementById('velocidadBola')?.value || '650'),
            temasActivos: temasActivos,
            figurasPersonalizadas: [Object.assign({}, FIGURA_DIAGONAL)]
        };
        localStorage.setItem('bingo_config', JSON.stringify(config));
    }
    window.location.href = 'juego.html';
}

/* ============================================
   CLICK FUERA DEL MODAL → CERRAR
   ============================================ */
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalConfig');
    if (modal && e.target === modal) cerrarConfiguracion();
});

/* ============================================
   LECTURA/ESCRITURA DE FIGURAS EN LOCALSTORAGE
   ============================================ */
function leerFigurasPersonalizadas() {
    try {
        const raw = localStorage.getItem('bingo_config');
        if (raw) {
            const config = JSON.parse(raw);
            if (Array.isArray(config.figurasPersonalizadas) && config.figurasPersonalizadas.length > 0) {
                return config.figurasPersonalizadas;
            }
        }
    } catch (e) {}

    return [Object.assign({}, FIGURA_DIAGONAL)];
}

function escribirFigurasPersonalizadas(figuras) {
    try {
        const raw = localStorage.getItem('bingo_config');
        let config = raw ? JSON.parse(raw) : {};
        config.figurasPersonalizadas = figuras;
        localStorage.setItem('bingo_config', JSON.stringify(config));
    } catch (e) {}
}

/* ============================================
   LISTA DE FIGURAS EN EL MODAL
   ============================================ */
function abrirPantallaFiguras() {
    renderizarListaFiguras();
    mostrarPantallaConfig('pantallaFiguras');
}

function renderizarListaFiguras(idDestacado) {
    const cont = document.getElementById('figurasLista');
    if (!cont) return;
    cont.innerHTML = '';

    const figuras = leerFigurasPersonalizadas();
    const total = figuras.length;

    figuras.forEach((fig, idx) => {
        const item = document.createElement('div');
        item.className = 'figura-item';
        item.dataset.id = fig.id;

        if (idDestacado && fig.id === idDestacado) {
            item.classList.add('destacado');
            setTimeout(() => item.classList.remove('destacado'), 700);
        }

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'figura-check';
        chk.checked = fig.activa !== false;
        chk.addEventListener('change', () => {
            if (!chk.checked) {
                const figurasActuales = leerFigurasPersonalizadas();
                const activas = figurasActuales.filter(f => f.activa !== false);
                if (activas.length <= 1) {
                    chk.checked = true;
                    alert('Debe haber al menos una figura activa');
                    return;
                }
            }
            toggleActivaFigura(fig.id, chk.checked);
        });

        const mini = document.createElement('div');
        mini.className = 'figura-mini';
        for (let f = 0; f < 5; f++) {
            for (let c = 0; c < 5; c++) {
                const celda = document.createElement('div');
                celda.className = 'figura-mini-celda';
                if (fig.patron[f] && fig.patron[f][c] === 1) celda.classList.add('activa');
                mini.appendChild(celda);
            }
        }

        const nombre = document.createElement('span');
        nombre.className = 'figura-nombre';
        nombre.textContent = fig.nombre;

        const flechas = document.createElement('div');
        flechas.className = 'figura-flechas';

        const btnUp = document.createElement('button');
        btnUp.className = 'figura-flecha';
        btnUp.textContent = '⬆️';
        btnUp.disabled = idx === 0;
        btnUp.addEventListener('click', () => moverFigura(fig.id, -1));

        const btnDown = document.createElement('button');
        btnDown.className = 'figura-flecha';
        btnDown.textContent = '⬇️';
        btnDown.disabled = idx === total - 1;
        btnDown.addEventListener('click', () => moverFigura(fig.id, +1));

        flechas.appendChild(btnUp);
        flechas.appendChild(btnDown);

        const btnBorrar = document.createElement('button');
        btnBorrar.className = 'figura-borrar';
        btnBorrar.textContent = '🗑️';
        btnBorrar.disabled = total <= 1;
        btnBorrar.addEventListener('click', () => borrarFigura(fig.id));

        item.appendChild(chk);
        item.appendChild(mini);
        item.appendChild(nombre);
        item.appendChild(flechas);
        item.appendChild(btnBorrar);

        cont.appendChild(item);
    });
}

function toggleActivaFigura(id, activa) {
    const figuras = leerFigurasPersonalizadas();
    const fig = figuras.find(f => f.id === id);
    if (!fig) return;
    fig.activa = activa;
    escribirFigurasPersonalizadas(figuras);
}

function borrarFigura(id) {
    let figuras = leerFigurasPersonalizadas();
    if (figuras.length <= 1) {
        alert('Debe quedar al menos una figura');
        return;
    }
    if (!confirm('¿Borrar esta figura?')) return;
    figuras = figuras.filter(f => f.id !== id);
    escribirFigurasPersonalizadas(figuras);
    renderizarListaFiguras();
}

function moverFigura(id, direccion) {
    if (bloqueoMover) return;
    bloqueoMover = true;

    try {
        const figuras = leerFigurasPersonalizadas();
        const idx = figuras.findIndex(f => f.id === id);

        if (idx === -1) return;

        const nuevoIdx = idx + direccion;

        if (nuevoIdx < 0 || nuevoIdx >= figuras.length) return;

        const temp = figuras[idx];
        figuras[idx] = figuras[nuevoIdx];
        figuras[nuevoIdx] = temp;

        escribirFigurasPersonalizadas(figuras);

        renderizarListaFiguras(id);
    } finally {
        requestAnimationFrame(() => {
            bloqueoMover = false;
        });
    }
}

/* ============================================
   EDITOR DE FIGURA NUEVA
   ============================================ */
function abrirEditorFiguraNueva() {
    editorPatronActual = Array.from({length: 5}, () => Array(5).fill(0));
    const inputNombre = document.getElementById('nombreFigura');
    if (inputNombre) inputNombre.value = '';
    renderizarEditorGrid();
    mostrarPantallaConfig('pantallaEditorFigura');
}

function cerrarEditorFigura() {
    abrirPantallaFiguras();
}

function renderizarEditorGrid() {
    const grid = document.getElementById('editorGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let f = 0; f < 5; f++) {
        for (let c = 0; c < 5; c++) {
            const celda = document.createElement('div');
            celda.className = 'editor-celda';
            if (editorPatronActual[f][c] === 1) celda.classList.add('activa');
            celda.addEventListener('click', () => {
                editorPatronActual[f][c] = editorPatronActual[f][c] === 1 ? 0 : 1;
                celda.classList.toggle('activa');
            });
            grid.appendChild(celda);
        }
    }
}

function guardarFiguraNueva() {
    const inputNombre = document.getElementById('nombreFigura');
    const nombre = (inputNombre?.value || '').trim();
    if (!nombre) {
        alert('Ponle un nombre a la figura');
        return;
    }
    let tieneAlguna = false;
    for (let f = 0; f < 5; f++) {
        for (let c = 0; c < 5; c++) {
            if (editorPatronActual[f][c] === 1) tieneAlguna = true;
        }
    }
    if (!tieneAlguna) {
        alert('Marca al menos una celda en la figura');
        return;
    }

    const figuras = leerFigurasPersonalizadas();
    const nuevaFigura = {
        id: 'fig_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        nombre: nombre,
        patron: editorPatronActual.map(row => row.slice()),
        activa: true
    };
    figuras.push(nuevaFigura);
    escribirFigurasPersonalizadas(figuras);
    abrirPantallaFiguras();
}