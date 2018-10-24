/* 
_______________________________________________________________________
                        Constants and Variables
=======================================================================
Stuff that is easiest when its in a global scope.
_______________________________________________________________________
*/

const TILE_SIZE = 50;
const N_TILES = 30;
const ME = "myplayer";
var GAME;

/* 
_______________________________________________________________________
                             Utility Functions
=======================================================================
Extra functions that are useful for a variety of cases.
_______________________________________________________________________
*/

class util {
    static makeElement(name, attrs) {
        let ele = document.createElement(name);
        if (attrs == undefined) {
            return ele;
        }
        for (let attr of Object.keys(attrs)) {
            ele.setAttribute(attr, attrs[attr]);
        }
        return ele;
    }
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

class Display {
    constructor(rows, cols) {

        // grid: the area with all of the canvas tiles.
        this.grid = new Grid(rows, cols, TILE_SIZE, TILE_SIZE);

        // Display.element is the DOM representation of the game. 
        this.element = document.querySelector('#Display');

        // entLayer: the transparent div where entity canvases are.
        this.entLayer = document.querySelector('#DisplayEnts')

        // A collection of entities (aka ents).
        this.ents = new Map();


        // Auto-adjust object positions whenever screen is resized.
        // window.addEventListener('resize', ()=> this.refreshPositions());
    }

    add(key, entity) {
        this.ents.set(key, entity);
        this.entLayer.appendChild(entity.element);
        entity.grid = this.grid;
        entity.alignWithGrid();
    }

    highlightTarget(event) {
        event.target.classList.add('highlighted');
        let [row, col] = this.grid.locationOfTile(event.target);
        console.log('Clicked:', event.target, `  Location:(${row}, ${col}))`);
    }
}



class Grid {
    constructor(nRows, nCols, width, height) {

        // matrix is an array of rows, where each element is an element.
        this.matrix = new Array(nRows);

        // reverseTileMap (Element --> Location).  Maps tile elements to their logical locations.
        this.reverseTileMap = new Map();

        // Grid layer
        this.element = document.querySelector('#DisplayGrid');


        // Initialize the matrix and create each of the tiles.
        for (let row = 0; row < nRows; row++) 
        {
            this.matrix[row] = new Array(nCols);
            let rowElement = util.makeElement('div', {class: 'tileRow'});
            this.element.append(rowElement);

            for (let col = 0; col < nCols; col++) 
            {
                let tile = util.makeElement('canvas', {
                    width: width,
                    height: height,
                    class: 'tile'
                });
                rowElement.append(tile);
                this.matrix[row][col] = tile;
                this.reverseTileMap.set(tile, [row, col]);
            }
        }
    }

    tile(row, col) {
        return this.matrix[row][col];
    }

    locationOfTile(element) {
        return this.reverseTileMap.get(element);
    }

    locationToXY(row, col) {
        let tile = this.tile(row, col);
        return [tile.offsetLeft, tile.offsetTop];
    }
}

/* 
_______________________________________________________________________
                Nouns:    People, Places, and Things
=======================================================================
*/ 

const areArrsEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i=0; i<arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

const getNextLocation = (startRow, startCol, endRow, endCol) => {
        let row = startRow;
        let col = startCol;

        if (startRow < endRow) {
            row++;
        } else if (startRow > endRow) {
            row--;
        }
        
        if (startCol < endCol) {
            col++;
        } else if (startCol > endCol) {
            col--;
        }
        return [row, col];
    }



// An entity is a person or thing that has a location in the world.
class Entity {
    constructor(element, row=0, col=0) {
        this.element = element;
        this.grid = undefined;

        this.currentRow = row;
        this.currentCol = col;
        
        this.targetRow = row;
        this.targetCol = col;

        this.nextRow = row;
        this.nextCol = col;

        this.pace = 300;
        this.lock = false;

        this.anim = {
            isDone: true,
            x0: 0,
            y0: 0,
            xf: 0,
            yf: 0,
            t0: 0,
            tf: 0
        };

    }

    alignWith(element) {
        this.element.style.top = `${element.offsetTop}px`;
        this.element.style.left = `${element.offsetLeft}px`;
    }

    alignWithGrid() {
        if (this.grid == undefined) {
            console.warn(this, "alignWithGrid: entity doesn't have a reference to grid.");
            return;
        }
        let tile = this.grid.tile(this.currentRow, this.currentCol);
        this.alignWith(tile);
    }

    alignWithPixel(x, y) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    isAtTarget() {
        return ((this.currentRow === this.targetRow) && (this.currentCol === this.targetCol));
    }

    isAtNext() {
        return ((this.currentRow === this.nextRow) && (this.currentCol === this.nextCol));
    }
    
//     updateFrame() {
//         if (this.lock) {
//             // console.warn('locked.', this);
//             return;
//         }
//         if (this.isAtTarget()) {
//             return;
//         }
//         [this.nextRow, this.nextCol] = getNextLocation(this.currentRow, this.currentCol, this.targetRow, this.targetCol);
//         // console.warn(`Next Location = (${this.nextRow}, ${this.nextCol})`)
        
//         let [x0, y0] = this.grid.locationToXY(this.currentRow, this.currentCol);
//         let [xf, yf] = this.grid.locationToXY(this.nextRow, this.nextCol);
//         let pace = this.pace;
//         let ent = this;
//         startFrameLoop(x0, y0, xf, yf, ent);
//     }

