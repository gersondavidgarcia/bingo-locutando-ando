import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB12qk_Iw_xAFWnSw8RU_211o9HnyTczAQ",
    authDomain: "bingo-locutando-ando.firebaseapp.com",
    projectId: "bingo-locutando-ando",
    storageBucket: "bingo-locutando-ando.firebasestorage.app",
    messagingSenderId: "547896039173",
    appId: "1:547896039173:web:e7f5389dde11af9078096c"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, "bingo", "tablero");

let datos = [];
let historial = [];
let seleccionados = [];
let config = { admin: false, bloqueado: false };
let modoVerificacion = false;
let numeroRonda = 1;
let acumulado = 0;
let acumuladoReserva = 0;
let rondasPorJugador = {};
let puntosPorTramo = {};
let historialGanadores = [];
let numerosSalidos = { bingos: [], ruletas: [] };
let pendingUpdate = false;
let tramoActualEditando = null;

// Variables del cronómetro
let cronometroActivo = false;
let cronometroIntervalo = null;
const CRONOMETRO_DURACION = 12;

// ============================================================
// FUNCIÓN PARA LIMPIAR NOMBRES (quita números del ranking)
// ============================================================
function limpiarNombre(nombre) {
    return nombre.replace(/^[\d]+[\.\-\)\s]+/, '').trim();
}

function getAcumuladoEnPesos() {
    return acumulado * 2500;
}

function getAcumuladoReservaEnPesos() {
    return acumuladoReserva * 2500;
}

function actualizarUIAcumulado() {
    const elem = document.getElementById("acumuladoValor");
    if (elem) elem.innerHTML = `$${getAcumuladoEnPesos().toLocaleString()}`;
    const acumVisible = document.getElementById("acumuladoVisible");
    if (acumVisible) {
        acumVisible.innerHTML = `🏆 ACUMULADO: $${getAcumuladoEnPesos().toLocaleString()}`;
    }
    const reservaElem = document.getElementById("reservaValor");
    if (reservaElem) {
        reservaElem.innerHTML = `$${getAcumuladoReservaEnPesos().toLocaleString()}`;
    }
}

window.toggleCheckbox = () => {
    let chk = document.getElementById("chkEntregarAcumulado");
    chk.checked = !chk.checked;
};

window.toggleGuardarEnReserva = () => {
    let chk = document.getElementById("chkGuardarEnReserva");
    chk.checked = !chk.checked;
};

// ==============================================
// FUNCIONES DEL RANKING DROPDOWN DENTRO DEL MODAL
// ==============================================
window.toggleRankingDropdown = () => {
    const container = document.getElementById('rankingDropdownContainer');
    container.classList.toggle('active');
};

function calcularAfuera() {
    const todosLosJugadores = new Set();
    for (let clave in puntosPorTramo) {
        for (let nombre in puntosPorTramo[clave]) {
            todosLosJugadores.add(nombre);
        }
    }
    
    const jugadoresQueEntran = new Set();
    for (let t = 1; t <= 5; t++) {
        const clave = `tramo_${t}`;
        const data = puntosPorTramo[clave] || {};
        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
        const top12 = sorted.slice(0, 12);
        top12.forEach(([nombre]) => jugadoresQueEntran.add(nombre));
    }
    
    const afuera = [];
    todosLosJugadores.forEach(nombre => {
        if (!jugadoresQueEntran.has(nombre)) {
            let totalPuntos = 0;
            for (let clave in puntosPorTramo) {
                if (puntosPorTramo[clave][nombre]) {
                    totalPuntos += puntosPorTramo[clave][nombre];
                }
            }
            afuera.push({ nombre, puntos: totalPuntos });
        }
    });
    afuera.sort((a, b) => b.puntos - a.puntos);
    return afuera;
}

window.seleccionarTramoRanking = (tramo) => {
    document.getElementById('rankingDropdownContainer').classList.remove('active');
    
    const label = document.getElementById('tramoSeleccionadoLabel');
    const display = document.getElementById('puntosDisplay');
    
    if (tramo === 'afuera') {
        label.textContent = '🚫 AFUERA';
        tramoActualEditando = null;
        
        const afuera = calcularAfuera();
        let texto = "";
        if (afuera.length === 0) {
            texto = "✅ ¡Todos los jugadores han entrado al menos una vez!";
            display.innerHTML = `<div style="color:#88ff88; text-align:center; padding:20px; font-size:16px;">${texto}</div>`;
        } else {
            texto = "🚫 JUGADORES FUERA\n\n";
            afuera.forEach(item => {
                texto += `${item.nombre}: ${item.puntos} pts\n`;
            });
            display.innerHTML = `<textarea id="puntosTextarea" rows="18" style="width:100%; background:#000; color:#fff; border:1px solid #444; border-radius:8px; padding:10px; font-family:monospace; font-size:14px; text-transform:uppercase; resize:vertical;">${texto.trim()}</textarea>`;
        }
        return;
    }
    
    if (tramo === 'total') {
        label.textContent = '📊 TOTAL';
    } else {
        const nombres = {
            1: '📊 1-20 (1 RONDA GRATIS)',
            2: '📊 21-40 (2 RONDA GRATIS)',
            3: '📊 41-60 (3 RONDA GRATIS)',
            4: '📊 61-80 (4 RONDA GRATIS)',
            5: '📊 81-100 (5 RONDA GRATIS)'
        };
        label.textContent = nombres[tramo];
    }
    
    tramoActualEditando = tramo;
    mostrarPuntosTextarea(tramo);
};

document.addEventListener('click', function(event) {
    const container = document.getElementById('rankingDropdownContainer');
    if (container && !container.contains(event.target)) {
        container.classList.remove('active');
    }
});

// ==============================================

function getTramoActual() {
    if (numeroRonda <= 20) return 1;
    else if (numeroRonda <= 40) return 2;
    else if (numeroRonda <= 60) return 3;
    else if (numeroRonda <= 80) return 4;
    else return 5;
}

function getNombreTramo(tramo) {
    const limites = {
        1: "1-20",
        2: "21-40",
        3: "41-60",
        4: "61-80",
        5: "81-100"
    };
    return limites[tramo] || `Tramo ${tramo}`;
}

function getClaveTramo(tramo) {
    return `tramo_${tramo}`;
}

function getPuntosTramo(tramo) {
    const clave = getClaveTramo(tramo);
    return puntosPorTramo[clave] || {};
}

function getTotalPuntos() {
    const total = {};
    for (let clave in puntosPorTramo) {
        for (let nombre in puntosPorTramo[clave]) {
            total[nombre] = (total[nombre] || 0) + puntosPorTramo[clave][nombre];
        }
    }
    return total;
}

