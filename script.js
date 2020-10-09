const LONGITUD_CUADRADO = 30;
const COLUMNAS = 10;
const FILAS = 10;
const ANCHO = LONGITUD_CUADRADO * COLUMNAS;
const ALTO = LONGITUD_CUADRADO * FILAS;
const COLOR_LLENO = d3.color("#000000");
const COLOR_VACIO = d3.color("#eaeaea");
const COLOR_BORDE = d3.color("#ffffff");
let tablero = [];
let juego = [];
const milisegundosBloqueo = 1000;
let movimientoBloqueado = false;
let puedeAgregarOtraFigura = true;

class Punto {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.limiteX = COLUMNAS - 1;
        this.limiteY = FILAS - 1;
    }

    puedeMoverIzquierda(posicionX) {
        return this.x + posicionX > 0;
    }

    puedeMoverDerecha(posicionX) {
        return this.x + posicionX < this.limiteX;
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

    puedeRotar(tamanioFigura, posicionX, posicionY) {
        const nuevasCoordenadas = this.obtenerNuevasCoordenadasDespuesDeRotar(tamanioFigura);
        const xRelativa = nuevasCoordenadas.x + posicionX;
        const yRelativa = nuevasCoordenadas.y + posicionY;
        return xRelativa <= this.limiteX && yRelativa <= this.limiteY && xRelativa >= 0 && yRelativa >= 0;
    }

    rotar(tamanioFigura) {
        const nuevasCoordenadas = this.obtenerNuevasCoordenadasDespuesDeRotar(tamanioFigura);
        this.x = nuevasCoordenadas.x;
        this.y = nuevasCoordenadas.y;

    }

    obtenerNuevasCoordenadasDespuesDeRotar(tamanioFigura) {
        let x = this.x, y = this.y;
        const nuevoX = 1 - (y - (tamanioFigura - 2));
        return {
            x: nuevoX,
            y: x,
        }
    }
}

class Figura {
    constructor(puntos, tamanio, cantidadRotaciones) {
        this.puntos = puntos;
        this.tamanio = tamanio;
        this.cantidadRotaciones = cantidadRotaciones;
    }

    getPuntos() {
        return this.puntos;
    }

    puedeMoverDerecha(posicionX, posicionY) {
        if (!this.puntos.every((p) => p.puedeMoverDerecha(posicionX, posicionY))) {
            return false;
        }
        return this.puedeMoverAbajo(posicionY, posicionX) || !movimientoBloqueado;
    }

    puedeMoverIzquierda(posicionX, posicionY) {
        if (!this.puntos.every((p) => p.puedeMoverIzquierda(posicionX, posicionY))) {
            return false;
        }
        const puedeAbajo = this.puedeMoverAbajo(posicionY, posicionX);
        return puedeAbajo || !movimientoBloqueado;
    }

    puedeRotar(posicionY, posicionX) {
        for (const punto of this.puntos) {
            if (!punto.puedeRotar(this.tamanio, posicionX, posicionY)) return false;
        }
        return true;
    }

    rotar(posicionY, posicionX) {
        if (!this.puedeMoverAbajo(posicionY, posicionX)) {
            console.log("No puede mover hacia abajo. No se rota")
            return;
        }
        if (!this.puedeRotar(posicionY, posicionX)) {
            console.log("No puede rotar porque estaría fuera de los límites. No se rota");
            return;
        }
        for (const punto of this.puntos) {
            punto.rotar(this.tamanio);
        }
    }

    puedeMoverAbajo(posicionY, posicionX) {
        if (this.colapsaConSuelo(posicionY)) {
            return false;
        }
        return !this.puntos.some(punto => {
            const coordenadas = punto.colapsaConOtroPuntoAbajo(posicionY, posicionX);
            if (coordenadas) {
                if (!this.puntoPerteneceAEstaFigura(coordenadas.x, coordenadas.y)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
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

const llenar = () => {
    juego = [];
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
const agregarFiguraATablero = (figura) => {
    for (const punto of figura.getPuntos()) {
        punto.x += miX;
        punto.y += miY;
        tablero.push(punto);
    }
    miX = 0;
    miY = 0;
}
const superponerTablero = () => {
    for (const punto of tablero) {
        juego[punto.y][punto.x] = {
            color: COLOR_LLENO,
            ocupado: true,
        };
    }
};

//TODO: inicializar en el centro y reiniciar cada que se copia la figura
let miX = 0, miY = 0;
const colocarFiguraEnArreglo2 = (figura) => {
    for (const punto of figura.getPuntos()) {
        juego[punto.y + miY][punto.x + miX] = {
            color: COLOR_LLENO,
            ocupado: true,
        }
    }
}

const $svg = d3.select("#contenedor")
    .append("svg")
    .attr('width', ANCHO)
    .attr('height', ALTO);

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
            $svg.append("rect")
                .attr("x", x)
                .attr("y", y)
                .attr("width", LONGITUD_CUADRADO)
                .attr("height", LONGITUD_CUADRADO)
                .attr("stroke", COLOR_BORDE)
                .attr("fill", colorRelleno);
            x += LONGITUD_CUADRADO;
        }
        y += LONGITUD_CUADRADO;
    }
}
dibujar();
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
            return new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(0, 1), new Punto(1, 1)], 2, 4);
        case 2:

            /*
            La línea (hero)

            ****
            */
            return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)], 4, 2);
        case 3:

            /*
            La L (orange ricky)
            *
            ***

            */
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)], 3, 4);
        case 4:

            /*
            La J (blue ricky)
              *
            ***

            */
            return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1),], 3, 4);
        case 5:
            /*
           La Z (Cleveland Z)
           **
            **
           */
            return new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)], 3, 2);
        case 6:

            /*
           La otra Z (Rhode island Z)
            **
           **
           */
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)], 3, 2);
        case 7:
        default:

            /*
           La T (Teewee)

            *
           ***
           */
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(1, 0)], 3, 4);
    }
}

let j = elegirAleatoria();
colocarFiguraEnArreglo2(j);
dibujar();
document.addEventListener("keyup", (e) => {

    const {code} = e;
    switch (code) {
        case "ArrowRight":
            if (j.puedeMoverDerecha(miX, miY)) {
                miX++;
            }
            break;
        case "ArrowLeft":
            if (j.puedeMoverIzquierda(miX, miY)) {
                miX--
            }
            break;
        case "ArrowDown":
            if (j.puedeMoverAbajo(miY, miX)) {
                miY++;
            } else {
                if (true) {
                    console.log("Llegaste al suelo. Tienes poco tiempo para mover")
                    setTimeout(() => {
                        console.log("Ok, siguiente figura!")
                        agregarFiguraATablero(j);
                        console.log("Es hora de cambiar la pieza!");
                        j = elegirAleatoria();
                        llenar();
                        superponerTablero();
                        colocarFiguraEnArreglo2(j);
                        dibujar();
                        movimientoBloqueado = true;
                    }, milisegundosBloqueo);
                }
            }
            break;
        case "Space":
            j.rotar(miY, miX);
            break;
    }
    llenar();
    superponerTablero();
    colocarFiguraEnArreglo2(j);
    dibujar();
    if (!j.puedeMoverAbajo() && false) {
        agregarFiguraATablero(j);
        console.log("Es hora de cambiar la pieza!");
        j = elegirAleatoria();
        llenar();
        superponerTablero();
        colocarFiguraEnArreglo2(j);

        dibujar();

        return;
    }
});