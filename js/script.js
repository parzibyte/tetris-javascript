/*

  ____          _____               _ _           _       
 |  _ \        |  __ \             (_) |         | |      
 | |_) |_   _  | |__) |_ _ _ __ _____| |__  _   _| |_ ___ 
 |  _ <| | | | |  ___/ _` | '__|_  / | '_ \| | | | __/ _ \
 | |_) | |_| | | |  | (_| | |   / /| | |_) | |_| | ||  __/
 |____/ \__, | |_|   \__,_|_|  /___|_|_.__/ \__, |\__\___|
         __/ |                               __/ |        
        |___/                               |___/         
    
____________________________________
/ Si necesitas ayuda, contáctame en \
\ https://parzibyte.me               /
 ------------------------------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
Creado por Parzibyte (https://parzibyte.me). Este encabezado debe mantenerse intacto,
excepto si este es un proyecto de un estudiante.
*/
let LONGITUD_CUADRADO = screen.width > 420 ? 30 : 20;
const COLUMNAS = 10;
const FILAS = 20;
const ANCHO = LONGITUD_CUADRADO * COLUMNAS;
const ALTO = LONGITUD_CUADRADO * FILAS;
const COLOR_VACIO = ("#eaeaea");
const COLOR_BORDE = ("#ffffff");
const COLOR_ELIMINACION = "#D81C38";
const TIMEOUT_SIGUIENTE_PIEZA_MILISEGUNDOS = 100; // Cuántos milisegundos tiene el jugador para mover la pieza una vez que choca hacia abajo
const MILISEGUNDOS_AVANCE_PIEZA = 300;
const MILISEGUNDOS_ANIMACION_COLOR_DESAPARICION_FILA = 500; // Cuánto dura la animación de colorear los puntos. Recuerda que durante este tiempo, no se avanzará ni se dejará jugar al jugador
const PUNTAJE_POR_CUADRO = 1;
const COLORES_PARA_ELEGIR = [
    "#ffd300",
    "#de38c8",
    "#652ec7",
    "#33135c",
    "#13ca91",
    "#ff9472",
    "#35212a",
    "#ff8b8b",
    "#28cf75",
    "#00a9fe",
    "#04005e",
    "#120052",
    "#272822",
    "#f92672",
    "#66d9ef",
    "#a6e22e",
    "#fd971f",
];
let banderaTimeout = false;
let tablero = [];
const juego = [];
let puedeJugar = false;
let miX, miY;
let puntaje = 0;
let pausado = true;


class Punto {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.limiteX = COLUMNAS - 1;
        this.limiteY = FILAS - 1;
    }
}

class Figura {
    constructor(rotaciones) {
        this.rotaciones = rotaciones;
        this.indiceRotacion = 0;
        this.puntos = this.rotaciones[this.indiceRotacion];
        const colorAleatorio = COLORES_PARA_ELEGIR[obtenerNumeroAleatorioEnRango(0, COLORES_PARA_ELEGIR.length - 1)];
        this.rotaciones.forEach(puntos => {
            puntos.forEach(punto => {
                punto.color = colorAleatorio;
            });
        });
        this.aumentarIndiceDeRotacion();
    }

    getPuntos() {
        return this.puntos;
    }

    puedeMoverDerecha(posicionX, posicionY) {
        for (const punto of this.puntos) {
            const nuevoPunto = new Punto(punto.x + 1, punto.y);
            if (!this.puntoValidoInterno(nuevoPunto, posicionX, posicionY)) {
                return false;
            }
        }
        return true;
    }

    puedeMoverIzquierda(posicionX, posicionY) {
        for (const punto of this.puntos) {
            const nuevoPunto = new Punto(punto.x - 1, punto.y);
            if (!this.puntoValidoInterno(nuevoPunto, posicionX, posicionY)) {
                return false;
            }
        }
        return true;
    }