window.mostrarModalPuntos = () => {
    const tramo = getTramoActual();
    tramoActualEditando = tramo;
    document.getElementById("modalPuntos").style.display = "flex";
    
    const label = document.getElementById('tramoSeleccionadoLabel');
    const nombres = {
        1: '📊 1-20 (1 RONDA GRATIS)',
        2: '📊 21-40 (2 RONDA GRATIS)',
        3: '📊 41-60 (3 RONDA GRATIS)',
        4: '📊 61-80 (4 RONDA GRATIS)',
        5: '📊 81-100 (5 RONDA GRATIS)'
    };
    label.textContent = nombres[tramo] || '📊 Seleccionar tramo';
    
    mostrarPuntosTextarea(tramo);
};

window.cerrarModalPuntos = () => {
    document.getElementById("modalPuntos").style.display = "none";
    tramoActualEditando = null;
};

function mostrarPuntosTextarea(tramo) {
    const display = document.getElementById("puntosDisplay");
    const data = tramo === 'total' ? getTotalPuntos() : getPuntosTramo(tramo);
    const sorted = Object.entries(data).sort((a,b) => b[1] - a[1]);
    
    let texto = "";
    if (sorted.length === 0) {
        texto = `No hay puntos registrados en ${tramo === 'total' ? 'TOTAL' : getNombreTramo(tramo)}`;
        display.innerHTML = `<div style="color:#888; text-align:center; padding:20px;">${texto}</div>`;
        return;
    }
    
    let contenido = "";
    sorted.forEach(([nombre, puntos], index) => {
        const puesto = index + 1;
        contenido += `${puesto}. ${nombre}: ${puntos}\n`;
        if (index === 11) {
            contenido += `-------------\n`;
            contenido += `🚫 AFUERA\n`;
        }
    });
    
    let html = `<textarea id="puntosTextarea" rows="18" style="width:100%; background:#000; color:#fff; border:1px solid #444; border-radius:8px; padding:10px; font-family:monospace; font-size:14px; text-transform:uppercase; resize:vertical;">${contenido.trim()}</textarea>`;
    display.innerHTML = html;
}

window.guardarPuntosTramos = async () => {
    const textarea = document.getElementById("puntosTextarea");
    if (!textarea) {
        alert("No hay datos para guardar");
        return;
    }
    
    if (tramoActualEditando === null || tramoActualEditando === 'afuera') {
        alert("No se puede guardar en AFUERA, selecciona un tramo específico");
        return;
    }
    
    const lines = textarea.value.split('\n');
    const nuevosPuntos = {};
    const tramo = tramoActualEditando;
    
    if (tramo === 'total') {
        alert("No se puede guardar en TOTAL, selecciona un tramo específico");
        return;
    }
    
    lines.forEach(line => {
        line = line.trim();
        if (line.includes(':')) {
            const partes = line.split(':');
            let nombre = partes[0].trim().toUpperCase();
            nombre = limpiarNombre(nombre);
            const valor = parseInt(partes[1].trim());
            if (nombre && !isNaN(valor) && valor >= 0) {
                nuevosPuntos[nombre] = valor;
            }
        }
    });
    
    const clave = getClaveTramo(tramo);
    puntosPorTramo[clave] = nuevosPuntos;
    await updateDoc(docRef, { puntosPorTramo: puntosPorTramo });
    alert("Puntos guardados ✅");
    cerrarModalPuntos();
    actualizarStats();
};

window.reiniciarTodosLosPuntos = async () => {
    if (confirm("⚠️ ¿Estás seguro? Esto borrará TODOS los puntos de TODOS los tramos.")) {
        puntosPorTramo = {};
        await updateDoc(docRef, { puntosPorTramo: puntosPorTramo });
        alert("✅ Todos los puntos han sido reiniciados");
        const tramoActual = getTramoActual();
        tramoActualEditando = tramoActual;
        mostrarPuntosTextarea(tramoActual);
        actualizarStats();
    }
};

// ============================================================
// FUNCIÓN PARA REINICIAR TODO EL JUEGO (CON DOBLE ADVERTENCIA)
// ============================================================
window.reiniciarTodoElJuego = async () => {
    if (!confirm("⚠️⚠️⚠️ ¿REINICIAR TODO EL JUEGO?\n\nEsto reiniciará:\n• Ronda a 1\n• Rondas por jugador a 0\n• Ranking de puntos (todos los tramos) a 0\n• Ganadores de rondas (vacío)\n• Números salidos (vacío)\n\n¿Estás seguro?")) {
        return;
    }
    
    if (!confirm("⚠️⚠️⚠️ ÚLTIMA ADVERTENCIA ⚠️⚠️⚠️\n\nSe borrarán TODOS los datos del juego mencionados anteriormente\n\n¿Confirmas el reinicio total?")) {
        return;
    }
    
    try {
        numeroRonda = 1;
        rondasPorJugador = {};
        puntosPorTramo = {};
        historialGanadores = [];
        numerosSalidos = { bingos: [], ruletas: [] };
        seleccionados = [];
        document.getElementById("msgLineas").innerText = "";
        
        await updateDoc(docRef, {
            numero_ronda: 1,
            rondasPorJugador: rondasPorJugador,
            puntosPorTramo: puntosPorTramo,
            historialGanadores: historialGanadores,
            numerosSalidos: numerosSalidos
        });
        
        alert("✅ ¡Juego reiniciado completamente!\n\n" +
            "• Ronda: 1\n" +
            "• Rondas por jugador: 0\n" +
            "• Ranking: 0 puntos\n" +
            "• Ganadores: vacío\n" +
            "• Números salidos: vacío");
        
        actualizarStats();
    } catch (error) {
        alert("❌ Error al reiniciar: " + error.message);
        console.error(error);
    }
};

// ============================================================
// FUNCIÓN PARA INICIAR EL CRONÓMETRO (OPTIMIZADO CON TIMESTAMP)
// ============================================================
function iniciarCronometroOptimizado() {
    if (cronometroIntervalo) {
        clearInterval(cronometroIntervalo);
        cronometroIntervalo = null;
    }
    
    cronometroActivo = true;
    const inicio = Date.now();
    
    const overlay = document.getElementById('cronometroOverlay');
    const numeroElem = document.getElementById('cronometroNumero');
    const barraElem = document.getElementById('cronometroBarra');
    
    overlay.classList.add('visible');
    
    updateDoc(docRef, {
        cronometroActivo: true,
        cronometroInicio: inicio,
        cronometroDuracion: CRONOMETRO_DURACION
    }).catch(err => console.error("Error al guardar cronómetro:", err));
    
    function actualizarCronometro() {
        const ahora = Date.now();
        const tiempoTranscurrido = Math.floor((ahora - inicio) / 1000);
        const segundosRestantes = Math.max(0, CRONOMETRO_DURACION - tiempoTranscurrido);
        
        numeroElem.textContent = segundosRestantes;
        barraElem.style.width = (segundosRestantes / CRONOMETRO_DURACION * 100) + '%';
        actualizarColoresCronometro(segundosRestantes, numeroElem, barraElem);
        
        if (segundosRestantes <= 0) {
            clearInterval(cronometroIntervalo);
            cronometroIntervalo = null;
            cronometroActivo = false;
            overlay.classList.remove('visible');
            
            updateDoc(docRef, {
                cronometroActivo: false,
                cronometroInicio: null,
                cronometroDuracion: 0
            }).catch(err => console.error("Error al limpiar cronómetro:", err));
        }
    }
    
    actualizarCronometro();
    cronometroIntervalo = setInterval(actualizarCronometro, 500);
}

