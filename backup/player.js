

export function makeLayer(name) {
    let ele = document.createElement('div');
    ele.classList.add('layer');
    ele.id = name;
    return ele;
}


export class Grid {
    constructor(nRows=40, nCols=40, width=20, height=20) {
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

    GetTileAt(row, col) {
        return this.matrix[row][col];
    };
    

}


export class Player extends Grid {
    constructor(width=20, height=20) {        
        super(Grid);
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'player';
        this.canvas.width = width;
        this.canvas.height = height;

        console.log(Grid);
    }

}