    puedeMoverAbajo(posicionY, posicionX) {
        for (const punto of this.puntos) {
            const nuevoPunto = new Punto(punto.x, punto.y + 1);
            if (!this.puntoValidoInterno(nuevoPunto, posicionX, posicionY)) {
                return false;
            }
        }
        return true;
    }

    puntoValidoInterno(puntoParaComprobar, posicionX, posicionY) {
        return puntoValido(puntoParaComprobar, posicionX, posicionY, this.puntos);
    }

    puedeRotar(posicionY, posicionX) {
        const nuevosPuntosDespuesDeRotar = this.obtenerSiguienteRotacion();
        for (const puntoRotado of nuevosPuntosDespuesDeRotar) {
            if (!this.puntoValidoInterno(puntoRotado, posicionX, posicionY)) {
                return false;
            }
        }
        return true;
    }

    aumentarIndiceDeRotacion() {
        if (this.rotaciones.length <= 0) {
            this.indiceRotacion = 0;
        } else {
            if (this.indiceRotacion + 1 >= this.rotaciones.length) {
                this.indiceRotacion = 0;
            } else {
                this.indiceRotacion++;
            }
        }
    }

    obtenerSiguienteRotacion() {
        return this.rotaciones[this.indiceRotacion];
    }

    rotar(posicionY, posicionX) {
        if (!this.puedeRotar(posicionY, posicionX)) {
            return;
        }
        this.puntos = this.obtenerSiguienteRotacion();
        this.aumentarIndiceDeRotacion();
    }
}

const $canvas = document.querySelector("#canvas");
const $puntaje = document.querySelector("#puntaje");
const $btnPausar = document.querySelector("#btnPausar"),
    $btnIniciar = document.querySelector("#btnIniciar"),
    $btnRotar = document.querySelector("#btnRotar"),
    $btnAbajo = document.querySelector("#btnAbajo"),
    $btnDerecha = document.querySelector("#btnDerecha"),
    $btnIzquierda = document.querySelector("#btnIzquierda");

$canvas.setAttribute("width", ANCHO + "px");
$canvas.setAttribute("height", ALTO + "px");
const contexto = $canvas.getContext("2d");
const cargarSonido = function (fuente, loop) {
    const sonido = document.createElement("audio");
    sonido.src = fuente;
    sonido.setAttribute("preload", "auto");
    sonido.setAttribute("controls", "none");
    sonido.loop = loop || false;
    sonido.style.display = "none";
    document.body.appendChild(sonido);
    return sonido;
}
const sonidoFondo = cargarSonido("assets/New Donk City_ Daytime 8 Bit.mp3", true);
const sonidoSuccess = cargarSonido("assets/success.wav");
const refrescarPuntaje = () => $puntaje.textContent = `Puntaje: ${puntaje}`;

const reiniciarXEY = () => {
    miX = Math.floor(COLUMNAS / 2) - 1;
    miY = 0;
}

const puntoDesocupadoEnJuego = (x, y) => {
    if (!juego[y]) return true;
    if (!juego[y][x]) return true;
    return !juego[y][x].ocupado;
}
const puntoEstaFueraDeLimites = (punto) => {
    const xRelativo = punto.x + miX;
    const yRelativo = punto.y + miY;
    return xRelativo < 0 || xRelativo > punto.limiteX || yRelativo < 0 || yRelativo > punto.limiteY;
}
const puntoAbsolutoFueraDeLimites = (xRelativo, yRelativo) => {
    return xRelativo < 0 || xRelativo > COLUMNAS - 1 || yRelativo < 0 || yRelativo > FILAS - 1;
}
const puntoValido = (puntoParaComprobar, posicionX, posicionY, puntos) => {
    const desocupado = puntoDesocupadoEnJuego(posicionX + puntoParaComprobar.x, posicionY + puntoParaComprobar.y);
    const ocupaMismaCoordenadaQuePuntoActual = puntos.findIndex(puntoExistente => {
        return puntoParaComprobar.x === puntoExistente.x && puntoParaComprobar.y === puntoExistente.y;
    }) !== -1;
    const fueraDeLimites = puntoEstaFueraDeLimites(puntoParaComprobar);
    return !((!desocupado && !ocupaMismaCoordenadaQuePuntoActual) || fueraDeLimites);
}
/**
 * Devuelve las coordenadas Y de los puntos
 * que se deben eliminar. Puedes confiar en que el arreglo estará
 * ordenado de menor a mayor
 * @returns {[]}
 */