function actualizarColoresCronometro(tiempo, numeroElem, barraElem) {
    if (tiempo > 8) {
        numeroElem.style.color = '#ff4444';
        barraElem.style.background = 'linear-gradient(90deg, #ff4444, #cc0000)';
    } else if (tiempo > 4) {
        numeroElem.style.color = '#ffcc00';
        barraElem.style.background = 'linear-gradient(90deg, #ffcc00, #ff8800)';
    } else {
        numeroElem.style.color = '#00ff88';
        barraElem.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
    }
}

function restaurarCronometro(data) {
    if (data && data.cronometroActivo && data.cronometroInicio) {
        const ahora = Date.now();
        const tiempoTranscurrido = Math.floor((ahora - data.cronometroInicio) / 1000);
        const segundosRestantes = Math.max(0, CRONOMETRO_DURACION - tiempoTranscurrido);
        
        if (segundosRestantes > 0) {
            cronometroActivo = true;
            const overlay = document.getElementById('cronometroOverlay');
            const numeroElem = document.getElementById('cronometroNumero');
            const barraElem = document.getElementById('cronometroBarra');
            
            overlay.classList.add('visible');
            numeroElem.textContent = segundosRestantes;
            barraElem.style.width = (segundosRestantes / CRONOMETRO_DURACION * 100) + '%';
            actualizarColoresCronometro(segundosRestantes, numeroElem, barraElem);
            
            if (cronometroIntervalo) {
                clearInterval(cronometroIntervalo);
                cronometroIntervalo = null;
            }
            
            const inicio = data.cronometroInicio;
            cronometroIntervalo = setInterval(() => {
                const ahora2 = Date.now();
                const tiempoTranscurrido2 = Math.floor((ahora2 - inicio) / 1000);
                const segundosRestantes2 = Math.max(0, CRONOMETRO_DURACION - tiempoTranscurrido2);
                
                numeroElem.textContent = segundosRestantes2;
                barraElem.style.width = (segundosRestantes2 / CRONOMETRO_DURACION * 100) + '%';
                actualizarColoresCronometro(segundosRestantes2, numeroElem, barraElem);
                
                if (segundosRestantes2 <= 0) {
                    clearInterval(cronometroIntervalo);
                    cronometroIntervalo = null;
                    cronometroActivo = false;
                    overlay.classList.remove('visible');
                    
                    updateDoc(docRef, {
                        cronometroActivo: false,
                        cronometroInicio: null,
                        cronometroDuracion: 0
                    }).catch(err => console.error("Error al limpiar cronómetro:", err));
                }
            }, 500);
            return true;
        } else {
            cronometroActivo = false;
            document.getElementById('cronometroOverlay').classList.remove('visible');
            updateDoc(docRef, {
                cronometroActivo: false,
                cronometroInicio: null,
                cronometroDuracion: 0
            }).catch(err => console.error("Error al limpiar cronómetro:", err));
        }
    }
    return false;
}

// ============================================================
// FUNCIONES PARA GANADORES Y NÚMEROS
// ============================================================
async function guardarGanadoresEnHistorial(bingoNum, bingoNombre, ruletaNum, ruletaNombre) {
    if (!historialGanadores) historialGanadores = [];
    historialGanadores.push({
        ronda: numeroRonda,
        bingoNum: bingoNum,
        bingoNombre: bingoNombre,
        ruletaNum: ruletaNum,
        ruletaNombre: ruletaNombre
    });
    if (!numerosSalidos.bingos) numerosSalidos.bingos = [];
    if (!numerosSalidos.ruletas) numerosSalidos.ruletas = [];
    numerosSalidos.bingos.push(bingoNum);
    numerosSalidos.ruletas.push(ruletaNum);
    if (historialGanadores.length > 100) {
        historialGanadores = historialGanadores.slice(-100);
    }
    await updateDoc(docRef, { historialGanadores: historialGanadores, numerosSalidos: numerosSalidos });
}

function getHistorialGanadores() {
    return historialGanadores || [];
}

window.mostrarModalGanadores = () => {
    const textarea = document.getElementById("ganadoresTextarea");
    let texto = "";
    if (historialGanadores && historialGanadores.length > 0) {
        historialGanadores.forEach(item => {
            texto += `RONDA ${item.ronda}\n`;
            texto += `Bingo #${item.bingoNum} --- ${item.bingoNombre}\n`;
            texto += `Ruleta #${item.ruletaNum} --- ${item.ruletaNombre}\n\n`;
        });
    } else {
        texto = "No hay ganadores registrados aún.";
    }
    textarea.value = texto.trim();
    document.getElementById("modalGanadores").style.display = "flex";
};

window.cerrarModalGanadores = () => {
    document.getElementById("modalGanadores").style.display = "none";
};

window.guardarGanadores = async () => {
    const texto = document.getElementById("ganadoresTextarea").value;
    const lines = texto.split('\n');
    const nuevosGanadores = [];
    let rondaActual = null;
    let bingoNum = null, bingoNombre = null, ruletaNum = null, ruletaNombre = null;
    
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('RONDA')) {
            if (rondaActual !== null && bingoNum !== null && ruletaNum !== null) {
                nuevosGanadores.push({
                    ronda: rondaActual,
                    bingoNum: bingoNum,
                    bingoNombre: bingoNombre,
                    ruletaNum: ruletaNum,
                    ruletaNombre: ruletaNombre
                });
            }
            const partes = line.split(' ');
            rondaActual = parseInt(partes[1]);
            bingoNum = null; bingoNombre = null; ruletaNum = null; ruletaNombre = null;
        } else if (line.startsWith('Bingo')) {
            const partes = line.split('---');
            const numPart = partes[0].replace('Bingo #', '').trim();
            bingoNum = parseInt(numPart);
            bingoNombre = partes[1] ? partes[1].trim() : '';
        } else if (line.startsWith('Ruleta')) {
            const partes = line.split('---');
            const numPart = partes[0].replace('Ruleta #', '').trim();
            ruletaNum = parseInt(numPart);
            ruletaNombre = partes[1] ? partes[1].trim() : '';
        }
    }
    
    if (rondaActual !== null && bingoNum !== null && ruletaNum !== null) {
        nuevosGanadores.push({
            ronda: rondaActual,
            bingoNum: bingoNum,
            bingoNombre: bingoNombre,
            ruletaNum: ruletaNum,
            ruletaNombre: ruletaNombre
        });
    }
    
    if (nuevosGanadores.length > 0) {
        historialGanadores = nuevosGanadores;
        await updateDoc(docRef, { historialGanadores: historialGanadores });
        alert("✅ Ganadores guardados");
    } else {
        alert("⚠️ No se pudo guardar. Verifica el formato.");
    }
};

