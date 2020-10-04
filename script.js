const LONGITUD_CUADRADO = 30;
const COLUMNAS = 10;
const FILAS = 30;
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
        return this.puntos.every((p) => p.puedeMoverDerecha());
    }
    puedeMoverIzquierda() {
        return this.puntos.every((p) => p.puedeMoverIzquierda());
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
const SMASHBOY = new Figura([new Punto(1, 1), new Punto(2, 1), new Punto(2, 2), new Punto(1, 2)]); // El cuadrado
const HERO = new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(0, 2), new Punto(0, 3)]); // Línea
const ORANGE_RICKY = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(2, 0)]); // L
const BLUE_RICKY = new Figura([new Punto(0, 0), new Punto(0, 1), new Punto(1, 1), new Punto(2, 1),]);// Otra L
const CLEVELAND_Z = new Figura([new Punto(0, 0), new Punto(1, 0), new Punto(1, 1), new Punto(2, 1)]); // Z
const RHODE_ISLAND_Z = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(1, 0), new Punto(2, 0)]); // Z
const TEEWEE = new Figura([new Punto(0, 1), new Punto(1, 1), new Punto(2, 1), new Punto(1, 0)]); // Z

let j = TEEWEE;
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
    llenar();
    colocarFiguraEnArreglo(j);
    dibujar();
});