const obtenerPuntosQueSeEliminan = () => {
    const puntos = [];
    let y = 0;
    for (const fila of juego) {
        const filaLlena = fila.every(punto => punto.ocupado);
        if (filaLlena) {
            // Solo necesitamos el valor Y, pues si ya sabemos que la fila está llena, no nos importan los X
            puntos.push(y);
        }
        y++;
    }
    return puntos;
}

const cambiarColorDePuntosQueSeEliminan = coordenadasY => {
    tablero.forEach(punto => {
        if (coordenadasY.indexOf(punto.y) !== -1) {
            punto.color = COLOR_ELIMINACION;
        }
    });
};

const verificarFilasCompletasYEliminarlas = () => {
    const puntos = obtenerPuntosQueSeEliminan();
    if (puntos.length <= 0) return;
    puntaje += PUNTAJE_POR_CUADRO * COLUMNAS * puntos.length;
    sonidoSuccess.currentTime = 0;
    sonidoSuccess.play();
    refrescarPuntaje();
    cambiarColorDePuntosQueSeEliminan(puntos);
    puedeJugar = false;
    setTimeout(() => {
        sonidoSuccess.pause();
        quitarFilasDeTablero(puntos);
        sincronizarPiezasConTablero();
        const puntosInvertidos = Array.from(puntos);
        puntosInvertidos.reverse();
        for (const y of puntosInvertidos) {
            tablero.sort((a, b) => {
                return b.y - a.y;
            })
            tablero = tablero.map(punto => {
                if (punto.y < y) {
                    let contador = 0;
                    while (puntoDesocupadoEnJuego(punto.x, punto.y + 1) && !puntoAbsolutoFueraDeLimites(punto.x, punto.y + 1) && contador < puntos.length) {
                        punto.y++;
                        contador++;
                        sincronizarPiezasConTablero();
                    }
                }
                return punto;
            });
        }
        sincronizarPiezasConTablero();
        puedeJugar = true;
    }, MILISEGUNDOS_ANIMACION_COLOR_DESAPARICION_FILA);
}

const quitarFilasDeTablero = posiciones => {
    for (const posicionY of posiciones) {
        tablero = tablero.filter(punto => {
            return punto.y !== posicionY;
        });
    }
}

// Todo: mover a un init
reiniciarXEY();


const inicializarTableroDeJuego = () => {
    for (let y = 0; y < FILAS; y++) {
        juego.push([]);
        for (let x = 0; x < COLUMNAS; x++) {
            juego[y].push({
                color: COLOR_VACIO,
                ocupado: false,
            });
        }
    }
};
inicializarTableroDeJuego();
const llenar = () => {
    for (let y = 0; y < FILAS; y++) {
        for (let x = 0; x < COLUMNAS; x++) {
            juego[y][x] = {
                color: COLOR_VACIO,
                ocupado: false,
            };
        }
    }
};
const agregarFiguraATablero = (figura) => {
    for (const punto of figura.getPuntos()) {
        punto.x += miX;
        punto.y += miY;
        tablero.push(punto);
    }
    reiniciarXEY();
}
const superponerTablero = () => {
    for (const punto of tablero) {
        juego[punto.y][punto.x] = {
            color: punto.color,
            ocupado: true,
        };
    }
};


const moverFiguraATablero = (figura) => {
    for (const punto of figura.getPuntos()) {
        juego[punto.y + miY][punto.x + miX] = {
            color: punto.color,
            ocupado: true,
        }
    }
}


