/* =============================================================
                            Main.js
============================================================= */
import {Player} from './player.js';

function max(a, b) {
    return (a < b) ? b : a;
}

function makeLayer(name) {
    let ele = document.createElement('div');
    ele.className = 'layer';
    ele.id = name;
    return ele;
}
function highlightTarget(event) {
        console.log(event)
        event.target.style.background = 'cyan';
    };

class GameGrid {
    constructor(nRows=40, nCols=40, width=20, height=20) {
        this.matrix = new Array(nRows);
        this.grid = makeLayer('groundLayer');

        for (let row = 0; row < nRows; row++) {
            this.matrix[row] = new Array(nCols);
            let rowElement = document.createElement('div');
            rowElement.className = 'tileRow';
            this.grid.append(rowElement);

            for (let col = 0; col < nCols; col++) {
                let ele = document.createElement('canvas');
                ele.width = width;
                ele.height = height;
                ele.className = 'tile';
                rowElement.append(ele);
                this.matrix[row][col] = ele;
            }
        }
    }

    
}



/*                            Main
============================================================= */
(function() {
    let w = 50;
    let h = 50;
    let game = document.querySelector('#game');
    let gamegrid = new GameGrid(30,30,w,h);
    let playerLayer = makeLayer('playerLayer');
   

    game.appendChild(gamegrid.grid);
    game.appendChild(playerLayer);
   
        game.addEventListener('mousedown', highlightTarget);
        game.addEventListener('click', highlightTarget);
    
    
    let p = new Player(w,h);
    document.querySelector('#playerLayer').appendChild(p.canvas);
}());
