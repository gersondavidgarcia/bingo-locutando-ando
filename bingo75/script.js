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
    activa: true,
    fija: true
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
   CONFIGURACIÓN DE VOZ
   ============================================ */
let VOZ_ACTIVADA = false;
let VOZ_VOLUMEN = 1.0;
let VOZ_VELOCIDAD = 1.0;
let VOZ_TONO = 1.0;
let VOZ_SELECCIONADA = '';
let VOZ_REPETIR = 1;
let vocesDisponibles = [];

/* ============================================
   🎨 MODO DE TEMAS
   'simple'    → un tema a la vez (rota con CAMBIAR)
   'combinado' → mezcla temas por bloques de 3 cartones
   ============================================ */
let MODO_TEMAS = 'simple';

/* ============================================
   CARTONES COMBINADOS (estado en memoria)
   ============================================ */
let CC_SECUENCIAS = [];
let CC_SECUENCIA_EN_USO = '';
let CC_EDITANDO_ID = null;

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
        case 'pantallaSonidos':          titulo.textContent = '🎵 Sonidos'; break;
        case 'pantallaGeneral':          titulo.textContent = '⚙️ General'; break;
        case 'pantallaTemas':            titulo.textContent = '🎨 Temas'; break;
        case 'pantallaModoTemas':        titulo.textContent = '🎨 Modo de temas'; break;
        case 'pantallaFiguras':          titulo.textContent = '🎯 Figuras'; break;
        case 'pantallaEditorFigura':     titulo.textContent = '✏️ Nueva figura'; break;
        case 'pantallaResaltados':       titulo.textContent = '✨ Resaltados'; break;
        case 'pantallaResaltadoFigura':  titulo.textContent = '🎯 Resaltado de figura'; break;
        case 'pantallaResaltadoNumero':  titulo.textContent = '🟡 Resaltado de número'; break;
        case 'pantallaVelocidad':        titulo.textContent = '⚡ Velocidad de bola'; break;
        case 'pantallaVoz':              titulo.textContent = '🎙️ Voz'; break;
        case 'pantallaApariencia':       titulo.textContent = '📐 Apariencia'; break;
        case 'pantallaCombinados':       titulo.textContent = '🧩 Cartones Combinados'; break;
        case 'pantallaEditorSecuencia':  titulo.textContent = '✏️ Editar secuencia'; break;
        default:                         titulo.textContent = '⚙️ Configuración';
    }

    if (idPantalla === 'pantallaModoTemas') {
        renderizarModoTemas();
    }
    if (idPantalla === 'pantallaTemas') {
        actualizarIndicadorModoEnTemas();
    }
    if (idPantalla === 'pantallaCombinados') {
        actualizarAvisoModoEnCombinados();
    }

    const box = document.querySelector('.modal-box');
    if (box) box.scrollTop = 0;
}

function abrirSeccionConfig(nombre) {
    switch (nombre) {
        case 'audio':      mostrarPantallaConfig('pantallaAudio'); break;
        case 'sonidos':    abrirPantallaSonidos(); break;
        case 'general':    mostrarPantallaConfig('pantallaGeneral'); break;
        case 'temas':      mostrarPantallaConfig('pantallaTemas'); break;
        case 'modoTemas':  mostrarPantallaConfig('pantallaModoTemas'); break;
        case 'figuras':    abrirPantallaFiguras(); break;
        case 'resaltados': mostrarPantallaConfig('pantallaResaltados'); break;
        case 'velocidad':  mostrarPantallaConfig('pantallaVelocidad'); break;
        case 'voz':        abrirPantallaVoz(); break;
        case 'apariencia': mostrarPantallaConfig('pantallaApariencia'); break;
        case 'combinados': abrirPantallaCombinados(); break;
        default:           volverAlMenuConfig();
    }
}

function volverAlMenuConfig() {
    mostrarPantallaConfig('pantallaMenu');
}

/* ============================================
   🎨 MODO DE TEMAS — UI
   ============================================ */
