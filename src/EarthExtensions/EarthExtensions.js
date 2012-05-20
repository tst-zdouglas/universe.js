// EarthExtensions.js

var UNIVERSE = UNIVERSE || {};

/** 
	Extensions for doing Earth-based 3D modeling with Universe.js
	@constructor
	@param {UNIVERSE.Universe} universe - The Universe to draw in
	@param {boolean} isSunLighting - Should the Earth be lit by the sun or not
 */
UNIVERSE.EarthExtensions = function(universe, isSunLighting) {
    var earthExtensions = this;
	
    // constants
    var earthSphereRadius = Constants.radiusEarth;
	
    // have to do this this way since the decision of whether to show or hide it has to be made at draw time
    var enableVisibilityLines = false;
    this.enableSensorProjections = false;
    this.enableSensorFootprintProjections = false;
    var enableSubSatellitePoints = false;
    var enablePropagationLines = false;
    this.lockCameraToWithEarthRotation = false;
    
    this.rotationOffsetFromXAxis = 0;

    // Is the sun-lighting on the Earth enabled or disabled
    this.useSunLighting = isSunLighting ? isSunLighting : true;
    
    this.defaultObjects = new UNIVERSE.DefaultObjects(universe);

    /**
        Add the Earth at the center of the Universe
        @public
        @param {string} dayImageURL - URL of the image to be used for the sun-facing side of the Earth
        @param {string} nightImageURL - URL of the image to be used for the dark side of the Earth
    */
    this.addEarth = function(dayImageURL, nightImageURL) {
        var earth = new UNIVERSE.Earth(universe, earthExtensions, dayImageURL, nightImageURL);
        universe.addObject(earth);
        universe.updateOnce();
    };
    
    /**
	Add the Moon to the Universe
	@public
	@param {string} moonImageURL - the URL of the Moon image to use
    */
    this.addMoon = function(moonImageURL) {
        var moon = new UNIVERSE.Moon(universe, earthExtensions, moonImageURL);
        universe.addObject(moon);
        universe.updateOnce();
    };

    /**
		Add the sun to the Universe at the correct position relative to the Earth-centered universe
	*/
    this.addSun = function() {
        //var sunLight = new THREE.PointLight( 0xffffff, 1.5);
	var sun = new UNIVERSE.Sun(universe, earthExtensions);
        universe.addObject(sun);
        universe.updateOnce();
    };

    /**
        Add a Space Object to the Universe
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add to the Universe
    */
    this.addSpaceObject = function(spaceObject, callback) {
        var objectGeometry, material;
        universe.getObjectFromLibraryById(spaceObject.modelId, function(retrieved_geometry) {
            objectGeometry = retrieved_geometry;
            universe.getObjectFromLibraryById("default_material", function(retrieved_material) {
                universe.addObject(spaceObject.getGraphicsObject(retrieved_material, objectGeometry, universe, earthExtensions));
                universe.updateOnce();
                callback();
            });
        });
    };
	
    this.addSensorVisibilityLines = function(object, callback) {
        if(object.sensors && object.sensors.length > 0) {
            var visibilityLinesController = new UNIVERSE.GraphicsObject(
                object.id + "_visibilityLines",
                object.objectName,
                undefined,
                function(elapsedTime) {
                    if(enableVisibilityLines) {
                        var sensorLength = object.sensors.length;
						
                        var graphicsObjects = universe.getGraphicsObjects();
                        var objectsToDrawLinesTo = [];
                        for(var i = 0; i < sensorLength; i++) {
                            var sensor = object.sensors[i];
                            for(var j in graphicsObjects) {
                                var obj = graphicsObjects[j];
                                //console.log("obj.id: " + obj.id + " object.id: " + object.id);
                                if ( obj.currentLocation != undefined && 
                                    obj.modelName != "earth" && 
                                    obj.modelName != "moon" && 
                                    obj.modelName != "sun" && 
                                    obj.id != object.id && 
                                    obj.id.indexOf("_groundPoint") == -1 && 
                                    obj.id.indexOf("_propagation") == -1 &&
                                    obj.id.indexOf("_to_") == -1 && 
                                    obj.id.indexOf("_visibility_") == -1)
                                    {
                                    // Now we're looking at a point 
                                    //console.log(obj.id);
                                    //var currentLocationInEci = threeDToEciCoordinates(obj.currentLocation);
                                    //var targetPosition = new UNIVERSE.ECICoordinates(currentLocationInEci.x, currentLocationInEci.y, currentLocationInEci.z, 0,0,0,0,0,0);	
                                    //var targetPosition = new UNIVERSE.ECICoordinates(-obj.currentLocation.x, obj.currentLocation.z, obj.currentLocation.y, 0,0,0,0,0,0);	
                                    var inView = sensor.checkSensorVisibilityOfTargetPoint(object, obj.currentLocation );
                                    //console.log('VISIBILITY CHECK [' + object.objectName + ":" + sensor.name + ']  to '+ obj.modelName + " inview: " + inView);
                                    if(!objectsToDrawLinesTo[obj.id]) {
                                        objectsToDrawLinesTo[obj.id] = inView;
                                    }
                                }
                            }
                        }

                        for(var k in objectsToDrawLinesTo) {
                            if(objectsToDrawLinesTo[k] ) {
                                if(universe.getGraphicsObjectById(object.id + "_visibility_" + k) == undefined)
                                {
                                    //console.log("adding line for object: " + object.id + " and " + k);
                                    earthExtensions.addLineBetweenObjects(object.id, k, undefined, "_visibility_");	
                                //universe.updateOnce();
                                }
                                else {
                                //console.log("line already there for: " + k);
                                }
                            }
                            else {
                                earthExtensions.removeLineBetweenObjects(object.id, k, "_visibility_");
                            }
                        //console.log("finished: " + k);
                        }

						
                    }
                    earthExtensions.showAllSensorVisibilityLines(enableVisibilityLines);
					
                },
                function() {
                // nothing to draw, this is a controller
                }
                );
            universe.addObject(visibilityLinesController);
            universe.updateOnce();
            callback();
        }
    };

    /**
		Add a Ground Object to the Earth
		@public
		@param {UNIVERSE.GroundObject} groundObject - an object to display on the Earth
	*/
    this.addGroundObject = function(groundObject, callback) {
        var objectGeometry, objectMaterial, material;
        
        if(!groundObject.modelId) {
            groundObject.modelId = "default_ground_object_geometry";
            material = "default_ground_object_material";
        }
        else {
            material = "default_material";
        }
        
        universe.getObjectFromLibraryById(groundObject.modelId, function(retrieved_geometry) {
            objectGeometry = retrieved_geometry;
            
            universe.getObjectFromLibraryById(material, function(retrieved_material) {
                universe.addObject(groundObject.getGraphicsObject(retrieved_material, objectGeometry, universe, earthExtensions));
                universe.updateOnce();
                callback();
            });
        });
    };

    /**
		Add a Ground Track Point for an Object
		@public
		@param {UNIVERSE.SpaceObject} object - The Space Object to add a ground track point for
	*/
    this.addGroundTrackPointForObject = function(object, callback) {
        var objectGeometry, objectMaterial;
        universe.getObjectFromLibraryById("default_ground_object_geometry", function(retrieved_geometry) {
            objectGeometry = retrieved_geometry;
            universe.getObjectFromLibraryById("default_ground_track_material", function(retrieved_material) {
                var groundTrackPoint = new UNIVERSE.GroundTrackPoint(object, universe, earthExtensions, retrieved_material, objectGeometry);
                universe.addObject(groundTrackPoint);
                universe.updateOnce();
                callback();
            });
        });
    };

    /**
		Add a Propagation Line for an Object
		@public
		@param {UNIVERSE.SpaceObject} object - A Space Object to add a propagation line for
	*/
    this.addPropogationLineForObject = function(object, callback) {
        var objectGeometry, objectMaterial;
        objectGeometry = new THREE.Geometry();
        
        universe.getObjectFromLibraryById("default_orbit_line_material", function(retrieved_material) {
            var lineGraphicsObject = new UNIVERSE.PropogationLine(object, universe, earthExtensions, retrieved_material, objectGeometry);
            universe.addObject(lineGraphicsObject);
            universe.updateOnce();
            callback();
        });
    };

    /**
		Add a Sensor Projection for an Object
		@public
		@param {UNIVERSE.SpaceObject} object - A Space Object to add a Sensor Projection for
	*/
    this.addSensorProjection = function(sensor, spaceObject) {

        // Determine the object's location in 3D space
        var objectLocation = earthExtensions.eciTo3DCoordinates(spaceObject.propagator(undefined, false));
        
        if(objectLocation != undefined) {
            var sensorProjection = UNIVERSE.SensorProjection(sensor, spaceObject, universe, earthExtensions, objectLocation);
            universe.addObject(sensorProjection);
            universe.updateOnce();
        }
    };



    this.addSensorProjections = function(spaceObject, callback) {
        if(spaceObject.sensors.length > 0 ) {
            for(var i = spaceObject.sensors.length-1; i >= 0; i--) {
                this.addSensorProjection(spaceObject.sensors[i], spaceObject);
            }
            callback();
        }
    };
	
    this.addSensorFootprintProjections = function(spaceObject, callback) {
        if(spaceObject.sensors.length > 0 ) {
            for(var i = 0; i < spaceObject.sensors.length; i++) {
                this.addSensorFootprintProjection(spaceObject.sensors[i], spaceObject);
            }
            callback();
        }
    };
	
    this.addSensorFootprintProjection = function(sensor, spaceObject) {
        var lineGraphicsObject = new UNIVERSE.SensorFootprintProjection(sensor, spaceObject, universe, earthExtensions);
        universe.addObject(lineGraphicsObject);
        universe.updateOnce();
    };
    
    /**
		Add a Tracing Line to the closest ground object for an Object
		@public
		@param {UNIVERSE.SpaceObject} object - A Space Object to add a tracing line to the closest ground object for
	*/
    this.addClosestGroundObjectTracingLine = function(object) {
        var closestObject_id;
        var closestGroundObjectLineController = new UNIVERSE.GraphicsObject(
            object.id + "_controlLine",
            object.objectName,
            undefined,
            function(elapsedTime) {
                var objectLocation = earthExtensions.eciTo3DCoordinates(object.propagator(undefined, false));

                var closestGroundObject = earthExtensions.findClosestGroundObject(objectLocation);

                if(closestGroundObject != undefined && closestGroundObject.id != closestObject_id) {
                    earthExtensions.removeLineBetweenObjects(object.id, closestObject_id);
                    closestObject_id = closestGroundObject.id;
                    earthExtensions.addLineBetweenObjects(object.id, closestObject_id);
                }
            },
            function() {
				
            }
            );
        universe.addObject(closestGroundObjectLineController);
        universe.updateOnce();
    };

    /**
		Add a Line between two graphics objects
		@public
		@param {string} object1_id - starting object of the line
		@param {string} object2_id - end object of the line
	*/
    this.addLineBetweenObjects = function(object1_id, object2_id, color, customIdentifier) {
        var objectGeometry, objectMaterial;
        
        //universe.getObjectFromLibraryById("default_ground_object_tracing_line_material", function(retrieved_material) {
        if(!color) {
            color = 0x009900;
        }
        // else {
        // 				objectMaterial = retrieved_material;
        // 			}
			
        objectMaterial = new THREE.LineBasicMaterial({
            color : color,
            opacity : 1
        });
			
        var object1 = universe.getGraphicsObjectById(object1_id);
        var object2 = universe.getGraphicsObjectById(object2_id);
			
        if(object1 == undefined || object2 == undefined) {
            return;
        }
			
        var object1Location = earthExtensions.eciTo3DCoordinates(object1.currentLocation);
        var object2Location = earthExtensions.eciTo3DCoordinates(object2.currentLocation);
			
        if(object1Location == undefined || object2Location == undefined) {
            return;
        }
            
        objectGeometry = new THREE.Geometry();
        objectGeometry.vertices.push(new THREE.Vertex(new THREE.Vector3(object1Location.x, object1Location.y, object1Location.z)));
                
        objectGeometry.vertices.push(new THREE.Vertex(new THREE.Vector3(object2Location.x, object2Location.y, object2Location.z)));
            
        var line = new THREE.Line(objectGeometry, objectMaterial);

        var identifier = "_to_";
        if(customIdentifier)
        {
            identifier = customIdentifier;
        }
			
        var lineGraphicsObject = new UNIVERSE.GraphicsObject(
            object1_id + identifier + object2_id,
            undefined,
            undefined,
            function(elapsedTime) {
                var object1 = universe.getGraphicsObjectById(object1_id);
                var object2 = universe.getGraphicsObjectById(object2_id);
                if(object1 == undefined || object2 == undefined) {
                    return;
                }
                var object1Location = earthExtensions.eciTo3DCoordinates(object1.currentLocation);
                var object2Location = earthExtensions.eciTo3DCoordinates(object2.currentLocation);
					
                if(object1Location == undefined || object2Location == undefined) {
                    return;
                }
                   
                objectGeometry.vertices[0].position = {
                    x: object1Location.x, 
                    y: object1Location.y, 
                    z: object1Location.z
                };
					
                objectGeometry.vertices[1].position = {
                    x: object2Location.x, 
                    y: object2Location.y, 
                    z: object2Location.z
                };
					
                objectGeometry.__dirtyVertices = true;
            },
            function() {
                universe.draw(this.id, line, false)	;
            }
            );
        universe.addObject(lineGraphicsObject);
    //universe.updateOnce();
    //});
    };

    /**
		Remove a Line between two graphics objects
		@public
		@param {string} object1_id - starting object of the line
		@param {string} object2_id - end object of the line
	*/
    this.removeLineBetweenObjects = function(object1_id, object2_id, customIdentifier) {
        var identifier = "_to_";
        if(customIdentifier) {
            identifier = customIdentifier;
        }
        universe.removeObject(object1_id + identifier + object2_id);
    };
	
    /**
		Remove all Lines between two graphics objects
		@public
	*/
    this.removeAllLinesBetweenObjects = function() {
        var graphicsObjects = universe.getGraphicsObjects();
        for(var i in graphicsObjects) {
            if(i.indexOf("_to_") > -1) {
                universe.removeObject(i);
            }
        }
    };
    
    /**
		Return the closest Ground Object to a location
		@public
		@param {UNIVERSE.ECICoordinates} location - the location to find the closest point to
	*/
    this.findClosestGroundObject = function(location) {
        // TODO: this undefined check may be covering up a bug where not everything gets removed in the 
        // removeAllExceptEarthAndMoon method
        if(location != undefined) {
            var location_vector = new THREE.Vector3(location.x, location.y, location.z);

            // move the vector to the surface of the earth
            location_vector.multiplyScalar(earthSphereRadius / location_vector.length());

            return earthExtensions.findClosestObject({
                x: location_vector.x, 
                y: location_vector.y, 
                z: location_vector.z
            });
        }
        return undefined;
    };
    
    /**
		Return the closest Object to a location
		@public
		@param {UNIVERSE.ECICoordinates} location - the location to find the closest point to
	*/
    this.findClosestObject = function(location) {
        var graphicsObjects = universe.getGraphicsObjects();
        
        var closestDistance;
        var closestObject;
        var location_vector = new THREE.Vector3(location.x, location.y, location.z);
        
        for(var i in graphicsObjects) {
            if(graphicsObjects[i].currentLocation != undefined) {
                var vector = new THREE.Vector3(graphicsObjects[i].currentLocation.x, graphicsObjects[i].currentLocation.y, graphicsObjects[i].currentLocation.z);
                var distance_to = vector.distanceTo(location_vector);
                if(closestDistance == undefined || distance_to < closestDistance) {
                    closestObject = graphicsObjects[i];
                    closestDistance = distance_to;
                }
            }
        }
        
        return closestObject;
    };
    
    /**
		Enable or disable all orbit lines
		@public
		@param {boolean} isEnabled
	*/
    this.showAllOrbitLines = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();
        enablePropagationLines = isEnabled;

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_propogation") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };

    /**
		Enable or disable orbit lines for a specific object
		@public
		@param {string} id - identifier for the object
		@param {boolean} isEnabled
	*/
    this.showOrbitLineForObject = function(isEnabled, id) {
        universe.showObject(id + "_propogation", isEnabled);
    };

    /**
		Enable or disable display of an object
		@public
		@param {string} id - identifier for the object
		@param {boolean} isEnabled
	*/
    this.showModelForId = function(isEnabled, id) {
        universe.showObject(id, isEnabled);
    };
    
    /**
		Enable or disable display of all ground tracks
		@public
		@param {boolean} isEnabled
	*/
    this.showAllGroundTracks = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();
        enableSubSatellitePoints = isEnabled;

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_groundPoint") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };

    /**
		Enable or disable display of a ground track for an object
		@public
		@param {string} id - identifier for the object
		@param {boolean} isEnabled
	*/
    this.showGroundTrackForId = function(isEnabled, id) {
        universe.showObject(id + "_groundPoint", isEnabled);
    };
    
    /**
		Enable or disable display of all sensor projections
		@public
		@param {boolean} isEnabled
	*/
    this.showAllSensorProjections = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();
		
        this.enableSensorProjections = isEnabled;

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_sensorProjection") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };

    /**
		Enable or disable display of sensor projections for an object
		@public
		@param {string} id - identifier for the object
		@param {boolean} isEnabled
	*/
    this.showSensorProjectionForId = function(isEnabled, id) {
        //console.log("show/hiding sensorProjection");
        // have to do this because there are multiple sensors per space object
        var objects = universe.getGraphicsObjects();
        for(var i in objects) {
            if(i.indexOf(id + "_sensorProjection") > -1) {
                universe.showObject(i, isEnabled);
            }
        }
    };

    /**
		Enable or disable display of all sensor projections
		@public
		@param {boolean} isEnabled
	*/
    this.showAllSensorFootprintProjections = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();
		
        this.enableSensorFootprintProjections = isEnabled;

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_footprint") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };

    /**
		Enable or disable display of sensor projections for an object
		@public
		@param {string} id - identifier for the object
		@param {boolean} isEnabled
	*/
    this.showSensorFootprintProjectionsForId = function(isEnabled, id) {
        //console.log("show/hiding sensorProjection");
        var graphicsObjects = universe.getGraphicsObjects();

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf(id) != -1 && graphicsObjects[i].id.indexOf("_footprint") != -1 ){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };
	
    /**
		Enable or disable display of sensor projections for an object
		@public
		@param {string} id - identifier for the object
		@param {boolean} isEnabled
	*/
    this.showSensorVisibilityLinesForId = function(isEnabled, id) {
        //console.log("show/hiding sensorProjection");
        var graphicsObjects = universe.getGraphicsObjects();

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf(id + "_visibility_") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };
	
    /**
		Enable or disable display of all lines between objects
		@public
		@param {boolean} isEnabled
	*/
    this.showAllSensorVisibilityLines = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();
        enableVisibilityLines = isEnabled;

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_visibility_") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };
    
    /**
		Enable or disable display of all lines between objects
		@public
		@param {boolean} isEnabled
	*/
    this.showAllLinesBetweenObjects = function(isEnabled) {
        var graphicsObjects = universe.getGraphicsObjects();

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf("_to_") != -1){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };
    
    /**
		Enable or disable display of lines for an object
		@public
		@param {string} id - identifier for the object
		@param {boolean} isEnabled
	*/
    this.showLineBetweenObjectsForId = function(isEnabled, id) {
        var graphicsObjects = universe.getGraphicsObjects();

        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id.indexOf(id + "_to_") != -1 || graphicsObjects[i].id.indexOf("_to_" + id) != -1 ){
                universe.showObject(graphicsObjects[i].id, isEnabled);
            }
        }
    };
        
    this.lockCameraPositionRelativeToEarth = function(isLocked) {
        this.lockCameraToWithEarthRotation = isLocked;
    };

    /**
		Turn on or off sun lighting
		@public
		@param {boolean} isSunLighting
	*/
    this.setSunLighting = function(isSunLighting) {
        earthExtensions.useSunLighting = isSunLighting;
        universe.showObject("earth", !isSunLighting);
        universe.showObject("earth_day", isSunLighting);
        universe.showObject("earth_night", isSunLighting);
    };

    /**
		Remove all objects from the Universe except the Earth and Moon
		@public
	*/
    this.removeAllExceptEarthAndMoon = function() {
        var graphicsObjects = universe.getGraphicsObjects();
        
        for(var i in graphicsObjects) {
            if(graphicsObjects[i].id != "earth" && graphicsObjects[i].id != "moon" && graphicsObjects[i].id != "sun") {
                universe.removeObject(graphicsObjects[i].id);
            }
        }
    };

    /**
		Set up the Universe with the Earth Extensions
		@public
	*/
    this.setup = function() {
        this.removeAllExceptEarthAndMoon();
        universe.setup();
    };

    /**
		Converts ECI to THREE.js 3D coordinate system. Compare these two websites for details on why we have to do this:
    	http://celestrak.com/columns/v02n01/
    	http://stackoverflow.com/questions/7935209/three-js-3d-coordinates-system
		@private
	*/
    this.eciTo3DCoordinates = function(location) {
        if(location == undefined) {
            return undefined;
        }
                
        /*
                 *  z' = z*cos q - x*sin q
                 *  x' = z*sin q + x*cos q
                 *  y' = y
                 *  x = -location.x
                 *  y = location.z
                 *  z = location.y
                 */
        return {
            x : (location.y) * Math.sin(-earthExtensions.rotationOffsetFromXAxis) + (-location.x) * Math.cos(-earthExtensions.rotationOffsetFromXAxis),
            y : location.z,
            z : location.y * Math.cos(-earthExtensions.rotationOffsetFromXAxis) - (-location.x) * Math.sin(-earthExtensions.rotationOffsetFromXAxis),
            vx : -location.vx,
            vy : location.vz,
            vz : location.vy
        };
    };
        
    function threeDToEciCoordinates(location) {
        if(location == undefined) {
            return undefined;
        }
                
        /*
                 *  z' = z*cos q - x*sin q
                 *  x' = z*sin q + x*cos q
                 *  y' = y
                 *  x = -location.x
                 *  y = location.z
                 *  z = location.y
                 */
        return {
            x : (location.y) * Math.sin(earthExtensions.rotationOffsetFromXAxis) + (-location.x) * Math.cos(earthExtensions.rotationOffsetFromXAxis),
            y : location.z,
            z : location.y * Math.cos(earthExtensions.rotationOffsetFromXAxis) - (-location.x) * Math.sin(earthExtensions.rotationOffsetFromXAxis),
            vx : -location.vx,
            vy : location.vz,
            vz : location.vy
        };
    }
};

