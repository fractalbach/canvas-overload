

function makeLayer(name) {
    let ele = document.createElement('div');
    ele.classList.add('layer');
    ele.id = name;
    return ele;
}


function highlightTarget(event) {
    event.target.classList.add('highlighted');
};


class Grid {
    constructor(nRows, nCols, width, height) {
        this.matrix = new Array(nRows);
        this.element = makeLayer('groundLayer');

        for (let row = 0; row < nRows; row++) {
            this.matrix[row] = new Array(nCols);
            let rowElement = document.createElement('div');
            rowElement.classList.add('tileRow');
            this.element.append(rowElement);

            for (let col = 0; col < nCols; col++) {
                let ele = document.createElement('canvas');
                ele.width = width;
                ele.height = height;
                ele.classList.add('tile');
                rowElement.append(ele);
                this.matrix[row][col] = ele;
            }
        }
    };

    tile(row, col) {
        return this.matrix[row][col];
    };
}


export class Player {
    constructor(width=20, height=20) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'player';
        this.canvas.width = width;
        this.canvas.height = height;

        console.log(Grid);
    }

}

// Point is a pixel location literal. 
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    Add(pixelLocation) {
        this.x += pixelLocation.x;
        this.y += pixelLocation.y;
    }
    toString() {
        return `(${this.x}px, ${this.y}px)`
    }
}

// A location is a logical location.
class Location {
    constructor(row=-1, col=-1) {
        this.row = row;
        this.col = col;
    }
}

// An entity is a person or thing that has a location in the world.
class Entity {
    constructor(row=-1, col=-1) {
        this.location = new Location(row, col);
    }
}




class Display {
    constructor(rows, cols) {
        // grid: the area with all of the canvas tiles.
        this.grid = new Grid(rows, cols, 50, 50);

        // playerLayer: the transparent div where player canvases are.
        this.playerLayer = makeLayer('playerLayer');

        // Display.element is the DOM representation of the game. 
        this.element = document.querySelector('#game');
        this.element.appendChild(this.grid.element);
        this.element.addEventListener('mousedown', highlightTarget)
        this.element.addEventListener('click', highlightTarget)
        
    }

    Add(entity) {
        
    }

    Move(entity) {

    }
}


class State {
    constructor() {
        this.players = {};
    }
}


export class Game {
    constructor() {
        this.display = new Display(30, 30);
        this.state = new State();
    }
};