window.limpiarGanadores = async () => {
    if (confirm("⚠️ ¿Estás seguro? Esto borrará TODO el historial de ganadores.")) {
        historialGanadores = [];
        await updateDoc(docRef, { historialGanadores: historialGanadores });
        document.getElementById("ganadoresTextarea").value = "No hay ganadores registrados aún.";
        alert("✅ Historial de ganadores limpiado");
    }
};

// ========== FUNCIONES PARA NÚMEROS SALIDOS ==========
window.mostrarModalNumeros = () => {
    const textarea = document.getElementById("numerosTextarea");
    let texto = "";
    if (numerosSalidos.bingos && numerosSalidos.bingos.length > 0) {
        texto += `BINGOS: ${numerosSalidos.bingos.join(', ')}\n`;
    } else {
        texto += "BINGOS: Ninguno aún\n";
    }
    if (numerosSalidos.ruletas && numerosSalidos.ruletas.length > 0) {
        texto += `RULETAS: ${numerosSalidos.ruletas.join(', ')}`;
    } else {
        texto += "RULETAS: Ninguna aún";
    }
    textarea.value = texto;
    document.getElementById("modalNumeros").style.display = "flex";
};

window.cerrarModalNumeros = () => {
    document.getElementById("modalNumeros").style.display = "none";
};

window.guardarNumeros = async () => {
    const texto = document.getElementById("numerosTextarea").value;
    const lines = texto.split('\n');
    const bingos = [];
    const ruletas = [];
    
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('BINGOS:')) {
            const nums = line.replace('BINGOS:', '').trim();
            nums.split(',').forEach(n => {
                const num = parseInt(n.trim());
                if (!isNaN(num)) bingos.push(num);
            });
        } else if (line.startsWith('RULETAS:')) {
            const nums = line.replace('RULETAS:', '').trim();
            nums.split(',').forEach(n => {
                const num = parseInt(n.trim());
                if (!isNaN(num)) ruletas.push(num);
            });
        }
    }
    
    numerosSalidos.bingos = bingos;
    numerosSalidos.ruletas = ruletas;
    await updateDoc(docRef, { numerosSalidos: numerosSalidos });
    alert("✅ Números guardados");
};

window.limpiarNumeros = async () => {
    if (confirm("⚠️ ¿Estás seguro? Esto borrará TODOS los números salidos.")) {
        numerosSalidos.bingos = [];
        numerosSalidos.ruletas = [];
        await updateDoc(docRef, { numerosSalidos: numerosSalidos });
        document.getElementById("numerosTextarea").value = "BINGOS: Ninguno aún\nRULETAS: Ninguna aún";
        alert("✅ Números limpiados");
    }
};

// ========== FUNCIONES PARA RONDAS ==========
function rondasToText() {
    let texto = "";
    for (let [nombre, rondas] of Object.entries(rondasPorJugador).sort((a,b)=>b[1]-a[1])) {
        texto += `${nombre}: ${rondas}\n`;
    }
    return texto.trim();
}

function textToRondas(texto) {
    const nuevas = {};
    texto.toUpperCase().split('\n').forEach(linea => {
        linea = linea.trim();
        if (linea.includes(':')) {
            let partes = linea.split(':');
            let nombre = partes[0].trim();
            let valor = parseInt(partes[1].trim());
            if (nombre && !isNaN(valor) && valor > 0) nuevas[nombre] = valor;
        }
    });
    return nuevas;
}

window.mostrarModalRondas = () => {
    document.getElementById("rondasTextarea").value = rondasToText();
    document.getElementById("modalRondas").style.display = "flex";
};
window.cerrarModalRondas = () => { document.getElementById("modalRondas").style.display = "none"; };
window.guardarRondas = async () => {
    const nuevas = textToRondas(document.getElementById("rondasTextarea").value);
    await updateDoc(docRef, { rondasPorJugador: nuevas });
    rondasPorJugador = nuevas;
    alert("Rondas guardadas ✅");
    cerrarModalRondas();
    actualizarStats();
};
window.reiniciarRondas = async () => {
    if (confirm("⚠️ ¿Estás seguro? Esto borrará TODAS las rondas por jugador.")) {
        rondasPorJugador = {};
        await updateDoc(docRef, { rondasPorJugador: rondasPorJugador });
        alert("✅ Rondas reiniciadas");
        document.getElementById("rondasTextarea").value = "";
        actualizarStats();
    }
};

// ========== FUNCIONES PARA EL ACUMULADO ==========
window.modificarAcumulado = async (cambio) => {
    let nuevo = acumulado + cambio;
    if (nuevo < 0) nuevo = 0;
    acumulado = nuevo;
    await updateDoc(docRef, { acumulado: acumulado });
    actualizarUIAcumulado();
    actualizarStats();
};

window.resetearAcumulado = async () => {
    if (confirm("¿Resetear acumulado a $0?")) {
        acumulado = 0;
        await updateDoc(docRef, { acumulado: 0 });
        actualizarUIAcumulado();
        actualizarStats();
        alert("Acumulado reseteado");
    }
};

// ========== FUNCIONES PARA LA RESERVA ==========
window.modificarReserva = async (cambio) => {
    let nuevo = acumuladoReserva + cambio;
    if (nuevo < 0) nuevo = 0;
    acumuladoReserva = nuevo;
    await updateDoc(docRef, { acumuladoReserva: acumuladoReserva });
    actualizarUIAcumulado();
    actualizarStats();
};

window.activarReservaDirecto = async () => {
    if (acumuladoReserva === 0) {
        alert("⚠️ No hay dinero en reserva para activar");
        return;
    }
    
    if (confirm(`¿Activar reserva de $${getAcumuladoReservaEnPesos().toLocaleString()}?\n\nSe sumará al acumulado principal y la reserva quedará en $0.`)) {
        acumulado = acumulado + acumuladoReserva;
        acumuladoReserva = 0;
        await updateDoc(docRef, {
            acumulado: acumulado,
            acumuladoReserva: acumuladoReserva
        });
        document.getElementById('chkActivarReserva').checked = false;
        actualizarUIAcumulado();
        actualizarStats();
        alert(`✅ Reserva activada. Nuevo acumulado: $${getAcumuladoEnPesos().toLocaleString()}`);
    }
};