    doFrame(timestamp) 
    {
        // If the entity is already at it's target, there is no need to move.
        if (this.isAtTarget()) {
            return;
        }

        // The animation is done once it's reached the next tile (or it hasn't started yet.)
        if (this.anim.isDone) {

            // Restart the start/finish time to ensure the entity. reaches the next tile at the correct time.
            // This maintains a consistent animation regardless of how much time has passed between
            // each animation frame.
            this.anim.t0 = performance.now();
            this.anim.tf = this.anim.t0 + this.pace;

            // Calculate the pixel locations of the current tile and the next tile.
            // This provides points of reference for interpolation.
            [this.nextRow, this.nextCol] = getNextLocation(this.currentRow, this.currentCol, this.targetRow, this.targetCol);
            [this.anim.x0, this.anim.y0] = this.grid.locationToXY(this.currentRow, this.currentCol);
            [this.anim.xf, this.anim.yf] = this.grid.locationToXY(this.nextRow, this.nextCol);
            
            // Save the animation state.
            this.anim.isDone = false;
        }

        // At this point, the animation is running.

        // Determine the amount that has passed since we left the tile.
        let t = timestamp - this.anim.t0;

        // Check to see if we have reached the next tile yet.
        // If we have, we are finished with the animation.
        if (this.anim.tf < timestamp) {
            this.currentRow = this.nextRow;
            this.currentCol = this.nextCol;
            this.alignWithGrid();
            this.anim.isDone = true;
            return;
        }

        // At this point, we are within the animation itself.

        // Calculate the new (x,y) through linear interpolation.
        let x = ((this.anim.xf - this.anim.x0) / (this.anim.tf - this.anim.t0))*t + this.anim.x0;
        let y = ((this.anim.yf - this.anim.y0) / (this.anim.tf - this.anim.t0))*t + this.anim.y0;
        this.alignWithPixel(x, y);
        return;
    }

}

class Player extends Entity {
    constructor(key) {
        super(Entity);
        this.element = util.makeElement('canvas', {
            id: `player${key}`,
            class: 'player',
            width: TILE_SIZE,
            height: TILE_SIZE,
        });
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
}



 

/* 
_______________________________________________________________________
                             Class Game
=======================================================================
Main purposes of the Game class:
    1. unify game state & user interface.
    2. provide sensible APIs for human consumption.

------------------------------------------------
Information Travel
------------------------------------------------

     [Display]  <---[User Interactions]
         |
      [Game]          
        |
     [State]  <---[Timers or Network Data ]

_______________________________________________________________________
*/ 

export class Game {
    constructor() {
        this.display = new Display(30, 30);
        this.state = new State();
        startGame(this);
    }

    addPlayer(key) {
        let p = new Player(key);
        this.state.players.set(key, p);
        this.display.add(key, p);
    }

    getPlayerElement(key) {
        return this.display.getEle(key);
    }

    setLocation(key, row, col) {
        if (!this.state.players.has(key)) {
            console.warn(`setLocation: entity "${key}" was not found.`);
            return;
        }
        let ent = this.state.players.get(key);
        ent.currentRow = ent.targetRow = ent.nextRow = row;
        ent.currentCol = ent.targetCol = ent.nextCol = col;
        ent.alignWithGrid();
    }

    setTarget(key, row, col) {
        let ent = this.state.players.get(key);
        ent.targetRow = row;
        ent.targetCol = col;
        // ent.updateFrame();
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





/* 
_______________________________________________________________________
                             Testing Area ! 
=======================================================================
*/ 
function test(game) {
    GAME = game;

    // add a player to the game map.
    game.addPlayer(ME);
    game.setLocation(ME, 1, 2);
    game.setTarget(ME, 1, 3);

    // used for random names.
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randString = (n) => {
        let s = "";
        for (let i=0; i<n; i++) {
            s += possible.charAt(Math.floor(Math.random()*possible.length));
        }        
        return s;
    }
    let randTile = () => Math.floor(Math.random() * N_TILES);
    

    // Add 10 random players, moving to random locations.
    for (let i=0; i<10; i++) {
        let name = randString(10);
        let startX = randTile();
        let startY = randTile();
        let targetX = randTile();
        let targetY = randTile();
        game.addPlayer(name);
        game.setLocation(name, startX, startY);
        game.setTarget(name, targetX, targetY);
    }
    
    
    let me = game.players

    let doHighlight = function(event) {
        if (!event.target.classList.contains('tile')) {
            return;
        }
        let [row, col] = game.display.grid.locationOfTile(event.target);
        console.log('Clicked:', event.target, `location:(${row}, ${col})`, ME);
        game.setTarget(ME, row, col);
    }
    
    console.log(game.display.ents);
    game.display.element.addEventListener('mousedown', doHighlight);

    window.requestAnimationFrame(mainloop);
}
/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
END testing area.
_______________________________________________________________________
*/




// const startFrameLoop = (x0, y0, xf, yf, ent) => {
//     let t0 = performance.now();
//     let tf = t0 + ent.pace;
//     let counter = 0;
//     ent.lock = true;

//     function frameStep(timestamp) {
//         counter++;
//         let t = timestamp - t0;
//         if (tf < timestamp) {
//             // console.warn(`Frame Loop Complete! Number of Steps: ${counter}`, ent);
//             ent.currentRow = ent.nextRow;
//             ent.currentCol = ent.nextCol;
//             ent.alignWithGrid();
//             ent.lock = false;
//             ent.updateFrame();
//             return;
//         }
//         let x = ((xf - x0) / (tf - t0))*t + x0;
//         let y = ((yf - y0) / (tf - t0))*t + y0;
//         ent.alignWithPixel(x, y);
//         window.requestAnimationFrame(frameStep);
//     }

//     window.requestAnimationFrame(frameStep);
// }


const mainloop = (timestamp) => {
    for (let [key, ent] of GAME.display.ents) {
        ent.doFrame(timestamp);
    }
    window.requestAnimationFrame(mainloop);
}

