/*
_______________________________________________________________________
                        Constants and Variables
=======================================================================
Stuff that is easiest when its in a global scope.
_______________________________________________________________________
*/

const TILE_SIZE = 50;
const N_TILES = 40;
const ME = "myplayer";

const DEBUG_ELEMENT = document.querySelector('#debug');
const DISPLAY_ELEMENT = document.querySelector('#Display');
const GRID_ELEMENT = document.querySelector('#DisplayGrid');
const ENTS_ELEMENT = document.querySelector('#DisplayEnts');

var MYPLAYER;
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
        let tile = this.matrix[row][col];
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

    if ((startRow < N_TILES) && (startRow >= 0)) {
        if (startRow < endRow) {
            row++;
        } else if (startRow > endRow) {
            row--;
        }
    }

    if ((col < N_TILES) && (col >= 0)) {
        if (startCol < endCol) {
            col++;
        } else if (startCol > endCol) {
            col--;
        }
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

        this.nextRow = row;
        this.nextCol = col;

        this.targetRow = row;
        this.targetCol = col;

        this.pace = 200;

        this.anim = {
            isRunning: false,
            t0: 0,
            tf: 0,
            x0: 0,
            xf: 0,
            y0: 0,
            yf: 0,
        };
    }

    // TODO:
    // make this "set Target() {}" once you prevent that 'weird stack overflow problem'
    // caused by circular calls to get and set.
    setTarget(row, col) {
        this.targetRow = row;
        this.targetCol = col;
    }

    alignWith(element) {
        if (this.element.style.top !== element.offsetTop) {
            this.element.style.top = `${element.offsetTop}px`;
        }
        if (this.element.style.left !== element.offsetLeft) {
            this.element.style.left = `${element.offsetLeft}px`;    
        }
    }

    alignWithGrid() {
        let tile = this.grid.tile(this.currentRow, this.currentCol);
        this.alignWith(tile);
    }

    alignWithPixel(x, y) {
        this.element.style.top = `${y}px`;
        this.element.style.left = `${x}px`;
    }

    isAtTarget() {
        return ((this.currentRow === this.targetRow) && (this.currentCol === this.targetCol));
    }
    
    doFrame(timestamp) {
        // If the entity is already at it's target, there is no need to move.
        if (this.isAtTarget()) {
            this.alignWithGrid();
            return;
        }

        // The animation is done once it's reached the next tile (or it hasn't started yet.)
        if (this.anim.isRunning !== true) {

            // Restart the start/finish time to ensure the entity. reaches the next tile at the correct time.
            // This maintains a consistent animation regardless of how much time has passed between
            // each animation frame.
            this.anim.t0 = timestamp;
            this.anim.tf = timestamp + this.pace;

            // Calculate the pixel locations of the current tile and the next tile.
            // This provides points of reference for interpolation.
            [this.nextRow, this.nextCol] = getNextLocation(this.currentRow, this.currentCol, this.targetRow, this.targetCol);
            [this.anim.x0, this.anim.y0] = this.grid.locationToXY(this.currentRow, this.currentCol);
            [this.anim.xf, this.anim.yf] = this.grid.locationToXY(this.nextRow, this.nextCol);

            // Running state of the animation.
            this.anim.isRunning = true;
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
            this.anim.isRunning = false;
            return;
        }

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
        this.display = new Display(N_TILES, N_TILES);
        // this.state = new State();
        startGame(this);
    }

    addPlayer(key) {
        let p = new Player(key);
        this.display.add(key, p);
        return p;
    }

    getPlayerElement(key) {
        return this.display.ents.get(key);
    }

    setLocation(key, row, col) {
        if (!this.display.ents.has(key)) {
            console.warn(`setLocation: entity "${key}" was not found.`);
            return;
        }
        let ent = this.display.ents.get(key);
        ent.currentRow = row;
        ent.currentCol = col;
        ent.setTarget(row, col);
    }

    setTarget(key, row, col) {
        this.display.ents.get(key).setTarget(row, col);
    }
};




// NOTE: might have strange support for mozilla.  Doesn't support microsoft. 
const initFullscreenHandlers = ()=> {

    const requestFullscreen = ()=> {
        if (document.body.webkitRequestFullScreen) {
            document.body.webkitRequestFullScreen();
        } else if (document.body.webkitRequestFullScreen) {
            document.body.mozRequestFullScreen();
        }
    }

    const exitFullscreen = ()=> {
        if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
    }

    const isFullScreen = ()=> {
        return document.webkitIsFullScreen;
    }

    const fullscreenEnabled = ()=> {
        if (document.webkitFullscreenEnabled) {
            return document.webkitFullscreenEnabled;
        } else if (document.mozFullScreenEnabled) {
            return document.mozFullScreenEnabled
        } else {
            console.warn("Fullscreen mode cannot be determined.")
            return undefined
        }
    }

    const toggleFullScreen = (event)=> {
        if (isFullScreen() === false) {
            requestFullscreen();
        } else {
            exitFullscreen();
        }
    }

    document.querySelector('#menubar').addEventListener('click', toggleFullScreen)
}


