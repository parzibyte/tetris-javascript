const LONGITUD_CUADRADO = 30;
const COLUMNAS = 10;
const FILAS = 10;
const ANCHO = LONGITUD_CUADRADO * COLUMNAS;
const ALTO = LONGITUD_CUADRADO * FILAS;
const COLOR_LLENO = d3.color("#000000");
const COLOR_VACIO = d3.color("#eaeaea");
const COLOR_BORDE = d3.color("#ffffff");
class Punto {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.limiteX = COLUMNAS - 1;
        this.limiteY = FILAS - 1;
    }
    bajar() {
        this.y++;
    }
    // Subir no existe o no debería
    derecha() {
        this.x++;
    }
    izquierda() {
        this.x--;
    }
    puedeMoverIzquierda() {
        return this.x > 0;
    }
    puedeMoverDerecha() {
        return this.x < this.limiteX;
    }
    puedeMoverAbajo() {
        return this.y < this.limiteY;
    }
}
class Figura {
    constructor(puntos) {
        this.puntos = puntos;
    }
    getPuntos() {
        return this.puntos;
    }
    bajar() {
        if (!this.puedeMoverAbajo()) return;
        for (const punto of this.puntos) {
            punto.bajar();
        }
    }
    derecha() {
        if (!this.puedeMoverDerecha()) return;
        for (const punto of this.puntos) {
            punto.derecha();
        }
    }
    izquierda() {
        if (!this.puedeMoverIzquierda()) return;
        for (const punto of this.puntos) {
            punto.izquierda();
        }
    }
    puedeMoverDerecha() {
        return this.puedeMoverAbajo() && this.puntos.every((p) => p.puedeMoverDerecha());
    }
    puedeMoverIzquierda() {
        return this.puedeMoverAbajo() && this.puntos.every((p) => p.puedeMoverIzquierda());
    }
    puedeMoverAbajo() {
        return this.puntos.every((p) => p.puedeMoverAbajo());
    }
}
let tablero = [];
let juego = [];
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
        tablero.push(punto);
    }
}
const superponerTablero = () => {
    for (const punto of tablero) {
        juego[punto.y][punto.x] = {
            color: COLOR_LLENO,
            ocupado: true,
        };
    }
};

const colocarFiguraEnArreglo = (figura) => {
    for (const punto of figura.getPuntos()) {
        juego[punto.y][punto.x] = {
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
    // $svg.selectAll("*").remove();
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
// Tomado de: https://www.joe.co.uk/gaming/tetris-block-names-221127
// xd
let SMASHBOY = new Figura([new Punto(1, 1), new Punto(2, 1), new Punto(2, 2), new Punto(1, 2)]); // El cuadrado
let HERO = new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)]); // Línea
let ORANGE_RICKY = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)]); // L
let BLUE_RICKY = new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1),]);// Otra L
let CLEVELAND_Z = new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)]); // Z
let RHODE_ISLAND_Z = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)]); // Z
let TEEWEE = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(1, 0)]); // Z
let figuras = [SMASHBOY, HERO, ORANGE_RICKY, BLUE_RICKY, CLEVELAND_Z, RHODE_ISLAND_Z, TEEWEE];
const obtenerNumeroAleatorioEnRango = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const elegirAleatoria = () => {
    const numero = obtenerNumeroAleatorioEnRango(1, 7);
    switch (obtenerNumeroAleatorioEnRango(1, 7)) {
        case 1:
            return new Figura([new Punto(1, 1), new Punto(2, 1), new Punto(2, 2), new Punto(1, 2)])
            break;
        case 2:
            return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)]);
            break;
        case 3:
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)]);
            break;
        case 4:
            return new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1),]);
            break;
        case 5:
            return new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)]);
            break;
        case 6:
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)]);
            break;
        case 7:
        default:
            return new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(1, 0)]);
            break;
    };
    return new Figura([new Punto(1, 1), new Punto(2, 1), new Punto(2, 2), new Punto(1, 2)]);
    const figuraAleatoria = figuras[Math.floor(Math.random() * figuras.length)];
    return Object.assign(Object.create(Object.getPrototypeOf(figuraAleatoria)), figuraAleatoria);
}

let j = elegirAleatoria();
colocarFiguraEnArreglo(j);
dibujar();
document.addEventListener("keyup", (e) => {
    const { code } = e;
    switch (code) {
        case "ArrowRight":
            j.derecha();
            break;
        case "ArrowLeft":
            j.izquierda();
            break;
        case "ArrowDown":
            j.bajar();
            break;
    }
    if (!j.puedeMoverAbajo()) {
        agregarFiguraATablero(j);
        console.log("Es hora de cambiar la pieza!");
        j = null;
        j = elegirAleatoria();
        console.log({ j });
        return;
    }
    llenar();
    superponerTablero();
    colocarFiguraEnArreglo(j);
    dibujar();
});
const loop = () => {
    if (!j.puedeMoverAbajo()) {
        agregarFiguraATablero(j);
        console.log("Es hora de cambiar la pieza!");
        j = null;
        j = elegirAleatoria();
        console.log({ j });
        return;
    }
    j.bajar();
    llenar();
    superponerTablero();
    colocarFiguraEnArreglo(j);
    dibujar();
};
// setInterval(loop, 200);