const TILE_SIZE = 50;

/* 
_______________________________________________________________________
                             Helper Functions
=======================================================================
Various functions that aren't methods but are useful for various
purpoes.  Refactor these as static methods of a "toolkit" class 
later on if needed.
_______________________________________________________________________
*/

// kudos to https://eloquentjavascript.net/ for this helper function.
function makeElement(name, attrs) {
    let ele = document.createElement(name);
    if (attrs == undefined) {
        return ele;
    }
    for (let attr of Object.keys(attrs)) {
        ele.setAttribute(attr, attrs[attr]);
    }
    return ele;
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


let uid = 123;
function nextUid() {
    uid++;
    return uid;
}

/* 
_______________________________________________________________________
                             Display
=======================================================================
Display handles:
    - graphics
    - interactions
    - document objects
_______________________________________________________________________

*/


class Display 
{
    constructor(rows, cols) {
        // grid: the area with all of the canvas tiles.
        this.grid = new Grid(rows, cols, TILE_SIZE, TILE_SIZE);

        // playerLayer: the transparent div where player canvases are.
        this.playerLayer = makeLayer('playerLayer');

        // Display.element is the DOM representation of the game. 
        this.element = document.querySelector('#game');

        // A collection of general-purpose canvas elements.
        this.entities = new Map();

        // Call init procedure.
        this.init();
    }

    init() {
        // Add the grid to the game area. 

        this.element.appendChild(this.grid.element);
        this.element.appendChild(this.playerLayer);


        // Add global event listeners
        this.element.addEventListener('mousedown', highlightTarget);
        this.element.addEventListener('click', highlightTarget);

        // Add the display element to the game.
        // document.body.appendChild(this.element);
    }

    add(key, element) {
        this.entities.set(key, element);
    }

    getEle(key) {
        return this.entities.get(key);
    }

    addPlayer(key) {
        let attrs = {
            id: `player${nextUid()}`,
            class: 'player',
            width: TILE_SIZE,
            height: TILE_SIZE,
        };
        let e = makeElement('canvas', attrs);
        this.add(key, e);
        this.playerLayer.appendChild(e);
    }

    setLocation(key, location) {
        if (!this.entities.has(key)) {
            console.warn(`Display.setLocation: The key '${key.toString()}' hasn't been registered.`);
            return;
        }
        let e = this.entities.get(key);
        let pixel = this.LocToPixel(location);
        e.style.left = pixel.px;
        e.style.top = pixel.py;
        console.log(`location of ${key.toString()} set to: (left, top) = `, pixel)
    }

    LocToPixel(location) {
        let tile = this.grid.tileAt(location);
        return new PixelPoint(tile.offsetLeft, tile.offsetTop)
    }
}

class Grid 
{
    constructor(nRows, nCols, width, height) 
    {
        this.matrix = new Array(nRows);
        this.element = makeLayer('groundLayer');

        for (let row = 0; row < nRows; row++) 
        {
            this.matrix[row] = new Array(nCols);
            let rowElement = document.createElement('div');
            rowElement.classList.add('tileRow');
            this.element.append(rowElement);

            for (let col = 0; col < nCols; col++) 
            {
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

    tileAt(location) {
        return this.matrix[location.row][location.col];
    }
}



// PixelPoint represents an (x,y) pixel offset from the top-left of screen.
class PixelPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    AdjustBy(pixelPoint) {
        this.x += pixelLocation.x;
        this.y += pixelLocation.y;
    }
    toString() {
        return `[${this.x}px, ${this.y}px]`
    }
    get px() {
        return `${this.x}px`
    }
    get py() {
        return `${this.y}px`
    }
    static Add(pixelPoint1, pixelPoint2) {
        let x = pixelPoint1.x + pixelPoint2.x;
        let y =  pixelPoint1.y + pixelPoint2.y;
        return new PixelPoint(x,y);
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
APIS:
    - todo
    -
_______________________________________________________________________
*/

class State {
    constructor() {
        this.data = {};
        this.serverData = {};
        this.players = new Map();
        this.projectiles = [];
    }
    merge(newData) {
		Object.assign(this.data, newData);
    }
    mergeWithServerData() {
        Object.assign(this.data, this.serverData);
    }
    addPlayer(username) {
        this.players.set(username, new Player())
    }
}






/* 
_______________________________________________________________________
                Nouns:    People, Places, and Things
=======================================================================
*/ 

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
Main purposes of the Game class:
    1. unify game state & user interface.
    2. provide sensible APIs for human consumption.


APIs 
------------------------------------------------
Done:
    - addPlayer
    - movePlayer

TODO: 
    - removePlayer
    -   


Information Travel:
------------------------------------------------

     [Display]  <---[User Interactions]
         |
      [Game]          
        |
     [State]  <---[Timers or Network Data ]

    class PlayerCanvas {
    constructor(width=20, height=20) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'player';
        this.canvas.width = width;
        this.canvas.height = height;
    }
}
_______________________________________________________________________
*/ 

export class Game {
    constructor() {
        this.display = new Display(30, 30);
        this.state = new State();
        startGame(this);
    }

    addPlayer(key) {
        this.state.addPlayer(key);
        this.display.addPlayer(key);
    }

    getPlayerElement(key) {
        return this.display.getEle(key);
    }

    movePlayer(key, row, col) {
        let loc = new Location(row, col);
        let p = this.state.players.get(key);
        p.targetLocation = loc;
        this.display.setLocation(key, loc);
    }

};

// startGame is a private function that launches the game for the first time.
// it happens automatically after the Game object is created.
let hasStarted = false;
function startGame(game) {

    // makes sure that this function doesn't run twice.
    if (hasStarted) {
        return;
    }

    test(game);
    
    // declare that the game has started.
    hasStarted = true;
}


// -------------------------------------------------
// BEGIN testing area.
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function test(game) {

    // add a player to the game map.
    let me = Symbol('me');
    game.addPlayer(me);
    game.movePlayer(me, 1, 2);

    console.log(game.display.entities)

}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// END testing area.
// -------------------------------------------------