function initEventListeners() {
    initFullscreenHandlers();
}


/*
_______________________________________________________________________
                          The Game Loop
=======================================================================
*/

let lastFrameTimestamp = performance.now()
let fpsCounter = 0;
const countFPS = ()=> {
    fpsCounter++;
    if ((performance.now() - lastFrameTimestamp) >= 1000) {
        lastFrameTimestamp = performance.now()
        DEBUG_ELEMENT.innerText=`Frames per Second: ${fpsCounter}`;
        fpsCounter = 0;
    }
}

const mainloop = (timestamp)=> {
    for (let [key, ent] of GAME.display.ents) {
        ent.doFrame(timestamp);
    }
    if (MYPLAYER) {
        let x = MYPLAYER.element.offsetLeft - DISPLAY_ELEMENT.clientWidth/2;
        let y = MYPLAYER.element.offsetTop - DISPLAY_ELEMENT.clientHeight/2;
        DISPLAY_ELEMENT.scroll(x, y);
    }
    countFPS();
    window.requestAnimationFrame(mainloop);
}




/*
_______________________________________________________________________
                              M A I N 
=======================================================================
*/
function startGame(game) {
    GAME = game;
    test(game);
    initEventListeners();
}




/*
_______________________________________________________________________
                             Testing Area !
=======================================================================
*/
function test(game) {

    // add a player to the game map.
    MYPLAYER = game.addPlayer(ME);
    game.setLocation(ME, 15, 15);
    game.setTarget(ME, 14, 14);
    MYPLAYER.element.classList.add('myplayer');


    // used for random names.
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randString = (n) => {
        let s = "";
        for (let i=0; i<n; i++) {
            s += possible.charAt(Math.floor(Math.random()*possible.length));
        }
        return s;
    }
    const randTile = ()=> Math.floor(Math.random() * N_TILES);
    const randPace = ()=> Math.floor(Math.random() * 400) + 100;

    // Add 10 random players, moving to random locations.
    for (let i=0; i<20; i++) {
        let name = randString(10);
        let startX = randTile();
        let startY = randTile();
        let targetX = randTile();
        let targetY = randTile();
        let p = game.addPlayer(name);
        p.pace = randPace();
        game.setLocation(name, startX, startY);
        game.setTarget(name, targetX, targetY);
    }


    let handleClickEvent = (event) => {
        // console.log("Clicked on:", event.target);
        if (!event.target.classList.contains('tile')) {
            return;
        }
        let [row, col] = game.display.grid.locationOfTile(event.target);
        // console.log('Clicked:', event.target, `location:(${row}, ${col})`, ME);
        // game.setTarget(ME, row, col);
    }

    console.log(game.display.ents);
    game.display.element.addEventListener('mousedown', handleClickEvent);

    lastFrameTimestamp = performance.now()
    window.requestAnimationFrame(mainloop);
}


// const snapEnts = ()=> {
//     for (let [key, ent] of GAME.display.ents) {
//         if (ent.anim.isRunning) {
//             ent.currentRow = ent.nextRow;
//             ent.currentCol = ent.nextCol;
//             ent.anim.isRunning = false;    
//         }
//     }
// }


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
END testing area.
_______________________________________________________________________
*/





document.querySelector('#svg-left-arrow-button').addEventListener('click', (e)=> {
     MYPLAYER.setTarget(MYPLAYER.currentRow - 1, MYPLAYER.currentCol)
});
document.querySelector('#svg-right-arrow-button').addEventListener('click', (e)=> {
     MYPLAYER.setTarget(MYPLAYER.currentRow, MYPLAYER.currentCol + 1)
});
document.querySelector('#svg-down-arrow-button').addEventListener('click', (e)=> {
     MYPLAYER.setTarget(MYPLAYER.currentRow + 1 , MYPLAYER.currentCol)
});
document.querySelector('#svg-up-arrow-button').addEventListener('click', (e)=> {
     MYPLAYER.setTarget(MYPLAYER.currentRow, MYPLAYER.currentCol - 1)
});