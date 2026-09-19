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
   ESTADO DEL DRAG & DROP
   ============================================ */
let dragEstado = {
    activo: false,
    item: null,
    placeholder: null,
    offsetY: 0,
    startY: 0,
    startX: 0,
    longPressTimer: null,
    idxOriginal: -1,
    contenedor: null
};
const LONG_PRESS_MS = 200;

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
        case 'pantallaGeneral':       titulo.textContent = '⚙️ General'; break;
        case 'pantallaTemas':         titulo.textContent = '🎨 Temas'; break;
        case 'pantallaFiguras':       titulo.textContent = '🎯 Figuras'; break;
        case 'pantallaEditorFigura':  titulo.textContent = '✏️ Nueva figura'; break;
        case 'pantallaResaltado':     titulo.textContent = '✨ Resaltado de figura'; break;
        case 'pantallaApariencia':    titulo.textContent = '📐 Apariencia'; break;
        default:                      titulo.textContent = '⚙️ Configuración';
    }

    const box = document.querySelector('.modal-box');
    if (box) box.scrollTop = 0;
}

function abrirSeccionConfig(nombre) {
    switch (nombre) {
        case 'general':    mostrarPantallaConfig('pantallaGeneral'); break;
        case 'temas':      mostrarPantallaConfig('pantallaTemas'); break;
        case 'figuras':    abrirPantallaFiguras(); break;
        case 'resaltado':  mostrarPantallaConfig('pantallaResaltado'); break;
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

function renderizarListaFiguras() {
    const cont = document.getElementById('figurasLista');
    if (!cont) return;
    cont.innerHTML = '';

    const figuras = leerFigurasPersonalizadas();

    figuras.forEach((fig) => {
        const item = document.createElement('div');
        item.className = 'figura-item';
        item.dataset.id = fig.id;

        // Handle de drag (no hace falta botón visible, pero dejamos un índice visual)
        // Checkbox activa
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'figura-check';
        chk.checked = fig.activa !== false;
        chk.addEventListener('change', (e) => {
            e.stopPropagation();
            if (!chk.checked) {
                const activas = leerFigurasPersonalizadas().filter(f => f.activa !== false);
                if (activas.length <= 1) {
                    chk.checked = true;
                    alert('Debe haber al menos una figura activa');
                    return;
                }
            }
            toggleActivaFigura(fig.id, chk.checked);
        });
        // Evitar que el drag se active al pulsar el checkbox
        chk.addEventListener('pointerdown', (e) => e.stopPropagation());

        // Mini-cartón de vista previa
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

        // Nombre
        const nombre = document.createElement('span');
        nombre.className = 'figura-nombre';
        nombre.textContent = fig.nombre;

        // Botón borrar
        const btnBorrar = document.createElement('button');
        btnBorrar.className = 'figura-borrar';
        btnBorrar.textContent = '🗑️';
        btnBorrar.disabled = figuras.length <= 1;
        btnBorrar.addEventListener('click', (e) => {
            e.stopPropagation();
            borrarFigura(fig.id);
        });
        btnBorrar.addEventListener('pointerdown', (e) => e.stopPropagation());

        item.appendChild(chk);
        item.appendChild(mini);
        item.appendChild(nombre);
        item.appendChild(btnBorrar);

        // Drag con long press sobre toda la fila
        item.addEventListener('pointerdown', (e) => iniciarLongPress(e, item));

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

/* ============================================
   DRAG & DROP CON LONG PRESS
   ============================================ */
function iniciarLongPress(e, item) {
    // Ignorar clic derecho u otros botones que no sean primario/táctil
    if (e.button !== undefined && e.button !== 0) return;

    const cont = item.parentElement;
    if (!cont) return;

    dragEstado.startX = e.clientX;
    dragEstado.startY = e.clientY;
    dragEstado.item = item;
    dragEstado.contenedor = cont;

    // Cancelar si el usuario mueve el dedo antes de tiempo (scroll)
    const cancelarPorMovimiento = (ev) => {
        const dx = Math.abs(ev.clientX - dragEstado.startX);
        const dy = Math.abs(ev.clientY - dragEstado.startY);
        if (dx > 8 || dy > 8) {
            cancelarLongPress();
        }
    };
    const cancelarPorSoltar = () => {
        cancelarLongPress();
    };

    item._cancelarPorMovimiento = cancelarPorMovimiento;
    item._cancelarPorSoltar = cancelarPorSoltar;

    window.addEventListener('pointermove', cancelarPorMovimiento, { passive: true });
    window.addEventListener('pointerup', cancelarPorSoltar);
    window.addEventListener('pointercancel', cancelarPorSoltar);

    dragEstado.longPressTimer = setTimeout(() => {
        // Se cumplió el tiempo → activamos el drag
        activarDrag(item, e);
    }, LONG_PRESS_MS);
}

function cancelarLongPress() {
    if (dragEstado.longPressTimer) {
        clearTimeout(dragEstado.longPressTimer);
        dragEstado.longPressTimer = null;
    }
    const item = dragEstado.item;
    if (item) {
        if (item._cancelarPorMovimiento) window.removeEventListener('pointermove', item._cancelarPorMovimiento);
        if (item._cancelarPorSoltar) {
            window.removeEventListener('pointerup', item._cancelarPorSoltar);
            window.removeEventListener('pointercancel', item._cancelarPorSoltar);
        }
    }
}

function activarDrag(item, e) {
    dragEstado.activo = true;
    dragEstado.longPressTimer = null;

    // Quitar los listeners temporales de cancelación por movimiento
    if (item._cancelarPorMovimiento) window.removeEventListener('pointermove', item._cancelarPorMovimiento);
    if (item._cancelarPorSoltar) {
        window.removeEventListener('pointerup', item._cancelarPorSoltar);
        window.removeEventListener('pointercancel', item._cancelarPorSoltar);
    }

    const rect = item.getBoundingClientRect();
    dragEstado.offsetY = e.clientY - rect.top;

    // Guardar tamaño y crear placeholder del mismo alto
    const placeholder = document.createElement('div');
    placeholder.className = 'figura-placeholder';
    placeholder.style.height = rect.height + 'px';
    item.parentElement.insertBefore(placeholder, item);
    dragEstado.placeholder = placeholder;

    // Estilos del item mientras se arrastra
    item.classList.add('arrastrando');
    item.style.width = rect.width + 'px';
    item.style.position = 'fixed';
    item.style.left = rect.left + 'px';
    item.style.top = rect.top + 'px';
    item.style.pointerEvents = 'none';
    item.style.zIndex = 9999;

    // Bloquear vibración si está disponible (feedback táctil)
    if (navigator.vibrate) navigator.vibrate(15);

    // Seguir el dedo
    window.addEventListener('pointermove', moverDrag);
    window.addEventListener('pointerup', soltarDrag);
    window.addEventListener('pointercancel', soltarDrag);
}

function moverDrag(e) {
    if (!dragEstado.activo || !dragEstado.item) return;
    const item = dragEstado.item;
    const y = e.clientY - dragEstado.offsetY;
    item.style.top = y + 'px';

    // Detectar sobre qué elemento estamos
    const cont = dragEstado.contenedor;
    const hijos = Array.from(cont.children).filter(c =>
        c !== item && !c.classList.contains('figura-placeholder')
    );

    const itemRect = item.getBoundingClientRect();
    const centroY = itemRect.top + itemRect.height / 2;

    let objetivo = null;
    for (const hijo of hijos) {
        const r = hijo.getBoundingClientRect();
        if (centroY >= r.top && centroY <= r.bottom) {
            objetivo = hijo;
            break;
        }
    }

    if (objetivo) {
        const r = objetivo.getBoundingClientRect();
        const centroObjetivo = r.top + r.height / 2;
        if (centroY < centroObjetivo) {
            cont.insertBefore(dragEstado.placeholder, objetivo);
        } else {
            cont.insertBefore(dragEstado.placeholder, objetivo.nextSibling);
        }
    }
}

function soltarDrag() {
    if (!dragEstado.activo || !dragEstado.item) return;
    const item = dragEstado.item;
    const placeholder = dragEstado.placeholder;
    const cont = dragEstado.contenedor;

    // Restaurar estilos del item
    item.classList.remove('arrastrando');
    item.style.position = '';
    item.style.left = '';
    item.style.top = '';
    item.style.width = '';
    item.style.pointerEvents = '';
    item.style.zIndex = '';

    // Mover el item al hueco del placeholder
    if (placeholder && placeholder.parentElement === cont) {
        cont.insertBefore(item, placeholder);
        cont.removeChild(placeholder);
    }

    // Limpiar listeners
    window.removeEventListener('pointermove', moverDrag);
    window.removeEventListener('pointerup', soltarDrag);
    window.removeEventListener('pointercancel', soltarDrag);

    // Guardar el nuevo orden
    const nuevoOrdenIds = Array.from(cont.children)
        .filter(c => c.classList.contains('figura-item'))
        .map(c => c.dataset.id);

    const figuras = leerFigurasPersonalizadas();
    const ordenadas = nuevoOrdenIds
        .map(id => figuras.find(f => f.id === id))
        .filter(Boolean);

    escribirFigurasPersonalizadas(ordenadas);

    // Reset estado
    dragEstado.activo = false;
    dragEstado.item = null;
    dragEstado.placeholder = null;
    dragEstado.contenedor = null;
    dragEstado.idxOriginal = -1;
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