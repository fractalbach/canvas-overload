Lots of Canvas Elements
======================================================================

When the webpage loads, Javascript is used to dynamically generated a
giant grid of canvas elements, which act as ground tiles. CSS is then
used to resize them based on screen dimensions.  1 canvas = 1 tile.

This approach has been both simpler and more efffective than my past
attempts at "tiling" the web browser.


Pros
--------------------------------------------------
* each tile is part of the DOM.
* can add CSS styles to individual tiles.
* easy click events.


Cons
--------------------------------------------------
* each tile is part of the DOM.
* cross-compatibility of certain things become questionable.
* CSS for rows of tiles is fragile.
* as more animations and moving objects are added later on, some
  browsers might explode.