window.reiniciarRondaACero = async () => {
    if (confirm("⚠️ ¿REINICIAR EL CONTADOR DE RONDA A 1? ⚠️\n\nEsto NO afecta el acumulado, ni los puntos, ni las rondas por jugador.\nSolo cambia el número de ronda que se muestra.\n\n¿Estás seguro?")) {
        await updateDoc(docRef, { numero_ronda: 1 });
        numeroRonda = 1;
        actualizarStats();
        alert("Ronda reiniciada a 1 ✅");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnMenos = document.getElementById('btnAcumuladoMenos');
    const btnMas = document.getElementById('btnAcumuladoMas');
    const btnReset = document.getElementById('btnAcumuladoReset');
    if (btnMenos) btnMenos.addEventListener('click', () => modificarAcumulado(-1));
    if (btnMas) btnMas.addEventListener('click', () => modificarAcumulado(1));
    if (btnReset) btnReset.addEventListener('click', () => resetearAcumulado());
});

function ajustarTamanoTexto(elemento, texto) {
    if (!elemento) return;
    elemento.style.fontSize = '';
    elemento.style.whiteSpace = 'normal';
    elemento.style.wordBreak = 'break-word';
    let fontSize = 16;
    elemento.style.fontSize = fontSize + 'px';
    while ((elemento.scrollHeight > 60 || elemento.scrollWidth > elemento.clientWidth) && fontSize > 10) {
        fontSize--;
        elemento.style.fontSize = fontSize + 'px';
    }
}

function obtenerTodosLosNombresConRepeticiones(numCarton) {
    let idx = numCarton - 1;
    if (idx < 0 || idx >= datos.length) return [];
    const carton = datos[idx];
    let lista = [];
    for (let linea of carton.lineas) {
        if (linea.nombre && linea.estado !== "libre" && linea.nombre.trim() !== "") {
            lista.push(linea.nombre.trim());
        }
    }
    return lista;
}

function obtenerSugerenciasDesdeCaja() {
    const cajaRaw = document.getElementById("notas-caja").value;
    const lineas = cajaRaw.split('\n');
    const nombres = [];
    lineas.forEach(l => {
        const partes = l.split(':');
        if (partes.length >= 2) {
            let nom = partes[0].trim().toUpperCase();
            if (nom) nombres.push(nom);
        }
    });
    return [...new Set(nombres)].sort();
}

function actualizarCampoNombre() {
    const input = document.getElementById("nombreUser");
    if (config.bloqueado && !config.admin) {
        input.disabled = true;
        input.placeholder = "🔒 CERRADO - Solo administrador";
    } else {
        input.disabled = false;
        input.placeholder = "ESCRIBE TU NOMBRE AQUÍ";
    }
}

function actualizarStats() {
    let lib=0, res=0, pag=0;
    datos.forEach(c => c.lineas.forEach(l => {
        if(l.estado==='libre') lib++;
        else if(l.estado==='reservado') res++;
        else pag++;
    }));
    document.getElementById("stats").innerHTML = `<span class="stats-libres">LIBRES: ${lib}</span> | <span class="stats-ocupados">RESERVADOS: ${res}</span> | <span class="stats-pagados">PAGADOS: ${pag}</span>`;
    const btnLista = document.getElementById("btnCopiarLista");
    if(btnLista) btnLista.innerText = "📋 COPIAR LISTA WHATSAPP";
    const btnLink = document.getElementById("btnLinkPromocion");
    if(btnLink) btnLink.innerText = "🔗 MANDAR LINK";
    
    const rondaGrande = document.getElementById("rondaGrande");
    if (rondaGrande) {
        if (config.admin) {
            rondaGrande.classList.remove('oculta');
            rondaGrande.innerHTML = `🎰 RONDA ${numeroRonda} 🎰`;
        } else {
            rondaGrande.classList.add('oculta');
        }
    }
    actualizarUIAcumulado();
}

function dibujar() {
    const container = document.getElementById("tablero");
    container.innerHTML = "";
    datos.forEach((carton, cIdx) => {
        const div = document.createElement("div");
        div.className = "carton";
        div.innerHTML = `<div class="carton-h">${cIdx + 1}</div>`;
        carton.lineas.forEach((linea, lIdx) => {
            const lDiv = document.createElement("div");
            lDiv.className = `linea ${linea.estado}`;
            if(!linea.nombre || linea.nombre === "") lDiv.classList.add("libre");
            if(seleccionados.some(s => s.c === cIdx && s.l === lIdx)) lDiv.classList.add("sel");
            let displayText = (linea.nombre && linea.nombre !== "") ? linea.nombre : (cIdx + 1).toString();
            lDiv.innerText = displayText;
            if (linea.nombre && linea.nombre !== "") {
                ajustarTamanoTexto(lDiv, displayText);
            }
            lDiv.onclick = (function(cartIdx, lineIdx) {
                return function() { manejarClick(cartIdx, lineIdx); };
            })(cIdx, lIdx);
            div.appendChild(lDiv);
        });
        container.appendChild(div);
    });
    const btnLupa = document.getElementById("btnLupaExterna");
    btnLupa.innerText = modoVerificacion ? "✅" : "🔍";
    btnLupa.style.background = modoVerificacion ? "#38D400" : "#007bff";
}

// ============================================================
// MANEJAR CLICK - VERSIÓN MEJORADA CON LECTURA PREVIA DE FIREBASE
// ============================================================
async function manejarClick(c, l) {
    if (cronometroActivo) {
        return;
    }
    
    if (pendingUpdate) return;
    
    const lineaActual = datos[c].lineas[l];
    const nombreClick = lineaActual.nombre;
    
    if (modoVerificacion && nombreClick && nombreClick !== "") {
        seleccionados = [];
        let listaCartones = [];
        datos.forEach((carton, ci) => {
            carton.lineas.forEach((linea, li) => {
                if(linea.nombre === nombreClick) {
                    seleccionados.push({c: ci, l: li});
                    listaCartones.push(ci + 1);
                }
            });
        });
        document.getElementById("msgLineas").innerText = `${nombreClick}: ${seleccionados.length} líneas en: ${listaCartones.join(", ")}`;
        dibujar();
        return;
    }
    
    if (config.admin) {
        const nombreInput = document.getElementById("nombreUser").value.trim().toUpperCase();
        if(lineaActual.estado === "libre" && nombreInput !== "") {
            pendingUpdate = true;
            guardarHistorial();
            
            try {
                const snap = await getDoc(docRef);
                if (!snap.exists()) {
                    pendingUpdate = false;
                    return;
                }
                const data = snap.data();
                let cartonesActuales = data.cartones || [];
                
                if (!cartonesActuales[c] || !cartonesActuales[c].lineas) {
                    pendingUpdate = false;
                    return;
                }
                
                if (cartonesActuales[c].lineas[l].estado !== "libre") {
                    pendingUpdate = false;
                    return;
                }
                
                cartonesActuales[c].lineas[l] = { nombre: nombreInput, estado: "reservado" };
                await updateDoc(docRef, { cartones: cartonesActuales });
            } catch (error) {
                console.error("Error al guardar:", error);
            }
            pendingUpdate = false;
        } else {
            const idx = seleccionados.findIndex(s => s.c === c && s.l === l);
            if (idx > -1) seleccionados.splice(idx, 1);
            else seleccionados.push({c, l});
            dibujar();
        }
        return;
    }
    
    if(config.bloqueado && !config.admin) return;
    const n = document.getElementById("nombreUser").value.trim().toUpperCase();
    if(!n) return;
    
    if(lineaActual.estado === "libre") {
        pendingUpdate = true;
        guardarHistorial();
        
        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
                pendingUpdate = false;
                return;
            }
            const data = snap.data();
            let cartonesActuales = data.cartones || [];
            
            if (!cartonesActuales[c] || !cartonesActuales[c].lineas) {
                pendingUpdate = false;
                return;
            }
            
            if (cartonesActuales[c].lineas[l].estado !== "libre") {
                alert("⚠️ Esta línea ya fue ocupada por otra persona.");
                pendingUpdate = false;
                return;
            }
            
            cartonesActuales[c].lineas[l] = { nombre: n, estado: "reservado" };
            await updateDoc(docRef, { cartones: cartonesActuales });
        } catch (error) {
            console.error("Error al guardar:", error);
        }
        pendingUpdate = false;
    }
}