function seleccionarModoTemas(modo) {
    if (modo !== 'simple' && modo !== 'combinado') return;

    if (modo === 'combinado') {
        const validas = CC_SECUENCIAS.filter(s => Array.isArray(s.temas) && s.temas.length > 0);
        if (validas.length === 0) {
            alert('Para usar Temas Combinados necesitas crear al menos una secuencia con temas.\n\nVe a "Cartones Combinados" para crearla.');
            return;
        }
    }

    MODO_TEMAS = modo;
    renderizarModoTemas();
    actualizarIndicadorModoEnTemas();
    actualizarAvisoModoEnCombinados();
}

function renderizarModoTemas() {
    const btnSimple = document.getElementById('modoSimpleBtn');
    const btnCombinado = document.getElementById('modoCombinadoBtn');
    const chkSimple = document.getElementById('modoSimpleCheck');
    const chkCombinado = document.getElementById('modoCombinadoCheck');
    const aviso = document.getElementById('modoTemasAviso');

    if (btnSimple) btnSimple.classList.toggle('seleccionado', MODO_TEMAS === 'simple');
    if (btnCombinado) btnCombinado.classList.toggle('seleccionado', MODO_TEMAS === 'combinado');

    if (chkSimple) chkSimple.style.display = (MODO_TEMAS === 'simple') ? '' : 'none';
    if (chkCombinado) chkCombinado.style.display = (MODO_TEMAS === 'combinado') ? '' : 'none';

    if (aviso) {
        if (MODO_TEMAS === 'simple') {
            aviso.textContent = '✅ Se usará el tema activo actual. Puedes cambiarlo en pleno juego con el botón CAMBIAR.';
        } else {
            const sec = CC_SECUENCIAS.find(s => s.id === CC_SECUENCIA_EN_USO);
            if (!sec) {
                aviso.textContent = '⚠️ No hay una secuencia en uso válida. Ve a "Cartones Combinados" para elegir o crear una.';
            } else if (!Array.isArray(sec.temas) || sec.temas.length === 0) {
                aviso.textContent = `⚠️ La secuencia "${sec.nombre}" no tiene temas. Edítala en "Cartones Combinados".`;
            } else {
                aviso.textContent = `✅ Se usará la secuencia: "${sec.nombre}" (${sec.temas.join(' → ')}).`;
            }
        }
    }
}

function actualizarIndicadorModoEnTemas() {
    const cont = document.getElementById('temasModoIndicador');
    if (!cont) return;
    const icono = MODO_TEMAS === 'simple' ? '🎨' : '🧩';
    const texto = MODO_TEMAS === 'simple' ? 'Tema simple' : 'Temas combinados';
    cont.innerHTML = `Modo actual: <strong>${icono} ${texto}</strong> ` +
        `<button class="btn-link-inline" onclick="mostrarPantallaConfig('pantallaModoTemas')" onfocus="this.blur()">cambiar</button>`;
}

