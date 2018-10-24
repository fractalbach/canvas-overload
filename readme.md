Canvas OVERLOAD
======================================================================

More experiments with Tiles, Grids, Interactions, and Movement.



Interpolation
------------------------------


Every Entity, whether it's a player or non-player, has a position on
the grid, stored as a (row, column) location.  Moving around on the
map can look too rigid if you move directly from (1,1) to (1,2).

In order to maintain a constant rate of movement in real time,
there's a need to get a bit clever with animation loops.
Niavely calculating `x += 1` each frame loop can result in 
completely different real-time-speeds.

Maintaining a constant real-time-speed is especially important in
networked games, since it is ideal for the game to appear closely
to what is represented on the server.


## Example

In this example, the **pace** of each entity is 300ms.  It takes
about 300ms to move from 1 tile to another.  For all the frames 
that take place in-between, linear interpolation is used to determine
its position.


Here's the code:


~~~javascript
    doFrame(timestamp) {
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
~~~