window.toggleVerificacionGlobal = () => {
    modoVerificacion = !modoVerificacion;
    if (!modoVerificacion) { seleccionados = []; document.getElementById("msgLineas").innerText = ""; }
    dibujar();
};
window.activarCaptura = () => {
    document.body.classList.add('modo-captura');
    document.getElementById('volverArea').style.display = 'flex';
    actualizarStats();
};
window.desactivarCaptura = () => {
    document.body.classList.remove('modo-captura');
    document.getElementById('volverArea').style.display = 'none';
};

window.toggleAdmin = async () => {
    if(!config.admin) {
        const pass = prompt("Clave admin:");
        const snap = await getDoc(docRef);
        if(pass === snap.data().pass) {
            config.admin = true;
            document.getElementById("adminPanel").style.display = "flex";
            document.getElementById("adminExtraPanel").style.display = "block";
            actualizarCampoNombre();
            actualizarStats();
        } else alert("Clave incorrecta");
    } else {
        config.admin = false;
        document.getElementById("adminPanel").style.display = "none";
        document.getElementById("adminExtraPanel").style.display = "none";
        modoVerificacion = false;
        seleccionados = [];
        document.getElementById("msgLineas").innerText = "";
        actualizarCampoNombre();
        actualizarStats();
        dibujar();
    }
};

async function guardarHistorial() {
    historial.push(JSON.parse(JSON.stringify(datos)));
    if(historial.length > 10) historial.shift();
}

window.mostrarModalModificar = () => {
    if (seleccionados.length === 0) { alert("Selecciona una o más líneas primero"); return; }
    const textoActual = datos[seleccionados[0].c].lineas[seleccionados[0].l].nombre || "";
    document.getElementById("modalNombreInput").value = textoActual;
    document.getElementById("buscarSugerenciaModal").value = "";
    actualizarListaSugerenciasModal("");
    document.getElementById("modalModificar").style.display = "flex";
};

window.filtrarSugerenciasModal = () => {
    const filtro = document.getElementById("buscarSugerenciaModal").value.trim().toUpperCase();
    actualizarListaSugerenciasModal(filtro);
};

function actualizarListaSugerenciasModal(filtro) {
    const sugerencias = obtenerSugerenciasDesdeCaja();
    const container = document.getElementById("sugerenciasModalList");
    container.innerHTML = "";
    let filtradas = sugerencias;
    if (filtro) filtradas = sugerencias.filter(n => n.includes(filtro));
    filtradas.forEach(nom => {
        const div = document.createElement("div");
        div.className = "sugerencia-item";
        div.innerText = nom;
        div.onclick = () => {
            document.getElementById("modalNombreInput").value = nom;
            document.getElementById("buscarSugerenciaModal").value = "";
            actualizarListaSugerenciasModal("");
        };
        container.appendChild(div);
    });
    if (filtradas.length === 0) container.innerHTML = "<div style='padding:8px; color:#aaa;'>Sin coincidencias</div>";
}

window.aplicarModificacionMultiple = async () => {
    let nuevoTexto = document.getElementById("modalNombreInput").value.trim().toUpperCase();
    guardarHistorial();
    for (let sel of seleccionados) {
        datos[sel.c].lineas[sel.l].nombre = nuevoTexto;
        datos[sel.c].lineas[sel.l].estado = nuevoTexto ? "reservado" : "libre";
    }
    await updateDoc(docRef, { cartones: datos });
    seleccionados = [];
    cerrarModal();
    dibujar();
    actualizarStats();
};

window.cerrarModal = () => {
    document.getElementById("modalModificar").style.display = "none";
};