llenar(juego);
const dibujar = () => {
    let x = 0, y = 0;
    for (const fila of juego) {
        x = 0;
        for (const cuadro of fila) {
            let colorRelleno;
            if (cuadro.ocupado) {
                colorRelleno = cuadro.color;
            } else {
                colorRelleno = COLOR_VACIO;
            }
            contexto.fillStyle = cuadro.ocupado ? cuadro.color : COLOR_VACIO;
            contexto.fillRect(x, y, LONGITUD_CUADRADO, LONGITUD_CUADRADO);
            contexto.restore();
            contexto.strokeStyle = COLOR_BORDE;
            contexto.strokeRect(x, y, LONGITUD_CUADRADO, LONGITUD_CUADRADO);
            x += LONGITUD_CUADRADO;
        }
        y += LONGITUD_CUADRADO;
    }
    requestAnimationFrame(dibujar);
}
const obtenerNumeroAleatorioEnRango = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const elegirAleatoria = () => {
    /*
    * Nombres de los tetrominós tomados de: https://www.joe.co.uk/gaming/tetris-block-names-221127
    * Regresamos una nueva instancia en cada ocasión, pues si definiéramos las figuras en constantes o variables, se tomaría la misma
    * referencia en algunas ocasiones
    * */
    switch (obtenerNumeroAleatorioEnRango(1, 7)) {
        case 1:
            /*
            El cuadrado (smashboy)

            **
            **
            */
            return new Figura([
                [new Punto(0, 0), new Punto(1, 0), new Punto(0, 1), new Punto(1, 1)]
            ]);
        case 2:

            /*
            La línea (hero)

            ****
            */
            return new Figura([
                [new Punto(0, 0), new Punto(1, 0), new Punto(2, 0), new Punto(3, 0)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)],
            ]);
        case 3:

            /*
            La L (orange ricky)
              *
            ***

            */

            return new Figura([
                [new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(1, 2)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(1, 0), new Punto(2, 0)],
                [new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(1, 2)],
            ]);
        case 4:

            /*
            La J (blue ricky)
            *
            ***

            */

            return new Figura([
                [new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1)],
                [new Punto(0, 0), new Punto(1, 0), new Punto(0, 1), new Punto(0, 2)],
                [new Punto(0, 0), new Punto(1, 0), new Punto(2, 0), new Punto(2, 1)],
                [new Punto(0, 2), new Punto(1, 2), new Punto(1, 1), new Punto(1, 0)],
            ]);
        case 5:
            /*
           La Z (Cleveland Z)
           **
            **
           */

            return new Figura([
                [new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)],
                [new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(0, 2)],
            ]);
        case 6:

            /*
           La otra Z (Rhode island Z)
            **
           **
           */
            return new Figura([
                [new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(1, 2)],
            ]);
        case 7:
        default:

            /*
           La T (Teewee)

            *
           ***
           */
            return new Figura([
                [new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 1)],
                [new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(1, 1)],
                [new Punto(0, 0), new Punto(1, 0), new Punto(2, 0), new Punto(1, 1)],
                [new Punto(0, 1), new Punto(1, 0), new Punto(1, 1), new Punto(1, 2)],
            ]);
    }
}
const sincronizarPiezasConTablero = () => {
    llenar();
    superponerTablero();
    moverFiguraATablero(j);
};
let siguienteDireccion;
let idInterval;
let j = elegirAleatoria();
const loop = () => {

    if (!puedeJugar) {
        return;
    }
    if (j.puedeMoverAbajo(miY, miX)) {
        miY++;
    } else {
        if (!puedeJugar) {
            return;
        }

        if (banderaTimeout) return;
        banderaTimeout = true;
        setTimeout(() => {
            banderaTimeout = false;
            if (j.puedeMoverAbajo(miY, miX)) {
                return;
            }
            agregarFiguraATablero(j);

            if (pierde()) {
                Swal.fire("Juego terminado", "Perdiste. Refresca la página para jugar de nuevo");
                sonidoFondo.pause();
                puedeJugar = false;
                return;
            }
            verificarFilasCompletasYEliminarlas();
            j = elegirAleatoria();
            sincronizarPiezasConTablero();
        }, TIMEOUT_SIGUIENTE_PIEZA_MILISEGUNDOS);
    }
    sincronizarPiezasConTablero();
};
const intentarMoverDerecha = () => {
    if (j.puedeMoverDerecha(miX, miY)) {
        miX++;
    }
};
const intentarMoverIzquierda = () => {
    if (j.puedeMoverIzquierda(miX, miY)) {
        miX--
    }
};
const intentarMoverAbajo = () => {
    if (j.puedeMoverAbajo(miY, miX)) {
        miY++;
    }
};

