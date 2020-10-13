const LONGITUD_CUADRADO = 30;
const COLUMNAS = 8;
const FILAS = 12;
const ANCHO = LONGITUD_CUADRADO * COLUMNAS;
const ALTO = LONGITUD_CUADRADO * FILAS;
const COLOR_LLENO = d3.color("#000000");
const COLOR_VACIO = d3.color("#eaeaea");
const COLOR_BORDE = d3.color("#ffffff");
const TIMEOUT_SIGUIENTE_PIEZA_MILISEGUNDOS = 100; // Cuántos milisegundos tiene el jugador para mover la pieza una vez que choca hacia abajo
const PUNTAJE_POR_CUADRO = 1;
let banderaTimeout = false;
let tablero = [];
const juego = [];
const milisegundosBloqueo = 1000;
let movimientoBloqueado = false;
let puedeAgregarOtraFigura = true;
let puedeJugar = true;
const $canvas = document.querySelector("#canvas");
$canvas.setAttribute("width", ANCHO + "px");
$canvas.setAttribute("height", ALTO + "px");
const contexto = $canvas.getContext("2d");

let miX, miY;
let puntaje = 0;
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

const verificar = () => {
    const puntos = obtenerPuntosQueSeEliminan();
    puntaje += PUNTAJE_POR_CUADRO * COLUMNAS * puntos.length;
    // TODO: acá hacer animación supongo. Tal vez cambiar opacidad, bueno, ir bajando opacidad
    for (const y of puntos) {
        juego[y].forEach(p => {
            p.color = "#ffff00";
        });
    }
    //TODO: cambiar por un await, y bloquear al jugador
    setTimeout(() => {
        quitarFilasDeTablero(puntos);
        refrescarAggg();
        const puntosInvertidos = Array.from(puntos);
        puntosInvertidos.reverse();
        for (const y of puntosInvertidos) {
            tablero.sort((a, b) => {
                return b.y - a.y;
            })
            tablero = tablero.map(punto => {
                console.log({punto, y})
                if (punto.y < y) {
                    let contador = 0;
                    while (puntoDesocupadoEnJuego(punto.x, punto.y + 1) && !puntoAbsolutoFueraDeLimites(punto.x, punto.y + 1) && contador < puntos.length) {
                        punto.y++;
                        contador++;
                        refrescarAggg();
                    }
                }
                return punto;
            });

        }
        refrescarAggg();
    }, 500);
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

class Punto {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.limiteX = COLUMNAS - 1;
        this.limiteY = FILAS - 1;
    }

    puedeMoverAbajo(posicionY) {
        return this.y + posicionY < this.limiteY;
    }

    colapsaConOtroPuntoAbajo(posicionY, posicionX) {
        let siguienteY = this.y + 1;
        if (juego[siguienteY + posicionY][this.x + posicionX].ocupado) {
            return {
                x: this.x,
                y: siguienteY,
            }
        } else {
            return false;
        }
    }
}

class Figura {
    constructor(rotaciones) {
        this.rotaciones = rotaciones;
        this.indiceRotacion = 0;
        this.puntos = this.rotaciones[this.indiceRotacion];
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

    desocupado(x, y) {
        if (!juego[y]) return true;
        if (!juego[y][x]) return true;
        return !juego[y][x].ocupado;
    }

    fueraDeLimites(punto) {
        const xRelativo = punto.x + miX;
        const yRelativo = punto.y + miY;
        return xRelativo < 0 || xRelativo > punto.limiteX || yRelativo < 0 || yRelativo > punto.limiteY;
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
        //todo: debería revisarse el bloqueo, y no si se está abajo pues de eso se encarga "puedeRotar"
        // if (!this.puedeMoverAbajo(posicionY, posicionX)) {
        //     console.log("No puede mover hacia abajo. No se rota")
        //     return;
        // }
        if (!this.puedeRotar(posicionY, posicionX)) {
            console.log("No puede rotar porque estaría fuera de los límites. No se rota");
            return;
        }
        this.puntos = this.obtenerSiguienteRotacion();
        this.aumentarIndiceDeRotacion();
    }

    puntoPerteneceAEstaFigura(x, y) {
        for (const punto of this.puntos) {
            if (punto.x === x && punto.y === y) {
                return true;
            }
        }
        return false;
    }

    colapsaConSuelo(posicionY) {
        return !this.puntos.every((p) => p.puedeMoverAbajo(posicionY));
    }
}


const llenarPrimeraVez = () => {
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
llenarPrimeraVez();
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
            color: COLOR_LLENO,
            ocupado: true,
        };
    }
};


const colocarFiguraEnArreglo2 = (figura) => {
    for (const punto of figura.getPuntos()) {
        juego[punto.y + miY][punto.x + miX] = {
            color: COLOR_LLENO,
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
            contexto.strokeStyle = "white";
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
    switch (obtenerNumeroAleatorioEnRango(2, 2)) {
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
const refrescarAggg = () => {
    llenar();
    superponerTablero();
    colocarFiguraEnArreglo2(j);
    // verificar();
    // dibujar();
};
let siguienteDireccion;
let idInterval;
let j = elegirAleatoria();
const loop = () => {
    refrescarAggg();
    if (j.puedeMoverAbajo(miY, miX)) {
        miY++;
    } else {
        agregarFiguraATablero(j);
        j = elegirAleatoria();
        console.log("Nueva figura ._.");
    }
    // Esta línea hace que todas las cosas se mantengan sincronizadas y ya no haya errores aleatorios ._. xD
    refrescarAggg();
};
document.addEventListener("keyup", (e) => {
    if (!puedeJugar) {
        refrescarAggg();
        return;
    }
    const {code} = e;
    let algunCambio = false;
    switch (code) {
        case "ArrowRight":
            if (j.puedeMoverDerecha(miX, miY)) {
                algunCambio = true;
                miX++;
            }
            break;
        case "ArrowLeft":
            if (j.puedeMoverIzquierda(miX, miY)) {
                algunCambio = true;
                miX--;
            }
            break;
        case "ArrowDown":
            algunCambio = true;
            if (j.puedeMoverAbajo(miY, miX)) {
                miY++;
            } else {
                // TODO: mover esto al loop
                if (banderaTimeout) return;
                banderaTimeout = true;
                setTimeout(() => {
                    banderaTimeout = false;
                    if (j.puedeMoverAbajo(miY, miX)) {
                        return;
                    }
                    agregarFiguraATablero(j);
                    verificar();
                    j = elegirAleatoria();
                }, TIMEOUT_SIGUIENTE_PIEZA_MILISEGUNDOS);
            }
            break;
        case "Space":
            j.rotar(miY, miX);
            algunCambio = true;
            break;
    }
    if (algunCambio) {
        refrescarAggg();
    }
});
requestAnimationFrame(dibujar);
// idInterval = setInterval(loop, 600);