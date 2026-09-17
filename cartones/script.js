/* ============================================
   CONFIGURACIÓN GLOBAL
   ============================================ */
let TOTAL_CARTONES = 15;
let MAX_BALOTAS = 75;
let MODO_JUEGO = 75;

// Paleta de colores (se repetirá si hay más cartones que colores)
const COLORES_CARTONES = [
    '#e53935', '#d81b60', '#8e24aa', '#5e35b1', 
    '#3949ab', '#1e88e5', '#039be5', '#00acc1', 
    '#00897b', '#43a047', '#7cb342', '#fb8c00', 
    '#f4511e', '#6d4c41', '#546e7a',
    '#ad1457', '#6a1b9a', '#283593'
];

let bombo = [];
let historialSacadas = [];

const RANGOS_BINGO = {
    B: [1, 15],
    I: [16, 30],
    N: [31, 45],
    G: [46, 60],
    O: [61, 75]
};

/* ============================================
   FUNCIONES DEL MENÚ (index.html)
   ============================================ */
function toggleConfiguracion() {
    const panel = document.getElementById('panelConfiguracion');
    if (panel) {
        panel.classList.toggle('visible');
    }
}

function iniciarJuegoDirecto() {
    const config = {
        cartones: document.getElementById('cantCartones')?.value || '18',
        modo: document.getElementById('maxBolas')?.value || '75'
    };
    localStorage.setItem('bingo_config', JSON.stringify(config));
    window.location.href = 'juego.html';
}

/* ============================================
   LECTURA DE CONFIGURACIÓN
   ============================================ */
function cargarConfiguracion() {
    try {
        const raw = localStorage.getItem('bingo_config');
        if (raw) {
            const config = JSON.parse(raw);
            TOTAL_CARTONES = parseInt(config.cartones) || 15;
            MODO_JUEGO = parseInt(config.modo) || 75;
            MAX_BALOTAS = MODO_JUEGO;
        }
    } catch (e) {
        console.warn('No se pudo leer la configuración, usando valores por defecto.');
    }

    ajustarGrid(TOTAL_CARTONES);
}

function ajustarGrid(cantidad) {
    const grid = document.getElementById('cartonesGrid');
    if (!grid) return;

    // Mantener 3 columnas para móvil (6, 9, 12, 15, 18 se ven bien)
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
}

/* ============================================
   GENERACIÓN DE CARTONES
   ============================================ */
function generarCarton75() {
    const columnas = { B: [], I: [], N: [], G: [], O: [] };
    
    Object.keys(RANGOS_BINGO).forEach(letra => {
        const [min, max] = RANGOS_BINGO[letra];
        while (columnas[letra].length < 5) {
            let num = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!columnas[letra].includes(num)) {
                columnas[letra].push(num);
            }
        }
    });

    return columnas;
}

function obtenerLetra(num) {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
}

/* ============================================
   RENDERIZADO
   ============================================ */
function renderizarEstructura() {
    const grid = document.getElementById('cartonesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    for (let i = 1; i <= TOTAL_CARTONES; i++) {
        const datos = generarCarton75();
        const carton = document.createElement('div');
        carton.className = 'carton';
        
        const colorHex = COLORES_CARTONES[(i - 1) % COLORES_CARTONES.length];
        carton.style.setProperty('--carton-color', colorHex);

        carton.innerHTML = `
            <div class="carton-header">
                <span class="carton-title">CARTÓN ${i}</span>
            </div>
            <div class="bingo-header-row">
                <span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>
            </div>
            <div class="carton-grid-inner" style="grid-template-columns: repeat(5, 1fr);"></div>
        `;

        grid.appendChild(carton);
        const innerGrid = carton.querySelector('.carton-grid-inner');

        for (let fila = 0; fila < 5; fila++) {
            ['B', 'I', 'N', 'G', 'O'].forEach((letra, colIdx) => {
                const celda = document.createElement('div');
                celda.className = 'celda';

                if (fila === 2 && colIdx === 2) {
                    celda.classList.add('vacia');
                    celda.innerHTML = `<span class="num-val" style="font-size: 0.45rem !important;">FREE</span>`;
                } else {
                    const val = datos[letra][fila];
                    celda.dataset.valor = val;
                    celda.innerHTML = `<span class="num-val">${val}</span>`;
                }
                innerGrid.appendChild(celda);
            });
        }
    }

    renderizarTablaControl();
}