const intentarRotar = () => {
    j.rotar(miY, miX);
};
const pausarOReanudar = () => {
    if (pausado) {
        iniciarJuego();
        $btnIniciar.hidden = true;
        $btnPausar.hidden = false;
    } else {
        pausar();
        $btnIniciar.hidden = false;
        $btnPausar.hidden = true;
    }
}
document.addEventListener("keydown", (e) => {
    const {code} = e;
    if (!puedeJugar && code !== "KeyP") {
        return;
    }
    switch (code) {
        case "ArrowRight":
            intentarMoverDerecha();
            break;
        case "ArrowLeft":
            intentarMoverIzquierda();
            break;
        case "ArrowDown":
            intentarMoverAbajo();
            break;
        case "Space":
            intentarRotar();
            break;
        case "KeyP":
            pausarOReanudar();
            break;
    }
    sincronizarPiezasConTablero();
});

$btnAbajo.addEventListener("click", () => {
    if (!puedeJugar) return;
    intentarMoverAbajo();
});
$btnDerecha.addEventListener("click", () => {
    if (!puedeJugar) return;
    intentarMoverDerecha();
});
$btnIzquierda.addEventListener("click", () => {
    if (!puedeJugar) return;
    intentarMoverIzquierda();
});
$btnRotar.addEventListener("click", () => {
    if (!puedeJugar) return;
    intentarRotar();
});
[$btnPausar, $btnIniciar].forEach($btn => $btn.addEventListener("click", pausarOReanudar));

requestAnimationFrame(dibujar);
const iniciarJuego = () => {
    sonidoFondo.play();
    refrescarPuntaje();
    pausado = false;
    puedeJugar = true;
    idInterval = setInterval(loop, MILISEGUNDOS_AVANCE_PIEZA);
}

const pausar = () => {
    sonidoFondo.pause();
    pausado = true;
    puedeJugar = false;
    clearInterval(idInterval);
}
const pierde = () => {
    // Verificar si hay algo en la coordenada 1 de Y; algo perezoso pero funciona
    for (const punto of tablero) {
        if (punto.y === 1) return true;
    }
    return false;
};

Swal.fire("Bienvenido", `Port casi perfecto del juego de Tetris en JavaScript.
<br>
<strong>Controles:</strong>
<ul class="list-group">
<li class="list-group-item"> <kbd>P</kbd><br>Pausar o reanudar </li>
<li class="list-group-item"> <kbd>Espacio</kbd><br>Rotar</li>
<li class="list-group-item"> <kbd>Flechas de dirección</kbd><br>Mover figura hacia esa dirección</li>
<li class="list-group-item"><strong>También puedes usar los botones si estás en móvil</strong></li>
</ul>
<strong>Creado por <a href="https://parzibyte.me/blog">Parzibyte</a></strong>
<br>
Gracias a <a target="_blank" href="https://www.youtube.com/channel/UCz6zvgkf6eKpgqlUZQstOtQ">Bulby</a> por la música de fondo
y a <a href="https://freesound.org/people/grunz/sounds/109662/">Freesound.org</a> por el sonido al completar una línea
`);