window.marcarAccion = async (nuevoEstado) => {
    if (seleccionados.length === 0) return;
    guardarHistorial();
    let nuevaCaja = document.getElementById("notas-caja").value.toUpperCase();
    let cartonesAActualizar = JSON.parse(JSON.stringify(datos));
    let cambiosRealizados = false;
    
    if (nuevoEstado === 'pagado') {
        let lineasPorNombre = {};
        for (let sel of seleccionados) {
            const info = datos[sel.c].lineas[sel.l];
            if (info.nombre && info.estado !== 'pagado') {
                let nombre = info.nombre.trim();
                if (!lineasPorNombre[nombre]) lineasPorNombre[nombre] = [];
                lineasPorNombre[nombre].push(sel);
            }
        }
        
        for (let nombre in lineasPorNombre) {
            let indices = lineasPorNombre[nombre];
            let cantidad = indices.length;
            let costo = cantidad * 1.5;
            
            let lineasCaja = nuevaCaja.split('\n').map(l => l.trim()).filter(l => l !== "");
            let saldoActual = 0, indexLinea = -1;
            lineasCaja.forEach((l, i) => {
                if (l.startsWith(nombre + ":")) {
                    let partes = l.split(':');
                    saldoActual = parseFloat(partes[1].trim()) || 0;
                    indexLinea = i;
                }
            });
            
            const formatPesos = (valorEnMiles) => {
                return Math.round(valorEnMiles * 1000).toLocaleString('es-CO');
            };
            
            if (indexLinea !== -1 && saldoActual >= costo) {
                let saldoRestante = saldoActual - costo;
                let mensajeConfirmacion = `✅✅✅ ${nombre} tiene $${formatPesos(saldoActual)} en caja\n`;
                mensajeConfirmacion += `Va a jugar ${cantidad} línea(s) → costo: $${formatPesos(costo)}\n`;
                mensajeConfirmacion += `Le quedarán: $${formatPesos(saldoRestante)}\n\n`;
                mensajeConfirmacion += `¿Confirmar pago?`;
                if (confirm(mensajeConfirmacion)) {
                    let nuevoSaldo = saldoActual - costo;
                    if (nuevoSaldo > 0) lineasCaja[indexLinea] = `${nombre}: ${nuevoSaldo}`;
                    else lineasCaja.splice(indexLinea, 1);
                    nuevaCaja = lineasCaja.join('\n');
                    
                    indices.forEach(sel => {
                        cartonesAActualizar[sel.c].lineas[sel.l].estado = 'pagado';
                    });
                    cambiosRealizados = true;
                }
            } else if (indexLinea !== -1 && saldoActual > 0 && saldoActual < costo) {
                let saldoRestante = saldoActual - costo;
                let mensajeAdvertencia = `⚠️⚠️⚠️ ${nombre} tiene $${formatPesos(saldoActual)} en caja\n`;
                mensajeAdvertencia += `Va a jugar ${cantidad} línea(s) → costo: $${formatPesos(costo)}\n`;
                mensajeAdvertencia += `Le quedarían: $${formatPesos(saldoRestante)}\n\n`;
                mensajeAdvertencia += `¿Marcar VERDE igualmente?`;
                if (confirm(mensajeAdvertencia)) {
                    lineasCaja.splice(indexLinea, 1);
                    nuevaCaja = lineasCaja.join('\n');
                    indices.forEach(sel => {
                        cartonesAActualizar[sel.c].lineas[sel.l].estado = 'pagado';
                    });
                    cambiosRealizados = true;
                }
            } else {
                let mensajeAdvertencia = `⚠️⚠️⚠️ ${nombre} NO tiene saldo en caja\n`;
                mensajeAdvertencia += `Va a jugar ${cantidad} línea(s) → costo: $${formatPesos(costo)}\n\n`;
                mensajeAdvertencia += `¿Marcar VERDE igualmente?`;
                if (confirm(mensajeAdvertencia)) {
                    indices.forEach(sel => {
                        cartonesAActualizar[sel.c].lineas[sel.l].estado = 'pagado';
                    });
                    cambiosRealizados = true;
                }
            }
        }
    } else if (nuevoEstado === 'libre') {
        if (!confirm("⚠️⚠️⚠️ ¿Liberar y borrar nombres de las líneas seleccionadas?")) return;
        for (let sel of seleccionados) {
            cartonesAActualizar[sel.c].lineas[sel.l].estado = "libre";
            cartonesAActualizar[sel.c].lineas[sel.l].nombre = "";
        }
        cambiosRealizados = true;
    }
    
    if (cambiosRealizados) {
        datos = cartonesAActualizar;
        seleccionados = [];
        document.getElementById("msgLineas").innerText = "";
        await updateDoc(docRef, { cartones: datos, notas_caja: nuevaCaja });
        dibujar();
        actualizarStats();
    }
};

window.generarMensajeGanadorMulti = async () => {
    const bInput = document.getElementById("numGanador").value;
    const rInput = document.getElementById("numRuletaFisica").value;
    if (!bInput || !rInput) { alert("Ingresa números de Bingo y Ruleta"); return; }
    const numBingo = parseInt(bInput);
    const numRuleta = parseInt(rInput);
    const nombresBingo = obtenerTodosLosNombresConRepeticiones(numBingo);
    if (nombresBingo.length === 0) { alert("Cartón sin nombres"); return; }
    const nombresRuleta = obtenerTodosLosNombresConRepeticiones(numRuleta);
    
    const esMismoNumero = (numBingo === numRuleta);
    const entregarAcumulado = document.getElementById("chkEntregarAcumulado").checked;
    const acumuladoPesos = getAcumuladoEnPesos();
    
    function agruparNombres(lista) {
        const conteo = {};
        lista.forEach(n => {
            conteo[n] = (conteo[n] || 0) + 1;
        });
        return conteo;
    }
    
    const conteoBingo = agruparNombres(nombresBingo);
    const conteoRuleta = agruparNombres(nombresRuleta);
    
    const nombresUnicosBingo = Object.keys(conteoBingo);
    const nombresUnicosRuleta = Object.keys(conteoRuleta);
    const esMismaPersona = (nombresUnicosBingo.length === 1 && nombresUnicosRuleta.length === 1 && nombresUnicosBingo[0] === nombresUnicosRuleta[0]);
    
    let mensaje = `*🎰 BINGO LOCUTANDO*\n`;
    mensaje += ` \n`;
    
    let premioTotal = 0;
    
    if (esMismoNumero && esMismaPersona) {
        const nombreUnico = nombresUnicosBingo[0];
        const cantidadTotal = conteoBingo[nombreUnico];
        premioTotal = 15000 * cantidadTotal;
        
        mensaje += `🏆 *BINGO #${numBingo}* 🎰 *RULETA #${numRuleta}*\n`;
        mensaje += `👤 *${nombreUnico}* (${cantidadTotal} línea${cantidadTotal > 1 ? 's' : ''})\n`;
        mensaje += ` \n`;
        
        if (entregarAcumulado && acumulado > 0) {
            mensaje += `💰 *¡GANADOR DEL ACUMULADO!* 💰\n`;
            mensaje += `🏆 Lleva $${acumuladoPesos.toLocaleString()} EXTRA\n`;
            mensaje += ` \n`;
            premioTotal += acumuladoPesos;
        } else if (acumulado > 0) {
            mensaje += `⚠️ *ACUMULADO NO ENTREGADO*\n`;
            mensaje += `📌 No cumple las condiciones (4 rondas diferentes en el día).\n`;
            mensaje += `💰 El acumulado de $${acumuladoPesos.toLocaleString()} sigue en juego.\n`;
            mensaje += ` \n`;
        }
        
        mensaje += `🎉 *${nombreUnico} GANA $${premioTotal.toLocaleString()} EN TOTAL* 🎉\n`;
    } else if (esMismaPersona) {
        const nombreUnico = nombresUnicosBingo[0];
        const cantidadBingo = conteoBingo[nombreUnico];
        const cantidadRuleta = conteoRuleta[nombreUnico];
        premioTotal = (10000 * cantidadBingo) + (5000 * cantidadRuleta);
        
        mensaje += `🏆 *BINGO #${numBingo}*\n`;
        mensaje += `👤 *${nombreUnico}* (${cantidadBingo} línea${cantidadBingo > 1 ? 's' : ''}) gana *$${(10000 * cantidadBingo).toLocaleString()}💰*\n`;
        mensaje += ` \n`;
        
        mensaje += `🎰 *RULETA #${numRuleta}*\n`;
        mensaje += `👤 *${nombreUnico}* (${cantidadRuleta} línea${cantidadRuleta > 1 ? 's' : ''}) gana *$${(5000 * cantidadRuleta).toLocaleString()}💰*\n`;
        mensaje += ` \n`;
        mensaje += `🎉 *${nombreUnico} GANA $${premioTotal.toLocaleString()} (Bingo + Ruleta)* 🎉\n`;
    } else {
        mensaje += `🏆 *BINGO #${numBingo}*\n`;
        for (let [nombre, cantidad] of Object.entries(conteoBingo)) {
            const total = 10000 * cantidad;
            if (cantidad === 1) {
                mensaje += `👤 *${nombre}* gana *$${total.toLocaleString()}💰*\n`;
            } else {
                mensaje += `👤 *${nombre}* (${cantidad} líneas) gana *$${total.toLocaleString()}💰*\n`;
            }
        }
        mensaje += ` \n`;
        
        mensaje += `🎰 *RULETA #${numRuleta}*\n`;
        for (let [nombre, cantidad] of Object.entries(conteoRuleta)) {
            const total = 5000 * cantidad;
            if (cantidad === 1) {
                mensaje += `👤 *${nombre}* gana *$${total.toLocaleString()}💰*\n`;
            } else {
                mensaje += `👤 *${nombre}* (${cantidad} líneas) gana *$${total.toLocaleString()}💰*\n`;
            }
        }
    }
    
    mensaje += `\n✅ *Felicidades a los ganadores!*`;

    navigator.clipboard.writeText(mensaje.trim());
    alert("Mensaje de ganadores copiado");
    
    if (nombresBingo.length > 0) {
        const bingoNombre = nombresBingo.length === 1 ? nombresBingo[0] : nombresBingo.join(", ");
        const ruletaNombre = nombresRuleta.length === 1 ? nombresRuleta[0] : nombresRuleta.join(", ");
        await guardarGanadoresEnHistorial(numBingo, bingoNombre, numRuleta, ruletaNombre);
    }
};