function actualizarAvisoModoEnCombinados() {
    const aviso = document.getElementById('ccAvisoModo');
    if (!aviso) return;
    if (MODO_TEMAS === 'combinado') {
        aviso.innerHTML = '✅ Este modo está <strong>activo</strong>. Estas secuencias se usarán al jugar.';
    } else {
        aviso.innerHTML = '⚠️ Para usar estas secuencias, activa el modo <strong>"Temas combinados"</strong>. ' +
            '<button class="btn-link-inline" onclick="seleccionarModoTemas(\'combinado\')" onfocus="this.blur()">Activar modo combinado</button>';
    }
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

            // ===== CONFIGURACIÓN DE VOZ =====
            VOZ_ACTIVADA = config.vozActivada === true;
            VOZ_VOLUMEN = (config.vozVolumen !== undefined ? config.vozVolumen : 100) / 100;
            VOZ_VELOCIDAD = (config.vozVelocidad !== undefined ? config.vozVelocidad : 100) / 100;
            VOZ_TONO = (config.vozTono !== undefined ? config.vozTono : 100) / 100;
            VOZ_SELECCIONADA = config.vozSeleccionada || '';
            VOZ_REPETIR = config.vozRepetir !== undefined ? parseInt(config.vozRepetir) : 1;

            setVal('vozActivada', VOZ_ACTIVADA ? 'si' : 'no');
            setVal('vozVolumen', Math.round(VOZ_VOLUMEN * 100));
            setVal('vozVelocidad', Math.round(VOZ_VELOCIDAD * 100));
            setVal('vozTono', Math.round(VOZ_TONO * 100));
            setVal('vozRepetir', VOZ_REPETIR);
            setTimeout(() => {
                const sel = document.getElementById('vozSeleccionada');
                if (sel && VOZ_SELECCIONADA) sel.value = VOZ_SELECCIONADA;
            }, 300);

            const temasGuardados = Array.isArray(config.temasActivos) && config.temasActivos.length > 0
                ? config.temasActivos : ['Verde'];
            document.querySelectorAll('.tema-check').forEach(chk => {
                chk.checked = temasGuardados.includes(chk.value);
            });

            // ===== CARTONES COMBINADOS =====
            const cc = config.cartonesCombinados || {};
            CC_SECUENCIAS = Array.isArray(cc.secuencias) ? cc.secuencias.slice() : [];
            CC_SECUENCIA_EN_USO = cc.secuenciaEnUsoId || (CC_SECUENCIAS[0] ? CC_SECUENCIAS[0].id : '');

            // ===== MODO DE TEMAS =====
            if (config.modoTemas === 'combinado' || config.modoTemas === 'simple') {
                MODO_TEMAS = config.modoTemas;
            } else if (cc.activo === true) {
                MODO_TEMAS = 'combinado';
            } else {
                MODO_TEMAS = 'simple';
            }
        } else {
            document.querySelectorAll('.tema-check').forEach(chk => {
                chk.checked = chk.value === 'Verde';
            });
            CC_SECUENCIAS = [];
            CC_SECUENCIA_EN_USO = '';
            MODO_TEMAS = 'simple';
        }
    } catch (e) {}
    actualizarLabelsSliders();
    cargarControlesAudio();
    cargarControlesSonidos();
    renderizarModoTemas();
    actualizarIndicadorModoEnTemas();
    actualizarAvisoModoEnCombinados();
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

    // ===== SLIDERS DE VOZ =====
    const rangoVozVol = document.getElementById('vozVolumen');
    const valVozVol = document.getElementById('valVozVolumen');
    if (rangoVozVol && valVozVol) {
        valVozVol.textContent = rangoVozVol.value + '%';
        rangoVozVol.oninput = () => { valVozVol.textContent = rangoVozVol.value + '%'; };
    }

    const rangoVozVel = document.getElementById('vozVelocidad');
    const valVozVel = document.getElementById('valVozVelocidad');
    if (rangoVozVel && valVozVel) {
        valVozVel.textContent = rangoVozVel.value + '%';
        rangoVozVel.oninput = () => { valVozVel.textContent = rangoVozVel.value + '%'; };
    }

    const rangoVozTono = document.getElementById('vozTono');
    const valVozTono = document.getElementById('valVozTono');
    if (rangoVozTono && valVozTono) {
        valVozTono.textContent = rangoVozTono.value + '%';
        rangoVozTono.oninput = () => { valVozTono.textContent = rangoVozTono.value + '%'; };
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
   🎵 SONIDOS - CARGAR Y GUARDAR
   (Música, Campana, Tactac)
   ============================================ */
function cargarControlesSonidos() {
    const configSonido = (idRango, idVal, clave, porDefecto) => {
        const rango = document.getElementById(idRango);
        const val = document.getElementById(idVal);
        if (!rango || !val) return;

        const guardado = parseFloat(localStorage.getItem(clave));
        const valor = !isNaN(guardado) ? guardado : porDefecto;
        rango.value = Math.round(valor * 100);
        val.textContent = Math.round(valor * 100) + '%';

        rango.oninput = () => {
            const v = rango.value;
            val.textContent = v + '%';
            localStorage.setItem(clave, v / 100);
        };
    };

    configSonido('sonidoMusicaVolumen',  'valSonidoMusicaVolumen',  'sonidoMusicaVolumen',  0.35);
    configSonido('sonidoCampanaVolumen', 'valSonidoCampanaVolumen', 'sonidoCampanaVolumen', 0.85);
    configSonido('sonidoTactacVolumen',  'valSonidoTactacVolumen',  'sonidoTactacVolumen',  0.95);
}

/* ============================================
   ABRIR PANTALLA SONIDOS
   ============================================ */
function abrirPantallaSonidos() {
    cargarControlesSonidos();
    mostrarPantallaConfig('pantallaSonidos');
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

    // ===== VALIDACIÓN DE MODO COMBINADO =====
    if (MODO_TEMAS === 'combinado') {
        const secuenciasValidas = CC_SECUENCIAS.filter(s => Array.isArray(s.temas) && s.temas.length > 0);
        if (secuenciasValidas.length === 0) {
            alert('No puedes guardar en modo "Temas combinados" sin al menos una secuencia con temas.\n\nVe a "Cartones Combinados" para crear una, o cambia a "Tema simple".');
            return;
        }
        CC_SECUENCIAS = secuenciasValidas;
        if (!CC_SECUENCIAS.some(s => s.id === CC_SECUENCIA_EN_USO)) {
            CC_SECUENCIA_EN_USO = CC_SECUENCIAS[0].id;
        }
    }

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
        // ===== CONFIGURACIÓN DE VOZ =====
        vozActivada: document.getElementById('vozActivada')?.value === 'si',
        vozVolumen: parseInt(document.getElementById('vozVolumen')?.value || '100'),
        vozVelocidad: parseInt(document.getElementById('vozVelocidad')?.value || '100'),
        vozTono: parseInt(document.getElementById('vozTono')?.value || '100'),
        vozSeleccionada: document.getElementById('vozSeleccionada')?.value || '',
        vozRepetir: parseInt(document.getElementById('vozRepetir')?.value || '1'),
        temasActivos: temasActivos,
        figurasPersonalizadas: figurasPersonalizadas,
        // ===== MODO DE TEMAS =====
        modoTemas: MODO_TEMAS,
        // ===== CARTONES COMBINADOS =====
        cartonesCombinados: {
            activo: MODO_TEMAS === 'combinado',
            secuenciaEnUsoId: CC_SECUENCIA_EN_USO,
            secuencias: CC_SECUENCIAS
        }
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
            vozActivada: document.getElementById('vozActivada')?.value === 'si',
            vozVolumen: parseInt(document.getElementById('vozVolumen')?.value || '100'),
            vozVelocidad: parseInt(document.getElementById('vozVelocidad')?.value || '100'),
            vozTono: parseInt(document.getElementById('vozTono')?.value || '100'),
            vozSeleccionada: document.getElementById('vozSeleccionada')?.value || '',
            vozRepetir: parseInt(document.getElementById('vozRepetir')?.value || '1'),
            temasActivos: temasActivos,
            figurasPersonalizadas: [Object.assign({}, FIGURA_DIAGONAL)],
            modoTemas: 'simple',
            cartonesCombinados: {
                activo: false,
                secuenciaEnUsoId: '',
                secuencias: []
            }
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
            if (Array.isArray(config.figurasPersonalizadas)) {
                const existeDiagonal = config.figurasPersonalizadas.some(f => f && f.id === 'diagonal');
                if (!existeDiagonal) {
                    config.figurasPersonalizadas.unshift(Object.assign({}, FIGURA_DIAGONAL));
                }
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
        btnBorrar.disabled = total <= 1 || fig.id === 'diagonal';
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
    if (id === 'diagonal') {
        alert('La figura diagonal no se puede borrar, solo desactivar.');
        return;
    }
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

/* ============================================
   🧩 CARTONES COMBINADOS
   ============================================ */
function abrirPantallaCombinados() {
    CC_EDITANDO_ID = null;
    renderizarPantallaCombinados();
    mostrarPantallaConfig('pantallaCombinados');
}

function renderizarPantallaCombinados() {
    renderizarListaSecuenciasCC();
    renderizarSelectorSecuenciaEnUso();
    actualizarAvisoTemasInsuficientesCC();
    actualizarAvisoModoEnCombinados();
}

function renderizarListaSecuenciasCC() {
    const cont = document.getElementById('ccListaSecuencias');
    if (!cont) return;
    cont.innerHTML = '';

    if (CC_SECUENCIAS.length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'config-hint';
        vacio.textContent = 'No hay secuencias creadas todavía.';
        cont.appendChild(vacio);
        return;
    }

    CC_SECUENCIAS.forEach((sec) => {
        const item = document.createElement('div');
        item.className = 'cc-secuencia-item';
        if (sec.id === CC_SECUENCIA_EN_USO) item.classList.add('en-uso');

        const cab = document.createElement('div');
        cab.className = 'cc-secuencia-cab';

        const nombre = document.createElement('strong');
        nombre.className = 'cc-secuencia-nombre';
        nombre.textContent = sec.nombre;
        cab.appendChild(nombre);

        if (sec.id === CC_SECUENCIA_EN_USO) {
            const badge = document.createElement('span');
            badge.className = 'cc-badge-en-uso';
            badge.textContent = 'EN USO';
            cab.appendChild(badge);
        }

        const chips = document.createElement('div');
        chips.className = 'cc-chips';
        sec.temas.forEach((tema) => {
            const chip = document.createElement('span');
            chip.className = 'cc-chip';
            chip.textContent = tema;
            chips.appendChild(chip);
        });
        if (sec.temas.length === 0) {
            const chipVacio = document.createElement('span');
            chipVacio.className = 'cc-chip cc-chip-vacio';
            chipVacio.textContent = '(sin temas)';
            chips.appendChild(chipVacio);
        }

        const acciones = document.createElement('div');
        acciones.className = 'cc-secuencia-acciones';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'cc-btn-accion';
        btnEditar.textContent = '✏️ Editar';
        btnEditar.addEventListener('click', () => abrirEditorSecuenciaCC(sec.id));

        const btnBorrar = document.createElement('button');
        btnBorrar.className = 'cc-btn-accion cc-btn-borrar';
        btnBorrar.textContent = '🗑️ Borrar';
        btnBorrar.addEventListener('click', () => borrarSecuenciaCC(sec.id));

        acciones.appendChild(btnEditar);
        acciones.appendChild(btnBorrar);

        item.appendChild(cab);
        item.appendChild(chips);
        item.appendChild(acciones);

        cont.appendChild(item);
    });
}

function renderizarSelectorSecuenciaEnUso() {
    const sel = document.getElementById('ccSecuenciaEnUso');
    const wrap = document.getElementById('ccWrapSecuenciaEnUso');
    if (!sel) return;

    sel.innerHTML = '';

    if (CC_SECUENCIAS.length === 0) {
        if (wrap) wrap.style.display = 'none';
        return;
    }
    if (wrap) wrap.style.display = '';

    CC_SECUENCIAS.forEach(sec => {
        const opt = document.createElement('option');
        opt.value = sec.id;
        opt.textContent = sec.nombre;
        sel.appendChild(opt);
    });

    if (!CC_SECUENCIAS.some(s => s.id === CC_SECUENCIA_EN_USO)) {
        CC_SECUENCIA_EN_USO = CC_SECUENCIAS[0].id;
    }
    sel.value = CC_SECUENCIA_EN_USO;

    sel.onchange = () => {
        CC_SECUENCIA_EN_USO = sel.value;
        renderizarListaSecuenciasCC();
        renderizarModoTemas();
    };
}

function actualizarAvisoTemasInsuficientesCC() {
    const aviso = document.getElementById('ccAvisoTemas');
    if (!aviso) return;
    const temasActivos = [];
    document.querySelectorAll('.tema-check').forEach(chk => {
        if (chk.checked) temasActivos.push(chk.value);
    });
    if (temasActivos.length < 2) {
        aviso.style.display = '';
        aviso.textContent = `⚠️ Solo tienes ${temasActivos.length} tema(s) activo(s). Activa al menos 2 en la pestaña "Temas" para aprovechar los Cartones Combinados.`;
    } else {
        aviso.style.display = 'none';
    }
}

function abrirEditorSecuenciaCC(id) {
    CC_EDITANDO_ID = id || null;
    const sec = id ? CC_SECUENCIAS.find(s => s.id === id) : null;

    const inputNombre = document.getElementById('ccNombreSecuencia');
    if (inputNombre) {
        inputNombre.value = sec ? sec.nombre : `Secuencia ${CC_SECUENCIAS.length + 1}`;
    }

    renderizarChipsEditorCC(sec ? sec.temas.slice() : []);
    renderizarSelectorAgregarTemaCC();
    mostrarPantallaConfig('pantallaEditorSecuencia');
}

function cerrarEditorSecuenciaCC() {
    abrirPantallaCombinados();
}

/* Estado temporal del editor de secuencia */
let CC_EDITOR_TEMAS = [];

function renderizarChipsEditorCC(temas) {
    CC_EDITOR_TEMAS = temas || [];

    const cont = document.getElementById('ccChipsEditor');
    if (!cont) return;
    cont.innerHTML = '';

    if (CC_EDITOR_TEMAS.length === 0) {
        const vacio = document.createElement('span');
        vacio.className = 'config-hint';
        vacio.textContent = 'Aún no has añadido temas a esta secuencia.';
        cont.appendChild(vacio);
        return;
    }

    CC_EDITOR_TEMAS.forEach((tema, idx) => {
        const chip = document.createElement('span');
        chip.className = 'cc-chip-editor';

        const txt = document.createElement('span');
        txt.className = 'cc-chip-editor-texto';
        txt.textContent = tema;

        const btnIzq = document.createElement('button');
        btnIzq.className = 'cc-chip-mini';
        btnIzq.textContent = '◀';
        btnIzq.disabled = idx === 0;
        btnIzq.addEventListener('click', () => moverTemaEditorCC(idx, -1));

        const btnDer = document.createElement('button');
        btnDer.className = 'cc-chip-mini';
        btnDer.textContent = '▶';
        btnDer.disabled = idx === CC_EDITOR_TEMAS.length - 1;
        btnDer.addEventListener('click', () => moverTemaEditorCC(idx, +1));

        const btnX = document.createElement('button');
        btnX.className = 'cc-chip-mini cc-chip-x';
        btnX.textContent = '✕';
        btnX.addEventListener('click', () => quitarTemaEditorCC(idx));

        chip.appendChild(btnIzq);
        chip.appendChild(txt);
        chip.appendChild(btnDer);
        chip.appendChild(btnX);

        cont.appendChild(chip);
    });
}

function moverTemaEditorCC(idx, dir) {
    const nuevo = idx + dir;
    if (nuevo < 0 || nuevo >= CC_EDITOR_TEMAS.length) return;
    const temp = CC_EDITOR_TEMAS[idx];
    CC_EDITOR_TEMAS[idx] = CC_EDITOR_TEMAS[nuevo];
    CC_EDITOR_TEMAS[nuevo] = temp;
    renderizarChipsEditorCC(CC_EDITOR_TEMAS);
}

function quitarTemaEditorCC(idx) {
    CC_EDITOR_TEMAS.splice(idx, 1);
    renderizarChipsEditorCC(CC_EDITOR_TEMAS);
}

function renderizarSelectorAgregarTemaCC() {
    const sel = document.getElementById('ccAgregarTema');
    if (!sel) return;
    sel.innerHTML = '';

    const temasActivos = [];
    document.querySelectorAll('.tema-check').forEach(chk => {
        if (chk.checked) temasActivos.push(chk.value);
    });

    if (temasActivos.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '⚠️ No hay temas activos';
        opt.disabled = true;
        sel.appendChild(opt);
        return;
    }

    const optDefecto = document.createElement('option');
    optDefecto.value = '';
    optDefecto.textContent = '-- Elegir tema --';
    sel.appendChild(optDefecto);

    temasActivos.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        sel.appendChild(opt);
    });
}

function agregarTemaEditorCC() {
    const sel = document.getElementById('ccAgregarTema');
    if (!sel) return;
    const tema = sel.value;
    if (!tema) return;
    if (CC_EDITOR_TEMAS.length >= 10) {
        alert('Máximo 10 temas por secuencia.');
        return;
    }
    CC_EDITOR_TEMAS.push(tema);
    sel.value = '';
    renderizarChipsEditorCC(CC_EDITOR_TEMAS);
}

function guardarSecuenciaCC() {
    const inputNombre = document.getElementById('ccNombreSecuencia');
    const nombre = (inputNombre?.value || '').trim() || `Secuencia ${CC_SECUENCIAS.length + 1}`;

    if (CC_EDITOR_TEMAS.length === 0) {
        alert('Añade al menos un tema a la secuencia.');
        return;
    }

    if (CC_EDITANDO_ID) {
        const sec = CC_SECUENCIAS.find(s => s.id === CC_EDITANDO_ID);
        if (sec) {
            sec.nombre = nombre;
            sec.temas = CC_EDITOR_TEMAS.slice();
        }
    } else {
        if (CC_SECUENCIAS.length >= 10) {
            alert('Máximo 10 secuencias.');
            return;
        }
        const nueva = {
            id: 'sec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            nombre: nombre,
            temas: CC_EDITOR_TEMAS.slice()
        };
        CC_SECUENCIAS.push(nueva);
        if (!CC_SECUENCIA_EN_USO) CC_SECUENCIA_EN_USO = nueva.id;
    }

    CC_EDITANDO_ID = null;
    abrirPantallaCombinados();
}

function borrarSecuenciaCC(id) {
    if (!confirm('¿Borrar esta secuencia?')) return;
    CC_SECUENCIAS = CC_SECUENCIAS.filter(s => s.id !== id);
    if (CC_SECUENCIA_EN_USO === id) {
        CC_SECUENCIA_EN_USO = CC_SECUENCIAS[0] ? CC_SECUENCIAS[0].id : '';
    }
    if (CC_SECUENCIAS.length === 0 && MODO_TEMAS === 'combinado') {
        MODO_TEMAS = 'simple';
    }
    renderizarPantallaCombinados();
    renderizarModoTemas();
}

/* ============================================
   🎙️ SISTEMA DE VOZ (SOLO ESPAÑOL)
   ============================================ */
function cargarVocesDisponibles() {
    if (!('speechSynthesis' in window)) return;
    const todas = window.speechSynthesis.getVoices();
    vocesDisponibles = todas.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));

    const select = document.getElementById('vozSeleccionada');
    if (!select) return;

    const valorActual = select.value || VOZ_SELECCIONADA;
    select.innerHTML = '<option value="">-- Automática (recomendada) --</option>';

    if (vocesDisponibles.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '⚠️ No hay voces en español instaladas';
        opt.disabled = true;
        select.appendChild(opt);
        return;
    }

    vocesDisponibles.sort((a, b) => a.name.localeCompare(b.name));

    vocesDisponibles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})`;
        select.appendChild(opt);
    });

    if (valorActual && vocesDisponibles.some(v => v.name === valorActual)) {
        select.value = valorActual;
    }
}

function initVoces() {
    if (!('speechSynthesis' in window)) {
        console.warn('⚠️ Este dispositivo no soporta síntesis de voz');
        return;
    }
    cargarVocesDisponibles();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = cargarVocesDisponibles;
    }
}

function abrirPantallaVoz() {
    if ('speechSynthesis' in window) {
        cargarVocesDisponibles();
    }
    mostrarPantallaConfig('pantallaVoz');
}

function desbloquearVoz() {
    if (!('speechSynthesis' in window)) return;
    try {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
    } catch (e) {}
}

/* ============================================
   PROBAR VOZ DESDE LA CONFIGURACIÓN
   ============================================ */
function probarVozConfig() {
    if (!('speechSynthesis' in window)) {
        alert('Este dispositivo no soporta síntesis de voz');
        return;
    }

    if (vocesDisponibles.length === 0) {
        alert('No hay voces en español instaladas. Ve a los ajustes de tu dispositivo para descargar una.');
        return;
    }

    const volumen = parseInt(document.getElementById('vozVolumen')?.value || '100') / 100;
    const velocidad = parseInt(document.getElementById('vozVelocidad')?.value || '100') / 100;
    const tono = parseInt(document.getElementById('vozTono')?.value || '100') / 100;
    const repetir = parseInt(document.getElementById('vozRepetir')?.value || '1');
    const vozSel = document.getElementById('vozSeleccionada')?.value || '';

    try { window.speechSynthesis.cancel(); } catch (e) {}

    const hablar = () => {
        const utter = new SpeechSynthesisUtterance('B 7');
        utter.volume = volumen;
        utter.rate = velocidad;
        utter.pitch = tono;
        utter.lang = 'es-ES';

        if (vozSel) {
            const voz = vocesDisponibles.find(v => v.name === vozSel);
            if (voz) {
                utter.voice = voz;
                utter.lang = voz.lang;
            }
        } else {
            utter.voice = vocesDisponibles[0];
            utter.lang = vocesDisponibles[0].lang;
        }

        window.speechSynthesis.speak(utter);
    };

    for (let i = 0; i < repetir; i++) {
        if (i === 0) {
            hablar();
        } else {
            setTimeout(hablar, 1200 * i);
        }
    }
}

/* ============================================
   INICIALIZAR SISTEMA DE VOZ
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    initVoces();

    const desbloquear = () => {
        desbloquearVoz();
        document.removeEventListener('touchstart', desbloquear);
        document.removeEventListener('click', desbloquear);
    };
    document.addEventListener('touchstart', desbloquear, { once: true });
    document.addEventListener('click', desbloquear, { once: true });
});

/* ============================================
   🔄 INICIAR REVANCHA DESDE EL MENÚ
   ============================================ */
function iniciarRevanchaDesdeMenu() {
    const raw = localStorage.getItem('bingo_config');
    if (!raw) {
        iniciarJuegoDirecto();
        return;
    }
    localStorage.setItem('bingo_modo_revancha', '1');
    window.location.href = 'juego.html';
}

/* ============================================
   📂 CARGAR PARTIDA DESDE EL MENÚ
   ============================================ */
function cargarPartidaDesdeMenu() {
    const raw = localStorage.getItem('bingo_partida_guardada');
    if (!raw) {
        alert('No hay ninguna partida guardada.');
        return;
    }
    localStorage.setItem('bingo_modo_cargar', '1');
    window.location.href = 'juego.html';
}

/* ============================================
   📂 ACTUALIZAR ESTADO DEL BOTÓN CARGAR
   ============================================ */
function actualizarBotonCargar() {
    const btn = document.getElementById('btnCargarMenu');
    if (!btn) return;
    const hayPartida = !!localStorage.getItem('bingo_partida_guardada');
    if (!hayPartida) {
        btn.classList.add('sin-partida');
    } else {
        btn.classList.remove('sin-partida');
    }
}

document.addEventListener('DOMContentLoaded', actualizarBotonCargar);

/* ============================================
   🌐 EXPOSICIÓN GLOBAL DE FUNCIONES
   ============================================ */
window.abrirConfiguracion = abrirConfiguracion;
window.cerrarConfiguracion = cerrarConfiguracion;
window.mostrarPantallaConfig = mostrarPantallaConfig;
window.abrirSeccionConfig = abrirSeccionConfig;
window.volverAlMenuConfig = volverAlMenuConfig;
window.guardarConfiguracion = guardarConfiguracion;
window.iniciarJuegoDirecto = iniciarJuegoDirecto;
window.iniciarRevanchaDesdeMenu = iniciarRevanchaDesdeMenu;
window.cargarPartidaDesdeMenu = cargarPartidaDesdeMenu;

window.abrirPantallaCombinados = abrirPantallaCombinados;
window.abrirEditorSecuenciaCC = abrirEditorSecuenciaCC;
window.cerrarEditorSecuenciaCC = cerrarEditorSecuenciaCC;
window.agregarTemaEditorCC = agregarTemaEditorCC;
window.guardarSecuenciaCC = guardarSecuenciaCC;
window.borrarSecuenciaCC = borrarSecuenciaCC;

window.abrirEditorFiguraNueva = abrirEditorFiguraNueva;
window.cerrarEditorFigura = cerrarEditorFigura;
window.guardarFiguraNueva = guardarFiguraNueva;
window.probarVozConfig = probarVozConfig;

window.seleccionarModoTemas = seleccionarModoTemas;
window.abrirPantallaSonidos = abrirPantallaSonidos;