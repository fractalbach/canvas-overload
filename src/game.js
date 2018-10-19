/* 
_______________________________________________________________________
                             Display
=======================================================================
Display handles:
    - graphics
    - interactions
    - document objects
*/
class Display {
    constructor(rows, cols) {
        // grid: the area with all of the canvas tiles.
        this.grid = new Grid(rows, cols, 50, 50);

        // playerLayer: the transparent div where player canvases are.
        this.playerLayer = makeLayer('playerLayer');

        // Display.element is the DOM representation of the game. 
        this.element = document.querySelector('#game');
        this.element.appendChild(this.grid.element);
        this.element.addEventListener('mousedown', highlightTarget);
        this.element.addEventListener('click', highlightTarget);   
    }
    Add(entity, name) {}

    Move(entity) {
        entity.target
    }
}


function makeLayer(name) {
    let ele = document.createElement('div');
    ele.classList.add('layer');
    ele.id = name;
    return ele;
}

function highlightTarget(event) {
    event.target.classList.add('highlighted');
}


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
    }
    tile(row, col) {
        return this.matrix[row][col];
    }
}

class PlayerCanvas {
    constructor(width=20, height=20) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'player';
        this.canvas.width = width;
        this.canvas.height = height;
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





/* 
_______________________________________________________________________
                             State
=======================================================================
State handles:
    - game logic
    - timers
    - keeps track of actual player positions.
*/
class State {
    constructor() {
        this.players = new Map();
    }
}


// A location is a logical location.
class Location {
    constructor(row=-1, col=-1, z=-1) {
        this.row = row;
        this.col = col;
    }
}

// An entity is a person or thing that has a location in the world.
class Entity {
    constructor(row=-1, col=-1) {
        this.location = new Location(row, col);
        this.targetLocation = new Location(-1, -1);
    }
}
class Player extends Entity {
    constructor(username) {
        super(Entity);
        this.username = username;
    }
}







 

/* 
_______________________________________________________________________
                             Class Game
=======================================================================
Class Game unifies the Display and the State by bridiging 
the logic  with the visuals.



Information Travel:
------------------------------------------------

     [Display]  <---[User Interactions]
         |
      [Game]          
        |
     [State]  <---[Timers or Network Data ]

    

*/ 
export class Game {
    constructor() {
        this.display = new Display(30, 30);
        this.state = new State();
    }
};