function renderizarTablaControl() {
    const tabla = document.getElementById('tablaNumeros');
    if (!tabla) return;
    tabla.innerHTML = '';

    if (MODO_JUEGO === 75) {
        // 5 filas x 15 columnas = 75
        for (let f = 0; f < 5; f++) {
            const fila = document.createElement('div');
            fila.className = 'fila-numeros';
            for (let c = 1; c <= 15; c++) {
                const num = f * 15 + c;
                const bolita = document.createElement('div');
                bolita.className = 'bolita';
                bolita.id = `ctrl-${num}`;
                bolita.textContent = num;
                fila.appendChild(bolita);
            }
            tabla.appendChild(fila);
        }
    } else if (MODO_JUEGO === 90) {
        // 6 filas x 15 columnas = 90
        for (let f = 0; f < 6; f++) {
            const fila = document.createElement('div');
            fila.className = 'fila-numeros';
            for (let c = 1; c <= 15; c++) {
                const num = f * 15 + c;
                const bolita = document.createElement('div');
                bolita.className = 'bolita';
                bolita.id = `ctrl-${num}`;
                bolita.textContent = num;
                fila.appendChild(bolita);
            }
            tabla.appendChild(fila);
        }
    } else if (MODO_JUEGO === 100) {
        // 5 filas x 20 columnas = 100
        for (let f = 0; f < 5; f++) {
            const fila = document.createElement('div');
            fila.className = 'fila-numeros';
            fila.style.gridTemplateColumns = 'repeat(20, 1fr)';
            for (let c = 1; c <= 20; c++) {
                const num = f * 20 + c;
                const bolita = document.createElement('div');
                bolita.className = 'bolita';
                bolita.id = `ctrl-${num}`;
                bolita.textContent = num;
                fila.appendChild(bolita);
            }
            tabla.appendChild(fila);
        }
    }
}

/* ============================================
   LÓGICA DEL JUEGO
   ============================================ */
function sacarBola(e) {
    if (bombo.length === 0) return;

    if (typeof crearExplosion === 'function' && e) {
        crearExplosion(e);
    }

    const idx = Math.floor(Math.random() * bombo.length);
    const numero = bombo.splice(idx, 1)[0];
    const letra = obtenerLetra(numero);

    historialSacadas.unshift({ numero, letra });

    const display = document.getElementById('numeroDisplay');
    if (display) {
        display.innerHTML = `<span style="font-size: 0.75rem; display: block; line-height: 1;">${letra}</span>${numero}`;
    }

    const stats = document.getElementById('statsDisplay');
    if (stats) {
        stats.textContent = `${historialSacadas.length}/${MAX_BALOTAS}`;
    }

    document.querySelectorAll(`.celda[data-valor="${numero}"]`).forEach(el => {
        el.classList.add('marcada');
        el.classList.add('animar-marca');
    });

    const ctrlEl = document.getElementById(`ctrl-${numero}`);
    if (ctrlEl) ctrlEl.classList.add('marcada');

    const recientesLista = document.getElementById('recientesLista');
    if (recientesLista) {
        recientesLista.innerHTML = '';
        historialSacadas.slice(0, 6).forEach(item => {
            const bola = document.createElement('div');
            bola.className = 'mini-bola entrando';
            bola.innerHTML = `<span>${item.numero}</span>`;
            recientesLista.appendChild(bola);
        });
    }
}

function reiniciarJuego() {
    bombo = Array.from({ length: MAX_BALOTAS }, (_, i) => i + 1);
    historialSacadas = [];
    
    const display = document.getElementById('numeroDisplay');
    if (display) display.textContent = '--';
    
    const stats = document.getElementById('statsDisplay');
    if (stats) stats.textContent = `0/${MAX_BALOTAS}`;
    
    const recientes = document.getElementById('recientesLista');
    if (recientes) recientes.innerHTML = '';
    
    renderizarEstructura();
}

/* ============================================
   INICIALIZACIÓN
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Si estamos en la página del juego, inicializar
    if (document.getElementById('cartonesGrid')) {
        cargarConfiguracion();  // Lee localStorage y ajusta TOTAL_CARTONES, MODO_JUEGO, MAX_BALOTAS
        reiniciarJuego();       // Inicia el juego con esos valores
    }
});