// ========== FUNCIÓN CARGAR PREMIOS EN CAJA ==========
window.cargarPremiosACajaMulti = async () => {
    const bInput = document.getElementById("numGanador").value;
    const rInput = document.getElementById("numRuletaFisica").value;
    
    if (!bInput || !rInput) {
        alert("⚠️ Ingresa números de Bingo y Ruleta");
        return;
    }
    
    const numBingo = parseInt(bInput);
    const numRuleta = parseInt(rInput);
    const nombresBingo = obtenerTodosLosNombresConRepeticiones(numBingo);
    
    if (nombresBingo.length === 0) {
        alert("⚠️ El cartón de BINGO #" + numBingo + " no tiene nombres asignados");
        return;
    }
    
    const nombresRuleta = obtenerTodosLosNombresConRepeticiones(numRuleta);
    
    if (nombresRuleta.length === 0) {
        alert("⚠️ El cartón de RULETA #" + numRuleta + " no tiene nombres asignados");
        return;
    }
    
    const esMismoNumero = (numBingo === numRuleta);
    const entregarAcumulado = document.getElementById("chkEntregarAcumulado").checked;
    const acumuladoPesos = getAcumuladoEnPesos();
    const acumuladoEnMiles = acumuladoPesos / 1000;
    const tramoActual = getTramoActual();
    const clave = getClaveTramo(tramoActual);
    
    if (!puntosPorTramo[clave]) puntosPorTramo[clave] = {};
    
    let nuevaCaja = document.getElementById("notas-caja").value.toUpperCase();
    let lineas = nuevaCaja.split('\n').map(l => l.trim()).filter(l => l !== "");
    let resumenPremios = [];
    let premiosAgregados = false;
    let acumuladoEntregado = false;
    
    function agregarSaldo(nombre, cantidadEnMiles, concepto) {
        if (!nombre || cantidadEnMiles === 0) return;
        let encontrado = false;
        lineas = lineas.map(l => {
            if (l.startsWith(nombre + ":")) {
                encontrado = true;
                let partes = l.split(':');
                let valorActual = parseFloat(partes[1].trim()) || 0;
                let nuevoValor = valorActual + cantidadEnMiles;
                return `${nombre}: ${nuevoValor}`;
            }
            return l;
        });
        if (!encontrado) {
            lineas.push(`${nombre}: ${cantidadEnMiles}`);
        }
        const valorFormateado = (cantidadEnMiles * 1000).toLocaleString();
        resumenPremios.push(`• ${nombre}: +$${valorFormateado} (${concepto})`);
        premiosAgregados = true;
    }
    
    function agregarPuntos(nombre, puntos) {
        if (!nombre || puntos === 0) return;
        puntosPorTramo[clave][nombre] = (puntosPorTramo[clave][nombre] || 0) + puntos;
    }
    
    const agruparPorNombre = (lista) => {
        const conteo = {};
        lista.forEach(n => {
            const nombreLimpio = n.trim();
            if (nombreLimpio) {
                conteo[nombreLimpio] = (conteo[nombreLimpio] || 0) + 1;
            }
        });
        return conteo;
    };
    
    if (esMismoNumero) {
        const conteo = agruparPorNombre(nombresBingo);
        for (let [nombre, cantidad] of Object.entries(conteo)) {
            agregarSaldo(nombre, 15 * cantidad, `Bingo+Ruleta x${cantidad}`);
            agregarPuntos(nombre, 5 * cantidad);
        }
    } else {
        const conteoBingo = agruparPorNombre(nombresBingo);
        const conteoRuleta = agruparPorNombre(nombresRuleta);
        
        for (let [nombre, cantidad] of Object.entries(conteoBingo)) {
            agregarSaldo(nombre, 10 * cantidad, `Bingo x${cantidad}`);
            agregarPuntos(nombre, 3 * cantidad);
        }
        
        for (let [nombre, cantidad] of Object.entries(conteoRuleta)) {
            agregarSaldo(nombre, 5 * cantidad, `Ruleta x${cantidad}`);
            agregarPuntos(nombre, 2 * cantidad);
        }
    }
    
    if (esMismoNumero && entregarAcumulado && acumulado > 0) {
        const conteo = agruparPorNombre(nombresBingo);
        const primerGanador = Object.keys(conteo)[0];
        if (primerGanador) {
            agregarSaldo(primerGanador, acumuladoEnMiles, `ACUMULADO 🏆`);
            acumuladoEntregado = true;
            acumulado = 0;
            await updateDoc(docRef, { acumulado: acumulado });
            actualizarUIAcumulado();
        }
    }
    
    if (premiosAgregados) {
        let cajaFinal = lineas.join('\n');
        document.getElementById("notas-caja").value = cajaFinal;
        
        await updateDoc(docRef, {
            notas_caja: cajaFinal,
            puntosPorTramo: puntosPorTramo
        });
        
        let alertMsg = "✅ PREMIOS REG