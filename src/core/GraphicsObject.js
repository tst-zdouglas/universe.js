/*jslint browser: true, sloppy: true */
/*global UNIVERSE */

/** 
    A graphics object to be drawn in the Universe
    @constructor
    @param {string} id - Identifier for the object to be referenced later
    @param {function} updateFunction - A function(elapsedTime) that gets called each time the Universe time changes
    @param {function} drawFunction - A function that should call Universe.draw with the object's model
    @param {string} modelName - A name for the object if different than id.  Set to the id if not defined
    @param {Object} currentLocation
 */

UNIVERSE.GraphicsObject = function (id, modelName, currentLocation, updateFunction, drawFunction) {
    this.id = id;
    this.modelName = modelName || id;
    this.currentLocation = currentLocation;
    this.update = updateFunction;
    this.draw = drawFunction;
};

UNIVERSE.GraphicsObject.prototype = {
    constructor: UNIVERSE.GraphicsObject
};