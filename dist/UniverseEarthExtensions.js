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
    
    // have to do this this way since the decision of whether to show or hide it has to be made at draw time
    this.enableVisibilityLines = false;
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
        @param {function} callback - A function called at completion of the addition
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
    
    /**
        Add Lines from a space object to objects in it's sensor FOVs to the Universe
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add to the Universe
        @param {function} callback - A function called at completion of the addition
    */
    this.addSensorVisibilityLines = function(object, callback) {
        if(object.sensors && object.sensors.length > 0) {
            var visibilityLinesController = new UNIVERSE.SensorVisibilityLinesController(object, universe, earthExtensions)
            universe.addObject(visibilityLinesController);
            universe.updateOnce();
            callback();
        }
    };

    /**
        Add a Ground Object to the Earth
        @public
        @param {UNIVERSE.GroundObject} groundObject - an object to display on the Earth
        @param {function} callback - A function called at completion of the addition
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
        @param {function} callback - A function called at completion of the addition
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
        @param {function} callback - A function called at completion of the addition
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
        var objectLocation = Utilities.eciTo3DCoordinates(spaceObject.propagator(undefined, false), earthExtensions);
        
        if(objectLocation) {
            var sensorProjection = UNIVERSE.SensorProjection(sensor, spaceObject, universe, earthExtensions, objectLocation);
            universe.addObject(sensorProjection);
            universe.updateOnce();
        }
    };


    /**
        Add sensor projections for a space object
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add projections for
        @param {function} callback - A function called at completion of the addition
    */
    this.addSensorProjections = function(spaceObject, callback) {
        if(spaceObject.sensors.length > 0 ) {
            for(var i = spaceObject.sensors.length-1; i >= 0; i--) {
                this.addSensorProjection(spaceObject.sensors[i], spaceObject);
            }
            callback();
        }
    };
    
    
    /**
        Add sensor projection footprints for all sensors on a space object
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add projections for
        @param {function} callback - A function called at completion of the addition
    */
    this.addSensorFootprintProjections = function(spaceObject, callback) {
        if(spaceObject.sensors.length > 0 ) {
            for(var i = 0; i < spaceObject.sensors.length; i++) {
                this.addSensorFootprintProjection(spaceObject.sensors[i], spaceObject);
            }
            callback();
        }
    };
    
    /**
        Add sensor projection footprints for a specific sensor on a space object
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add projections for
        @param {function} callback - A function called at completion of the addition
    */
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
                var objectLocation = Utilities.eciTo3DCoordinates(object.propagator(undefined, false), earthExtensions);

                var closestGroundObject = earthExtensions.findClosestGroundObject(objectLocation);

                if(closestGroundObject !== undefined && closestGroundObject.id != closestObject_id) {
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
        @param {string} color - color code in hex of the line between objects
        @param {string} customIdentifier - a specific identifier to put between objects in the id
    */
    this.addLineBetweenObjects = function(object1_id, object2_id, color, customIdentifier) {
        var lineGraphicsObject = new UNIVERSE.LineBetweenObjects(object1_id, object2_id, universe, earthExtensions, color, customIdentifier);        
        universe.addObject(lineGraphicsObject);
    }

    /**
        Remove a Line between two graphics objects
        @public
        @param {string} object1_id - starting object of the line
        @param {string} object2_id - end object of the line
        @param {string} customIdentifier - a specific identifier to put between objects in the id
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
        if(location) {
            var location_vector = new THREE.Vector3(location.x, location.y, location.z);

            // move the vector to the surface of the earth
            location_vector.multiplyScalar(Constants.radiusEarth / location_vector.length());

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
            if(graphicsObjects[i].currentLocation) {
                var vector = new THREE.Vector3(graphicsObjects[i].currentLocation.x, graphicsObjects[i].currentLocation.y, graphicsObjects[i].currentLocation.z);
                var distance_to = vector.distanceTo(location_vector);
                if(closestDistance === undefined || distance_to < closestDistance) {
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
        this.enableVisibilityLines = isEnabled;

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
        
    /**
        Lock the position of the camera relative to the Earth so that it appears
        that the Earth is not spinning
        @public
        @param {boolean} isLocked
    */
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
    }
};

/** 
    A set of default objects to add to the Universe Object Library
    @constructor
    @param {UNIVERSE.Universe} universe - A Universe instance to use the default objects in
 */
UNIVERSE.DefaultObjects = function(universe) {
    
    universe.setObjectInLibrary("default_ground_object_geometry", new THREE.SphereGeometry(200, 20, 10));
    universe.setObjectInLibrary("default_ground_object_material", new THREE.MeshLambertMaterial({
        color : 0xCC0000
    }));

    universe.setObjectInLibrary("default_ground_track_material", new THREE.MeshBasicMaterial({
        color : 0xCC0000,
        transparent:true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    }));
    
    universe.setObjectInLibrary("default_orbit_line_material", new THREE.LineBasicMaterial({
        color : 0x990000,
        opacity : 1
    }));
            
    universe.setObjectInLibrary("default_ground_object_tracing_line_material", new THREE.LineBasicMaterial({
        color : 0x009900,
        opacity : 1
    }));
    
    this.sensorColors = {
        colorList: [
        "0xff0000",
        "0x00cc00",
        "0x0066ff",
        "0x9900cc",
        "0xffff00",
        "0xff6666",
        "0xebebeb",
        "0xffaa00"
        ],
        iterator: -1,
        // GRab the next color on the list and iterate to the next color
        nextColor: function() {
            this.iterator = (this.iterator + 1) % this.colorList.length;
            return this.colorList[this.iterator];     
        }
    };
};/** 
    The Earth positioned at the center of the Universe
    @constructor
    @param {UNIVERSE.Universe} universe - A Universe instance to draw the Earth in
    @param {UNIVERSE.EarthExtensions} earthExtensions - An EarthExtensions instance to draw the Earth with
    @param {URL} dayImageURL - Image to be used for the day-side of the Earth
    @param {URL} nightImageURL - Image to be used for the night-side of the Earth
 */

UNIVERSE.Earth = function(universe, earthExtensions, dayImageURL, nightImageURL) {
    var earthSphereSegments = 40, earthSphereRings = 30;

    // Create the sphere
    var geometry = new THREE.SphereGeometry(Constants.radiusEarth, earthSphereSegments, earthSphereRings);
    var dayImageTexture   = THREE.ImageUtils.loadTexture( dayImageURL );
    var earthAtNightTexture = THREE.ImageUtils.loadTexture( nightImageURL );
    var nightMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        overdraw: true,
        map: earthAtNightTexture,
        blending: THREE.AdditiveBlending
    });

    var nightEarthMesh = new THREE.Mesh(geometry, nightMaterial);

    var dayMaterial = new THREE.MeshPhongMaterial({
        map: dayImageTexture,
        color: 0xffffff,
        // specular: 0xffffff,
        //ambient: 0xffffff,
        // shininess: 15,
        //opacity: 0.5,
        transparent: true,
        // reflectivity: 1
        blending: THREE.AdditiveBlending
    });

    var dayEarthMesh = new THREE.Mesh(geometry, dayMaterial);

    var earthMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        overdraw: true,
        map: dayImageTexture,
        blending: THREE.AdditiveBlending
    });

    var earthMesh = new THREE.Mesh(geometry, earthMaterial);

    var previousRotation = CoordinateConversionTools.convertTimeToGMST(universe.getCurrentUniverseTime());

    var earthObject = new UNIVERSE.GraphicsObject(
        "earth", 
        "earth",
        {
            x:0, 
            y:0, 
            z:0
        },
        function(elapsedTime) {
            var rotationAngle = MathTools.toRadians(CoordinateConversionTools.convertTimeToGMST(universe.getCurrentUniverseTime()));

            // TODO: This works ok with low-speed and low number of objects, not good with high speed or large number of objects
            // Idea to fix it:
            // Leave the camera where it is and turn on/off rotating the earth
            // This will require that each will have to be converted from ECI to a rotated ECI location
            // This can be buryied in the eciTo3DCoordinates method and should work so long as the math isn't overly intensive
            // since it will be called A LOT
            
            if(earthExtensions.lockCameraToWithEarthRotation) {
                // move camera along with Earth
                //universe.addRotationToCamera(rotationAngle - previousRotation);
                earthExtensions.rotationOffsetFromXAxis += (rotationAngle - previousRotation);
                if(earthExtensions.rotationOffsetFromXAxis > (2 * Math.PI)) {
                    earthExtensions.rotationOffsetFromXAxis -= (2 * Math.PI);
                }
            }
            else {
                dayEarthMesh.rotation.y = rotationAngle - earthExtensions.rotationOffsetFromXAxis;
                nightEarthMesh.rotation.y = rotationAngle - earthExtensions.rotationOffsetFromXAxis;
                earthMesh.rotation.y = rotationAngle - earthExtensions.rotationOffsetFromXAxis;
            }

            previousRotation = rotationAngle;
        },
        function() {
            // for some reason these lines have to go in this order for night to be under day...
            universe.draw(this.id + "_day", dayEarthMesh, false);
            universe.draw(this.id + "_night", nightEarthMesh, false);
            universe.draw(this.id, earthMesh, false);
            earthExtensions.setSunLighting(earthExtensions.useSunLighting);

        }
    );
    return earthObject;
};// EllipseSensorShape.js

var UNIVERSE = UNIVERSE || {};

/** 
    Represents an Ellipse sensor shape to be used in Sensor projection and visibility calculation
    @constructor
    @param {string} shapeName - Name of the sensor shape
    @param {double} semiMajorAngle - SMA of the ellipse sensor
    @param {double} semiMinorAngle - SMI of the elipse sensor
 */
UNIVERSE.EllipseSensorShape = function(shapeName, semiMajorAngle, semiMinorAngle)
{
    this.shapeName = shapeName;
    this.semiMajorAngle = semiMajorAngle;
    this.semiMinorAngle = semiMinorAngle;
    
    this.getSemiMajorAngle = function()
    {
        return this.semiMajorAngle;
    };

    this.setSemiMajorAngle = function(semiMajorAngle)
    {
        this.semiMajorAngle = semiMajorAngle;
    };

    this.getSemiMinorAngle = function()
    {
        return this.semiMinorAngle;
    };

    this.setSemiMinorAngle = function(semiMinorAngle)
    {
        this.semiMinorAngle = semiMinorAngle;
    };

    this.getAngularExtentOfSensorAtSpecifiedAzimuth = function(checkAngle)
    {
        if ((this.semiMajorAngle===0)&&(this.semiMinorAngle===0)){
            return 0;
        }
        else{
            var a=MathTools.toRadians(this.semiMajorAngle);
            var b=MathTools.toRadians(this.semiMinorAngle);
            var cosTheta=Math.cos(MathTools.toRadians(checkAngle));
            var sinTheta=Math.sin(MathTools.toRadians(checkAngle));
            return MathTools.toDegrees(a*b/Math.sqrt((b*cosTheta)*(b*cosTheta)+(a*sinTheta)*(a*sinTheta)));
        }
    };

    this.canSensorSeePointAtAzEl = function(relativeAzimuth, relativeRadius){
        var canSee = false;
        
            var radiusSensor = this.getAngularExtentOfSensorAtSpecifiedAzimuth(relativeAzimuth);
            //console.log('ellipseSensor canSensorSee:  '+
            //    "radius sensor: " + radiusSensor+
            //    "    relative radius: " + relativeRadius);
            if(radiusSensor > relativeRadius){
                canSee = true;
            }
        return canSee;
    };
};var UNIVERSE = UNIVERSE || {};

/** 
    A Ground Object to be drawn on the Earth
    @constructor
    @param {string} id - Identifier for the object to be referenced later
    @param {string} objectName - A name for the object if different than id.  Set to the id if not defined
    @param {function} propagator - A function(time) to give the object's position at a time.  No time passed in means the current Universe time
    @param {string} modelId - Identifier for the model to use that has been added to the Universe's object library
 */

UNIVERSE.GroundObject = function(id, objectName, modelId, propagator) {
    if(!id)
    { 
        return undefined;
    }
    this.id = id;
    this.objectName = objectName || id;
    this.propagator = propagator;
    this.modelId = modelId;
};

UNIVERSE.GroundObject.prototype = {
    constructor: UNIVERSE.GroundObject,
    
    set: function ( id, objectName, propagator, modelId ) {

        this.id = id;
        this.objectName = objectName || id;
        this.propagator = propagator;
        this.modelId = modelId;

        return this;
    },
        
        getGraphicsObject: function(objectMaterial, objectGeometry, universe, earthExtensions) {
            objectGeometry.applyMatrix( new THREE.Matrix4().setRotationFromEuler( new THREE.Vector3( Math.PI / 2, Math.PI, 0 ) ));
            
            var groundObjectMesh = new THREE.Mesh(objectGeometry, objectMaterial);

            var groundObject = this;
            
            var groundGraphicsObject = new UNIVERSE.GraphicsObject(
                this.id,
                this.objectName,
                undefined,
                function(elapsedTime) {
                    // check earth rotation and update location
                    var propagatedPosition = groundObject.propagator();
                    var position = Utilities.eciTo3DCoordinates(propagatedPosition, earthExtensions);
                    groundObjectMesh.position.set(position.x, position.y, position.z);
                    this.currentLocation = propagatedPosition;

                    //http://mrdoob.github.com/three.js/examples/misc_lookat.html
                    var scaled_position_vector = new THREE.Vector3(position.x, position.y, position.z);

                    // arbitrary size, just a point along the position vector further out for the object to lookAt
                    scaled_position_vector.multiplyScalar(1.4);

                    groundObjectMesh.lookAt(scaled_position_vector);
                },
                function() {
                    universe.draw(groundObject.id, groundObjectMesh, true);
                }
            );
                
            return groundGraphicsObject;
        }
};// GroundTrackPoint.js

/** 
    A Ground Track (Sub-satellite) point to be drawn on the Earth
    @constructor
    @param {UNIVERSE.SpaceObject} object - the object to draw a ground tracking point for
    @param {UNIVERSE.Universe} universe - a Universe instance to draw the ground track point in
    @param {UNIVERSE.EarthExtensions} earthExtensions - An EarthExtensions instance to draw the ground track point in
    @param {THREE.Material} material - Material for the ground track point
    @param {THREE.Geometry} geometry - Geometry for the ground track point
 */
var UNIVERSE = UNIVERSE || {};

UNIVERSE.GroundTrackPoint = function(object, universe, earthExtensions, material, geometry) {

    var groundObjectMesh = new THREE.Mesh(geometry, material);

    var groundGraphicsObject = new UNIVERSE.GraphicsObject(
        object.id + "_groundPoint",
        object.objectName,
        undefined,
        function(elapsedTime) {
            //if(enableSubSatellitePoints) {
            var propagatedLocation = object.propagator(undefined, false);
            var objectLocation = Utilities.eciTo3DCoordinates(propagatedLocation, earthExtensions);
            if(objectLocation) {
                var vector = new THREE.Vector3(objectLocation.x, objectLocation.y, objectLocation.z);

                // move the vector to the surface of the earth
                vector.multiplyScalar(Constants.radiusEarth / vector.length());

                groundObjectMesh.position.copy(vector);
            }
            this.currentLocation = propagatedLocation;
            
        //}
        },
        function() {
            universe.draw(this.id, groundObjectMesh, true);
        }
    );
        
    return groundGraphicsObject;
};
// LineBetweenObjects.js

/**
 *
 */
var UNIVERSE = UNIVERSE || {};

UNIVERSE.LineBetweenObjects = function(object1_id, object2_id, universe, earthExtensions, color, customIdentifier) {
    var objectGeometry, objectMaterial;
        
    if(!color) {
        color = 0x009900;
    }
        
    objectMaterial = new THREE.LineBasicMaterial({
        color : color,
        opacity : 1
    });
			
    var object1 = universe.getGraphicsObjectById(object1_id);
    var object2 = universe.getGraphicsObjectById(object2_id);
			
    if(object1 == undefined || object2 == undefined) {
        return undefined;
    }
			
    var object1Location = Utilities.eciTo3DCoordinates(object1.currentLocation, earthExtensions);
    var object2Location = Utilities.eciTo3DCoordinates(object2.currentLocation, earthExtensions);
			
    if(object1Location == undefined || object2Location == undefined) {
        return undefined;
    }
            
    objectGeometry = new THREE.Geometry();
    objectGeometry.vertices.push(new THREE.Vertex(new THREE.Vector3(object1Location.x, object1Location.y, object1Location.z)));
                
    objectGeometry.vertices.push(new THREE.Vertex(new THREE.Vector3(object2Location.x, object2Location.y, object2Location.z)));
            
    var line = new THREE.Line(objectGeometry, objectMaterial);

    var identifier = "_to_"
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
            var object1Location = Utilities.eciTo3DCoordinates(object1.currentLocation, earthExtensions);
            var object2Location = Utilities.eciTo3DCoordinates(object2.currentLocation, earthExtensions);
					
            if(!(object1Location == undefined || object2Location == undefined)) {
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
            }
        },
        function() {
            universe.draw(this.id, line, false)	;
        }
    );
        
    return lineGraphicsObject;
};UNIVERSE.Moon = function(universe, earthExtensions, moonImageURL) {

    var moonSphereSegments = 40, moonSphereRings = 30;
    var moonSphereRadius = 1737.1;

    // Create the sphere
    var geometry = new THREE.SphereGeometry(moonSphereRadius, moonSphereSegments, moonSphereRings);

    var moonTexture = THREE.ImageUtils.loadTexture(moonImageURL);

    var dayMaterial = new THREE.MeshPhongMaterial({
        map: moonTexture,
        color: 0xffffff,
        // specular: 0xffffff,
        //ambient: 0xffffff,
        // shininess: 15,
        //opacity: 0.5,
        transparent: true,
        // reflectivity: 1
        blending: THREE.AdditiveBlending
    });

    var dayMoonMesh = new THREE.Mesh(geometry, dayMaterial);

    var moonMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        overdraw: true,
        map: moonTexture,
        blending: THREE.AdditiveBlending
    });

    var moonMesh = new THREE.Mesh(geometry, moonMaterial);

    var moonObject = new UNIVERSE.GraphicsObject(
        "moon", 
        "moon",
        undefined,
        function(elapsedTime) {
            var time = new Date(universe.getCurrentUniverseTime());
            var propagatedValue = CoordinateConversionTools.getMoonPositionECIAtCurrentTime(time);
            var convertedLocation = Utilities.eciTo3DCoordinates({
                x: propagatedValue.x, 
                y: propagatedValue.y, 
                z: propagatedValue.z
            }, earthExtensions);
            dayMoonMesh.position = {
                x: convertedLocation.x, 
                y: convertedLocation.y, 
                z: convertedLocation.z
            }; 
            moonMesh.position = {
                x: convertedLocation.x, 
                y: convertedLocation.y, 
                z: convertedLocation.z
            };
            this.currentLocation = propagatedValue;
        },
        function() {
            universe.draw(this.id + "_day", dayMoonMesh, false);
            universe.draw(this.id, moonMesh, false);
            earthExtensions.setSunLighting(earthExtensions.useSunLighting);
        }
    );
    return moonObject;
};
// PropogationLine.js

/**
 *
 */
var UNIVERSE = UNIVERSE || {};

UNIVERSE.PropogationLine = function(object, universe, earthExtensions, material, geometry) {
    
    var timeToPropogate = new Date(universe.getCurrentUniverseTime());
    var loopCount = 1440;

    var eciLocations = [];

    // draw a vertex for each minute in a 24 hour period
    // dropped this to a vertex for every 5 minutes.  This seems to be about the max that you can use for a LEO
    // and still look decent.  HEOs and GEOs look fine with much greater spans.  For performance reasons, may want
    // to make this a param that can be set per vehicle
    for(var j = 0; j < loopCount; j += 5) {
        var location = object.propagator(timeToPropogate, false);
        eciLocations.push(location);
        var convertedLocation = Utilities.eciTo3DCoordinates(location, earthExtensions);
        if(convertedLocation) {
            var vector = new THREE.Vector3(convertedLocation.x, convertedLocation.y, convertedLocation.z);
            geometry.vertices.push(new THREE.Vertex(vector));
        }

        timeToPropogate.setMinutes(timeToPropogate.getMinutes() + 5);
    }

    var lineS = new THREE.Line(geometry, material);

    var lineGraphicsObject = new UNIVERSE.GraphicsObject(
        object.id + "_propogation",
        object.objectName,
        undefined,
        function(elapsedTime) {
            if(earthExtensions.lockCameraToWithEarthRotation) {
                var length = eciLocations.length;
                for(var i = 0; i < length; i++) {
                    var convertedLocation = Utilities.eciTo3DCoordinates(eciLocations[i], earthExtensions);
                    if(convertedLocation && lineS.geometry.vertices[i]) {
                        lineS.geometry.vertices[i].position = {
                            x: convertedLocation.x, 
                            y: convertedLocation.y, 
                            z: convertedLocation.z
                        };
                    }
                }
                lineS.geometry.__dirtyVertices = true;
            }

        },
        function() {
            universe.draw(this.id, lineS, false);
        }
    );
        
    return lineGraphicsObject;
};
/**
 * RectangleSensorShape.js
 * @author Justin
 */

var UNIVERSE = UNIVERSE || {};

UNIVERSE.RectangleSensorShape = function(shapeName, width, height)
{
    this.shapeName = shapeName;
    this.width = width;
    this.height = height;

    this.getHeight = function()
    {
        return this.height;
    };

    this.setHeight = function(height)
    {
        this.height = height;
    };

    this.getWidth = function()
    {
        return this.width;
    };

    this.setWidth = function(width)
    {
        this.width = width;
    };

    this.getAngularExtentOfSensorAtSpecifiedAzimuth = function(checkAngle)
    {

        if ((this.height === 0) && (this.width === 0))
        {
            return 0;
        }
        else
        {
            var upperRightCorner = MathTools.toDegrees(Math.atan(this.height / this.width));  //the azimuth (from the x-axis) of the corner
            var upperLeftCorner = 180 - upperRightCorner;
            var lowerLeftCorner = 180 + upperRightCorner;
            var lowerRightCorner = 360 - upperRightCorner;
            
            //System.out.println("ur: "+upperRightCorner+" ul: "+upperLeftCorner+" ll: "+lowerLeftCorner+" lr: "+lowerRightCorner);
            if (checkAngle<0){
                checkAngle+=360;
            }
            
            var r1=Math.abs(this.width/(2*Math.cos(MathTools.toRadians(checkAngle))));
            var r2=Math.abs(this.height/(2*Math.sin(MathTools.toRadians(checkAngle))));
             
            //determine which quadrant the azimuth is in
            if(checkAngle<upperRightCorner){
                return r1;
            }
            else if (checkAngle<upperLeftCorner){
                return r2;
            }
            else if (checkAngle<lowerLeftCorner){
                return r1;
            }
            else if (checkAngle<lowerRightCorner){
                return r2;
            }
            else{
                return r1;
            }

        }

    };

    this.canSensorSeePointAtAzEl = function(relativeAzimuth, relativeRadius){
        var canSee=false;
        
        var radiusSensor=this.getAngularExtentOfSensorAtSpecifiedAzimuth(relativeAzimuth);

        //console.log('rectSensor canSensorSee:  '+
        //        "radius sensor: " + radiusSensor+
        //        "    relative radius: " + relativeRadius);
        if(radiusSensor>relativeRadius){
            canSee=true;
        }
        return canSee;
    };
};
// Sensor.js

/**
 *
 * @author Justin
 */

UNIVERSE.Sensor = function(name, shape) {

    this.name = name;
    this.shape = shape;

    //default the sensor to orient along the satellite's nadir (it defaults to align with RSW where R would be equivalent to the sensor's centerline)
    this.quaternionFromRSWToSensor = new Quaternion(); //(equivalent to R3, R2, R1)
    this.rotationRadians = MathTools.toRadians(180.0);

    // http://www.cprogramming.com/tutorial/3d/quaternions.html
    this.rotationAxis = {
        x: 0.0,
        y: 0.0,
        z: 1.0
    };

    this.quaternionFromRSWToSensor.setW(Math.cos(this.rotationRadians / 2.0));
    this.quaternionFromRSWToSensor.setX(Math.sin(this.rotationRadians / 2.0) * this.rotationAxis.x);
    this.quaternionFromRSWToSensor.setY(Math.sin(this.rotationRadians / 2.0) * this.rotationAxis.y);
    this.quaternionFromRSWToSensor.setZ(Math.sin(this.rotationRadians / 2.0) * this.rotationAxis.z);

    
    this.rotateSensorAboutRadialVector = function(rotationAngle) {
        if (rotationAngle && rotationAngle !== 0)
        {
            var rotationQuaternion = new Quaternion();
            var rotationRadians = MathTools.toRadians(rotationAngle);
            var rotationAxis = {
                x: 1.0,
                y: 0.0,
                z: 0.0
            };
            
            rotationQuaternion.setW(Math.cos(rotationRadians / 2.0));
            rotationQuaternion.setX(Math.sin(rotationRadians / 2.0) * rotationAxis.x);
            rotationQuaternion.setY(Math.sin(rotationRadians / 2.0) * rotationAxis.y);
            rotationQuaternion.setZ(Math.sin(rotationRadians / 2.0) * rotationAxis.z);
            
            //figure out the new quaternion for the sensor coordinate system
            this.quaternionFromRSWToSensor = QuaternionMath.multiplyQuaternions(rotationQuaternion, this.quaternionFromRSWToSensor);
        }
    };

    this.rotateSensorAboutAlongTrackVector = function(rotationAngle) {
        if (rotationAngle && rotationAngle !== 0)
        {
            var rotationQuaternion = new Quaternion();
            var rotationRadians = MathTools.toRadians(rotationAngle);
            var rotationAxis = {
                x: 0.0,
                y: 1.0,
                z: 0.0
            };
            
            rotationQuaternion.setW(Math.cos(rotationRadians / 2.0));
            rotationQuaternion.setX(Math.sin(rotationRadians / 2.0) * rotationAxis.x);
            rotationQuaternion.setY(Math.sin(rotationRadians / 2.0) * rotationAxis.y);
            rotationQuaternion.setZ(Math.sin(rotationRadians / 2.0) * rotationAxis.z);
            
            //figure out the new quaternion for the sensor coordinate system
            this.quaternionFromRSWToSensor = QuaternionMath.multiplyQuaternions(rotationQuaternion, this.quaternionFromRSWToSensor);
        }
    };

    this.rotateSensorAboutCrossTrackVector = function(rotationAngle) {
        if (rotationAngle && rotationAngle !== 0)
        {
            var rotationQuaternion = new Quaternion();
            var rotationRadians = MathTools.toRadians(rotationAngle);
            var rotationAxis = {
                x: 0.0,
                y: 0.0,
                z: 1.0
            };
            
            rotationQuaternion.setW(Math.cos(rotationRadians / 2.0));
            rotationQuaternion.setX(Math.sin(rotationRadians / 2.0) * rotationAxis.x);
            rotationQuaternion.setY(Math.sin(rotationRadians / 2.0) * rotationAxis.y);
            rotationQuaternion.setZ(Math.sin(rotationRadians / 2.0) * rotationAxis.z);
            
            //figure out the new quaternion for the sensor coordinate system
            this.quaternionFromRSWToSensor = QuaternionMath.multiplyQuaternions(rotationQuaternion, this.quaternionFromRSWToSensor);
        }
    };

    this.getSensorQuaternionRSW = function() {
        return this.quaternionFromRSWToSensor;
    };

    this.setSensorQuaternionRSW = function(sensorQuaternionRSW) {
        this.quaternionFromRSWToSensor = sensorQuaternionRSW;
    };

    this.getName = function() {
        return this.name;
    };

    this.setName = function(name) {
        this.name = name;
    };

    this.getShape = function() {
        return this.shape;
    };

    this.setShape = function(shape) {
        this.shape = shape;
    };

    this.determineTargetAzElRelativeToSensor = function(satellite, targetPosition) {
        //define the target position as a vectors
        //console.log("satellite: " + satellite.getEci().getX() + ", " + satellite.getEci().getY() + ", " + satellite.getEci().getZ() +  '      ' + 
        //            "targetpos: " + targetPosition.getX() + ", " + targetPosition.getY() + ", " + targetPosition.getZ());
        //System.out.println("targetpos: " + targetPosition.getX() + ", " + targetPosition.getY() + ", " + targetPosition.getZ());
        
        var satelliteEci = satellite.getEci();
        var deltaECI = new THREE.Vector3(
            targetPosition.x - satelliteEci.getX(),
            targetPosition.y - satelliteEci.getY(),
            targetPosition.z - satelliteEci.getZ()
        );
        
        //console.log("delta ECI: " + deltaECI[0] + ", " + deltaECI[1] + ", " + deltaECI[2]);
        
        var r = new THREE.Vector3(
            satelliteEci.getX(), 
            satelliteEci.getY(), 
            satelliteEci.getZ()
        );
        
        var v = new THREE.Vector3(
            satelliteEci.getVX(),
            satelliteEci.getVY(),
            satelliteEci.getVZ()
        );
        
        var rmag = r.length();
        
        var rcrossv = new THREE.Vector3();
        rcrossv.cross(r, v);            
        
        var rvec = new THREE.Vector3();
        rvec.copy(r);
        rvec.divideScalar(rmag);
        
        var w = new THREE.Vector3();
        w.copy(rcrossv);
        w.divideScalar(rcrossv.length());
        
        var s = new THREE.Vector3();
        s.cross(w, r);
        
        var deltaECIdotR = deltaECI.dot(rvec);
        
        var deltaECIdotS = deltaECI.dot(s);
                
        var deltaECIdotW = deltaECI.dot(w);
        
        var targetInRSWCoordinates = new THREE.Vector3(
            deltaECIdotR/rvec.length(),
            deltaECIdotS/s.length(),
            deltaECIdotW/w.length()
        );

        //get the quaternion to convert the ECI coordinate of the target into an RSW coordinate triplet
        var targetInSensorCoordinates = QuaternionMath.applyQuaternionRotation(this.quaternionFromRSWToSensor, targetInRSWCoordinates);
        
        //console.log("targetInSensorCoordinates: " + JSON.stringify(targetInSensorCoordinates));

        //---determine the three vectors that define the extent of the sensor shape in the sensor coordinate system
        //these are the non-rotated vectors
        //vector along the centerline of the sensor (RSW)
        var centerline = new THREE.Vector3(
            1.0,//center (radial)
            0.0,//left
            0.0//top
        );

        var rightline = new THREE.Vector3(
            1.0,//center
            -Math.tan(MathTools.toRadians(this.shape.getAngularExtentOfSensorAtSpecifiedAzimuth(0.0))),//left
            0.0//top
        );

        var topline = new THREE.Vector3(
            1.0,//center
            0.0,//left
            Math.tan(MathTools.toRadians(this.shape.getAngularExtentOfSensorAtSpecifiedAzimuth(90.0)))//top
        );
        
        //calculate the azimuth and elevation angles of the target relative to the centerline of the sensor FOV
        //assume it's an oblique spherical triangle
        //reference http://mathworld.wolfram.com/SphericalTrigonometry.html
        //a is the angle between the centerline and the right hand side
        var a = MathTools.toRadians(MathTools.angleBetweenTwoVectorsVector(centerline, rightline));//radians
        
        //b is the angle between the centerline and the target
        var b = MathTools.toRadians(MathTools.angleBetweenTwoVectorsVector(centerline, targetInSensorCoordinates));//radians
        
        //c is the angle between the right hand side and the target
        var c = MathTools.toRadians(MathTools.angleBetweenTwoVectorsVector(rightline, targetInSensorCoordinates));//radians
        
        //d is the angle between the top side and the target
        var d = MathTools.toRadians(MathTools.angleBetweenTwoVectorsVector(topline, targetInSensorCoordinates));//radians
        
        //e is the angle between the top side and the target
        var e = MathTools.toRadians(MathTools.angleBetweenTwoVectorsVector(topline, centerline));//radians

        var S = 0.5 * (a + b + c);
        var C = 2 * Math.asin(Math.sqrt((Math.sin(Math.abs(S - a)) * Math.sin(Math.abs(S - b)) / (Math.sin(a) * Math.sin(b)))));

        //double C=Math.acos(Math.cos(c)-Math.cos(a)*Math.cos(b))/(Math.sin(a)*Math.sin(b));//radians
        var az = MathTools.toDegrees(C);
        var el = MathTools.toDegrees(b);

        if (d > b && d > e)
        {
            az = 360 - az;
        }
        //correct the azimuth
        //System.out.println("a (CL-RL): " + MathTools.toDegrees(a) + " b (CL-TGTL): " + MathTools.toDegrees(b) + " c (RL-TGTL): " + MathTools.toDegrees(c) + " d (TL-TGTL): " + MathTools.toDegrees(d) + " e (TL-CL): " + MathTools.toDegrees(e) + " C (az):" + MathTools.toDegrees(C));


        //return the azimuth and elevation
        return {
            az: az, 
            el: el
        };
    };

    this.checkToSeeIfEarthObscuresLineBetweenSatelliteAndTargetSphericalEarth = function(satellite, targetPosition)
    {
        //sight algorithm Vallado 295
        var haveSight = false;
        var radEarth = Constants.radiusEarth;
        var satelliteEci = satellite.getEci();
        var r1 = new THREE.Vector3(
            satelliteEci.getX() / radEarth,
            satelliteEci.getY() / radEarth,
            satelliteEci.getZ() / radEarth
        );
        var r2 = new THREE.Vector3(
            targetPosition.getX() / radEarth,
            targetPosition.getY() / radEarth,
            targetPosition.getZ() / radEarth
        );
        
        var r1mag = r1.length();
        var r2mag = r2.length();
        var tmin = 0.5;
        var ctmin = 0.0;
        if (r1mag < 1 || r2mag < 1)
        { //one of the points is inside the earth
            haveSight = false;
        }
        else
        {
            var r1DotR2 = r1.dot(r2);
            tmin = (r1mag * r1mag - r1DotR2) / (r1mag * r1mag + r2mag * r2mag - 2 * r1DotR2);
            if (tmin < 0 || tmin > 1)
            {
                haveSight = true;
            }
            else
            {
                ctmin = (1 - tmin) * r1mag * r1mag + r1DotR2 * tmin;
                if (ctmin >= 1.0)
                {
                    haveSight = true;
                }
            }

        }
        return !haveSight;
    };

    this.checkToSeeIfEarthObscuresLineBetweenSatelliteAndTargetOblateEarth = function(satellite, targetPosition)
    {

        //sight algorithm Vallado 295
        var haveSight = false;
        var radEarth = Constants.radiusEarth;
        var satelliteEci = satellite.getEci();
        var r1 = new THREE.Vector3(
            satelliteEci.getX() / radEarth,
            satelliteEci.getY() / radEarth,
            satelliteEci.getZ() / radEarth
        );
        var r2 = new THREE.Vector3(
            targetPosition.getX() / radEarth,
            targetPosition.getY() / radEarth,
            targetPosition.getZ() / radEarth
        );
        var r1mag = r1.length();
        var r2mag = r2.length();
        var tmin = 0.5;
        var ctmin = 0.0;

        //disable the radius magnitude check because it doesn't account for the oblateness of the earth which the LLAcoordinates do account for
        //this can cause points on the surface of the earth to appear inside of a non-oblate earth, causing this check to fail
        //if (r1mag < 1 || r2mag < 1)
        //{ //one of the points is inside the earth
        //    haveSight = false;
        //}
        //else
        //{
        var r1DotR2 = r1.dot(r2);
        tmin = (r1mag * r1mag - r1DotR2) / (r1mag * r1mag + r2mag * r2mag - 2 * r1DotR2);
        if (tmin < 0 || tmin > 1)
        {
            haveSight = true;
        }
        else
        {
            ctmin = (1 - tmin) * r1mag * r1mag + r1DotR2 * tmin;
            if (ctmin >= 1.0)
            {
                haveSight = true;
            }
        }

        //}
        return !haveSight;
    };

    this.checkSensorVisibilityOfTargetPoint = function(satellite, targetPosition)
    {
        //console.log("targetPosition: " + JSON.stringify(targetPosition));
        //console.log("satellite.getECI: " + JSON.stringify(satellite.getEci()));
        //first, correct the target azimuth and elevation to be in the same frame of reference as the sensor FOV
        var azel = this.determineTargetAzElRelativeToSensor(satellite, targetPosition);
        
        //console.log("az: " + azel[0] + " el: " + azel[1] + " shape El extent: " + this.shape.getAngularExtentOfSensorAtSpecifiedAzimuth(azel[0]));

        //then check to see if this point is in the field of view of the sensor
        var inFOV = this.shape.canSensorSeePointAtAzEl(azel.az, azel.el);
        var earthObscured = this.checkToSeeIfEarthObscuresLineBetweenSatelliteAndTargetOblateEarth(satellite, targetPosition);

        //console.log("earth obscured:" + earthObscured + "    inFOV:" + inFOV);
        if (earthObscured)
        {
            return false;
        }
        else
        {
            if (inFOV === true && earthObscured === false)  //if it's in the field of view and not obscured, indicate that you can see the target
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    };

    this.buildPointsToDefineSensorShapeInECI = function(NumPoints, satellite)
    {
        //returns the instantaneous field of view of the sensor as represented by 
        //a set of 'NumPoints' unit vectors from the center of the satellite to the boundaries
        //of the sensor field of view in ECI coordinates
        //it is assumed that each xyz pair 
        var FOV = []; // new Array(NumPoints);
//        for(var i = 0; i < NumPoints; i++) {
//            FOV[i] = new Array(3);
//        }

        var azimuthStep = 360.0 / NumPoints; //the azimuth separation between each point
        for (var i = 0; i < NumPoints; i++)
        {
            var az = i * azimuthStep;
            var el = MathTools.toRadians(this.shape.getAngularExtentOfSensorAtSpecifiedAzimuth(az));

            //console.log("az: " + az + " el: " + el);

            //build the sensor field of view vector in RSW

            //define the vector to the sensor boundary
            var FOVboundary = new THREE.Vector3(
                1.0, // radial
                el * Math.cos(MathTools.toRadians(az)), //along
                el * Math.sin(MathTools.toRadians(az))  //cross
            );

            //ensure that it is a unit vector
            var FOVmagnitude = FOVboundary.length();
            
            FOVboundary = FOVboundary.divideScalar(FOVmagnitude);

            //console.log("FOVboundary1: " + JSON.stringify(FOVboundary));

            FOVboundary = QuaternionMath.applyQuaternionRotation(this.quaternionFromRSWToSensor, FOVboundary);

            //console.log("FOVboundary2: " + JSON.stringify(FOVboundary));

            var rswPoint = new UNIVERSE.RSWCoordinates(FOVboundary.x, FOVboundary.y, FOVboundary.z);
            
            //console.log("rswPoint: " + JSON.stringify(rswPoint));

            var satelliteEci = satellite.getEci();
            var satXpos = satelliteEci.getX();
            var satYpos = satelliteEci.getY();
            var satZpos = satelliteEci.getZ();
    
            //convert the RSW to ECI
            var eciTemp = CoordinateConversionTools.convertRSWToECI(satellite, rswPoint);
            FOV[i] = new THREE.Vector3(
                satXpos + eciTemp.getX(),
                satYpos + eciTemp.getY(),
                satZpos + eciTemp.getZ()
            );
        }

        return FOV;
    };

    this.findProjectionPoints = function(endpoints, satellite, distancePastEarthToDraw) {
        var satellitePositionTemp = satellite.getEci();
        var satellitePosition = new THREE.Vector3(satellitePositionTemp.x, satellitePositionTemp.y, satellitePositionTemp.z);

        var shiftedEarthCenter = new THREE.Vector3(
            - satellitePosition.x,
            - satellitePosition.y,
            - satellitePosition.z
        );

        var pointsOnEarth = [];

        var endPointLen = endpoints.length;
        for(var i = 0; i < endPointLen; i++) {
            // shift everything to the satellite position as the origin
            var shiftedBoundaryPoint = new THREE.Vector3(
                endpoints[i].x - satellitePosition.x,
                endpoints[i].y - satellitePosition.y,
                endpoints[i].z - satellitePosition.z
            );

            var satelliteDistanceFromCenterOfEarth = satellitePosition.length();
            var depth = satelliteDistanceFromCenterOfEarth + distancePastEarthToDraw;

            // Based on this: http://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
            // d = ((I*c) +/- sqrt((I*c)^2 - c*c + r*r))
            var I = shiftedBoundaryPoint;
            var c = shiftedEarthCenter;

            var aboveTheEarth = 100;
            // r is the radius above the earth to project the points....this adds an arbitrary number above the earth to minimize drawing collisions
            var r = Constants.radiusEarth + aboveTheEarth;

            var Idotc = I.dot(c);

            var cdotc = c.dot(c);

            var valueToBeSqrtd = Idotc*Idotc - cdotc + r*r;

            // Line does intersect the earth so find the point
            if(valueToBeSqrtd >= 0) {
                var sqrtValue = Math.sqrt(Idotc*Idotc - cdotc + r*r);
                var distanceToIntersectionPlus = Idotc + sqrtValue;
                var distanceToIntersectionMinus = Idotc - sqrtValue;

                var pointOnEarth = new THREE.Vector3(
                    shiftedBoundaryPoint.x * distanceToIntersectionMinus + satellitePosition.x,
                    shiftedBoundaryPoint.y * distanceToIntersectionMinus + satellitePosition.y,
                    shiftedBoundaryPoint.z * distanceToIntersectionMinus + satellitePosition.z
                );
                if(pointOnEarth.x) {
                    pointsOnEarth.push(pointOnEarth);
                }

            }
            // This means the line does not intersect the earth and we will find the nearest tangent point
            else {
                // Scale the boundary point out to the depth
                
                var extendedEndPoint = new THREE.Vector3();
                extendedEndPoint.copy(shiftedBoundaryPoint);
                extendedEndPoint.multiplyScalar(depth);

                // Get a unit vector pointed at the earth center from the satellite coordinate system
                var unitShiftedEarthCenter = new THREE.Vector3();
                unitShiftedEarthCenter.copy(shiftedEarthCenter);
                unitShiftedEarthCenter.divideScalar(satelliteDistanceFromCenterOfEarth);

                // Find the angle between the two
                var angleBetweenEarthCenterAndExtendedEndPoint = Math.acos(shiftedBoundaryPoint.dot(unitShiftedEarthCenter));

                // http://www.algebralab.org/studyaids/studyaid.aspx?file=Trigonometry_LawSines.xml
                var height = satelliteDistanceFromCenterOfEarth * Math.sin(angleBetweenEarthCenterAndExtendedEndPoint);

                // Distance along the line where the tangent point is.  i.e. where the height touches the line
                var distanceToTangentPoint = height / Math.atan(angleBetweenEarthCenterAndExtendedEndPoint);

                // Scale to the point and then shift back to earth-centered
                var scaleFromEndPointToTangentPoint = distanceToTangentPoint/ depth;
                var tangentPoint = new THREE.Vector3(
                    (extendedEndPoint.x)*scaleFromEndPointToTangentPoint + satellitePosition.x,
                    (extendedEndPoint.y)*scaleFromEndPointToTangentPoint + satellitePosition.y,
                    (extendedEndPoint.z)*scaleFromEndPointToTangentPoint + satellitePosition.z
                );

                // scale down to the earth's surface, plus an arbitrary distance above the earth
                var tangentPointMagnitude = tangentPoint.length();
                var scaleToEarthSurface = (Constants.radiusEarth + aboveTheEarth)/tangentPointMagnitude;

                var tangentPointOnSurface = new THREE.Vector3();
                tangentPointOnSurface.copy(tangentPoint);
                tangentPointOnSurface.multiplyScalar(scaleToEarthSurface)

                pointsOnEarth.push(tangentPointOnSurface);
            }

        }

        return pointsOnEarth;
    };

    // TODO: This method is not currently used by anything...  Do not know for sure that it works or what it would be used for
//    this.getQuaternionFromECIToSensor = function(eciXYZvector, satellite)
//    {
//        var refMagnitude = MathTools.magnitudeVector(eciXYZvector);
//        var startVec = {
//            x: eciXYZvector.x / refMagnitude,
//            y: eciXYZvector.y / refMagnitude,
//            z: eciXYZvector.z / refMagnitude
//        };
//        
//        //determine the quaternion from the reference vector to the satellite position vector
//        
//        var satelliteEci = satellite.getEci();
//        var x = satelliteEci.getX();
//        var y = satelliteEci.getY();
//        var z = satelliteEci.getZ();
//        var satelliteMagnitude = Math.sqrt(x*x+y*y+z*z);
//        
//        var satelliteVec = {
//            x: x / satelliteMagnitude,
//            y: y / satelliteMagnitude,
//            z: z / satelliteMagnitude
//        };
//        
//        //figure out the quaternion from RSW to the default sensor axis (nadir)
//        var nadirQuaternion = new Quaternion();
//        var rotationRadians = MathTools.toRadians(180.0);
//        var rotationAxis = {
//            x: 0.0,
//            y: 0.0,
//            z: 1.0
//        };
//        
//        nadirQuaternion.setW(Math.cos(rotationRadians / 2.0));
//        nadirQuaternion.setX(Math.sin(rotationRadians / 2.0) * rotationAxis.x);
//        nadirQuaternion.setY(Math.sin(rotationRadians / 2.0) * rotationAxis.y);
//        nadirQuaternion.setZ(Math.sin(rotationRadians / 2.0) * rotationAxis.z);
//
//        //figure out the quaternion from the satellite's coordinate system to the sensor
//        var crossproduct = MathTools.crossVector(startVec, satelliteVec);
//        var crossproductmagnitude = MathTools.magnitudeVector(crossproduct);
//        var quaternionFromECIToRSW = new Quaternion();
//        
//        quaternionFromECIToRSW.setX(crossproduct.x / crossproductmagnitude);
//        quaternionFromECIToRSW.setY(crossproduct.y / crossproductmagnitude);
//        quaternionFromECIToRSW.setZ(crossproduct.z / crossproductmagnitude);
//        quaternionFromECIToRSW.setW(Math.acos(MathTools.dotMultiplyVector(startVec, satelliteVec)));
//        
//        var result = QuaternionMath.multiplyQuaternions(quaternionFromECIToRSW,nadirQuaternion);
//        result = QuaternionMath.multiplyQuaternions(result,this.quaternionFromRSWToSensor);
//
//        return result;
//    };
};// SensorFootprintProjection.js

/**
 *
 */
var UNIVERSE = UNIVERSE || {};

UNIVERSE.SensorFootprintProjection = function(sensor, object, universe, earthExtensions, objectLocation) {
    
    var objectMaterial = new THREE.LineBasicMaterial({
        color : Utilities.get_random_color(),
        opacity : 0.5,
        linewidth : 3
    });

    //console.log("sensor: " + JSON.stringify(spaceObject.sensors[i]));
    var objectGeometry = new THREE.Geometry();

    var points = sensor.buildPointsToDefineSensorShapeInECI(40, object);
    //var extendedPoints = sensors[0].extendSensorEndpointsInECIToConformToEarth(points, spaceObject, 1000, 10);
    var extendedPoints = sensor.findProjectionPoints(points, object, 1000);
        
    for(var j = 0; j< extendedPoints.length; j++) {
        var vector = new THREE.Vector3(-extendedPoints[j].x, extendedPoints[j].z, extendedPoints[j].y);
        objectGeometry.vertices.push(new THREE.Vertex(vector));
    }

    objectGeometry.vertices.push(new THREE.Vertex(new THREE.Vector3(-extendedPoints[0].x, extendedPoints[0].z, extendedPoints[0].y)));

    var line = new THREE.Line(objectGeometry, objectMaterial);

        
    var lineGraphicsObject = new UNIVERSE.GraphicsObject(
        object.id + "_footprint_" + sensor.name,
        undefined,
        undefined,
        function(elapsedTime) {
            if(earthExtensions.enableSensorFootprintProjections) {
                var points = this.sensor.buildPointsToDefineSensorShapeInECI(40, object);
                    
                var extendedPoints = this.sensor.findProjectionPoints(points, object, 1000);

                for(var k = 0; k < extendedPoints.length; k++) {
                    var convertedLocation = Utilities.eciTo3DCoordinates(extendedPoints[k], earthExtensions);
                    line.geometry.vertices[k].position = {
                        x: convertedLocation.x, 
                        y: convertedLocation.y, 
                        z: convertedLocation.z
                    };
                }
                                        
                var convertedLastPoint = Utilities.eciTo3DCoordinates(extendedPoints[0], earthExtensions);
                line.geometry.vertices[extendedPoints.length].position = {
                    x: convertedLastPoint.x, 
                    y: convertedLastPoint.y, 
                    z: convertedLastPoint.z
                };

                line.geometry.__dirtyVertices = true;
            }
        },
        function() {
            universe.draw(this.id, line, false) ;
        }
        );
    lineGraphicsObject.sensor = sensor;
    
    return lineGraphicsObject;
};
// SensorProjection.js

/**
 *
 */
var UNIVERSE = UNIVERSE || {};

UNIVERSE.SensorProjection = function(sensor, object, universe, earthExtensions, objectLocation) {
    // Create a SensorPattern

    var sensorPointCount = 30;
    // obtain the points of the sensor
    var points = sensor.buildPointsToDefineSensorShapeInECI(sensorPointCount, object);
    //var extendedPoints = sensors[0].extendSensorEndpointsInECIToConformToEarth(points, spaceObject, 1000, 10);
    var extendedPoints = sensor.findProjectionPoints(points, object, 1000);


    var THREEPoints = new Array( extendedPoints.length );
    var pointCount = extendedPoints.length;
    for(var j = 0; j< pointCount; j++) {
        var coord = Utilities.eciTo3DCoordinates(extendedPoints[j], earthExtensions);
        THREEPoints[j] = coord;
    }
    
    var objectGeometry = new UNIVERSE.SensorProjectionGeometry(objectLocation, THREEPoints);

    var objectMaterial = new THREE.MeshBasicMaterial({
        color: earthExtensions.defaultObjects.sensorColors.nextColor(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.15,
        overdraw: true
    });

    var sensorProjection = new THREE.Mesh(objectGeometry, objectMaterial);

    sensorProjection.doubleSided=true;

    var sensorProjectionGraphicsObject = new UNIVERSE.GraphicsObject(
        object.id + "_sensorProjection_" + sensor.name,
        object.objectName,
        undefined,
        function(elapsedTime) {
            if(earthExtensions.enableSensorProjections) {
                var objectLocation = Utilities.eciTo3DCoordinates(object.propagator(undefined, false), earthExtensions);

                if(objectLocation) {

                    var points = sensor.buildPointsToDefineSensorShapeInECI(sensorPointCount, object);
                    var extendedPoints = sensor.findProjectionPoints(points, object, 1000);

                    THREEPoints = [];
                    for(var j = 0; j< pointCount; j++) {
                        var coord = Utilities.eciTo3DCoordinates(extendedPoints[j], earthExtensions);
                        THREEPoints[j] = coord;
                    }
                    sensorProjection.geometry.recalculateVertices(objectLocation, THREEPoints);
                }
            }
        },
        function() {
            universe.draw(this.id, sensorProjection, false);
        }
        );
                
    return sensorProjectionGraphicsObject;
};/**
 * Based HEAVILY on the CylinderGeometry.js file from Three.js (mr.doob mrdoob.com)
 * @author Brian Davis
 */



var UNIVERSE = UNIVERSE || {};



/**
 * Use this to project a pattern from a single point to a destination set of points
*  var cone = new THREE.Mesh( new Cone(), new THREE.MeshBasicMaterial( { color:Math.random() * 0xff0000 } ) );
   cone.phase = Math.floor( Math.random() * 62.83 );
   cone.position.set( 20,20,20);
   cone.doubleSided = true;
   cone.scale.x = cone.scale.y = cone.scale.z = 10;
   scene.add( cone );

 */

//var sensor_rotation_matrix = new THREE.Matrix4().setRotationFromEuler( new THREE.Vector3( -1 * Math.PI/2 , 0, 0 ) );

// // call with a set of points on the earth and a sensor origin
// points is an array with .x, .y. z and the vehicle origin is also an object with just an .x, .y and .z
// Assume that passed in points are all in THREE.js
UNIVERSE.SensorProjectionGeometry = function ( sensorOrigin, groundPoints ) {

    THREE.Geometry.call( this );

    var segmentsY = 1;
    var x, y, vertices = [], uvs = [];

    // tack on the initial ground point back to the end of the groundpoints array
    groundPoints.push(groundPoints[0]);
    var segmentsX = groundPoints.length - 1;

    var xpos, ypos, zpos, u;

    // Create the top points around the vehicle
    var v = 0;

    var verticesRow = [];
    var uvsRow = [];
    for ( x = 0; x <= segmentsX; x ++ ) {
        u = x / segmentsX;

        xpos = sensorOrigin.x;
        ypos = sensorOrigin.y;
        zpos = sensorOrigin.z;

        //console.log("Vertice point: " + xpos + "," + ypos + "," + zpos);
        this.vertices.push( new THREE.Vertex( new THREE.Vector3( xpos, ypos, zpos ) ) );
        verticesRow.push( this.vertices.length - 1 );
        uvsRow.push( new THREE.UV( u, v ) );
    }

    vertices.push( verticesRow );
    uvs.push( uvsRow );

    // Now create the ground lines
    v = 1;
    verticesRow = [];
    uvsRow = [];
    for ( x = 0; x <= segmentsX; x ++ ) {
        u = x / segmentsX;

        xpos = groundPoints[x].x;
        ypos = groundPoints[x].y;
        zpos = groundPoints[x].z;

        //        console.log("Vertice point: " + xpos + "," + ypos + "," + zpos);
        this.vertices.push( new THREE.Vertex( new THREE.Vector3( xpos, ypos, zpos ) ) );
        verticesRow.push( this.vertices.length - 1 );
        uvsRow.push( new THREE.UV( u, v ) );

    }
    vertices.push( verticesRow );
    uvs.push( uvsRow );

    for ( y = 0; y < segmentsY; y ++ ) {

        for ( x = 0; x < segmentsX; x ++ ) {

            var v1 = vertices[ y ][ x ];
            var v2 = vertices[ y + 1 ][ x ];
            var v3 = vertices[ y + 1 ][ x + 1 ];
            var v4 = vertices[ y ][ x + 1 ];

            // FIXME: These normals aren't right for cones.

            var n1 = this.vertices[ v1 ].position.clone().setY( 0 ).normalize();
            var n2 = this.vertices[ v2 ].position.clone().setY( 0 ).normalize();
            var n3 = this.vertices[ v3 ].position.clone().setY( 0 ).normalize();
            var n4 = this.vertices[ v4 ].position.clone().setY( 0 ).normalize();

            var uv1 = uvs[ y ][ x ].clone();
            var uv2 = uvs[ y + 1 ][ x ].clone();
            var uv3 = uvs[ y + 1 ][ x + 1 ].clone();
            var uv4 = uvs[ y ][ x + 1 ].clone();

            this.faces.push( new THREE.Face4( v1, v2, v3, v4, [ n1, n2, n3, n4 ] ) );
            this.faceVertexUvs[ 0 ].push( [ uv1, uv2, uv3, uv4 ] );

        }

    }

    this.computeCentroids();
    this.computeFaceNormals();
    this.dynamic = true;
};
UNIVERSE.SensorProjectionGeometry.prototype = new THREE.Geometry();
UNIVERSE.SensorProjectionGeometry.prototype.constructor = UNIVERSE.SensorProjectionGeometry;


UNIVERSE.SensorProjectionGeometry.prototype.recalculateVertices = function (sensorOrigin, groundPoints)
{

    groundPoints.push(groundPoints[0]);

    this.dynamic = true;
    // Create the top points around the vehicle
    var segmentsX = groundPoints.length;
    var segmentsY = 1;
    // tack on the initial ground point back to the end of the groundpoints array
    
    var xpos, ypos, zpos, u;
    for ( x = 0; x < segmentsX; x ++ ) {
        
        u = x / segmentsX;

        xpos = sensorOrigin.x;
        ypos = sensorOrigin.y;
        zpos = sensorOrigin.z;

        this.vertices[x].position = {
            x: xpos, 
            y:ypos, 
            z:zpos
        }; 
    }

    // Now create the ground lines
    for ( x = 0; x < segmentsX; x ++ ) {
        u = x / segmentsX;

        xpos = groundPoints[x].x;
        ypos = groundPoints[x].y;
        zpos = groundPoints[x].z;

        //                console.log("updating vertice point " + ( x + segmentsX )+ " to Vertice point: " + xpos + "," + ypos + "," + zpos);
        this.vertices[x + segmentsX].position = {
            x: xpos, 
            y:ypos, 
            z:zpos
        }; 
    }

          
    this.__dirtyVertices=true;
};// SensorVisibilityLinesController.js

/**
 *
 */
var UNIVERSE = UNIVERSE || {};

UNIVERSE.SensorVisibilityLinesController = function(object, universe, earthExtensions) {
    var visibilityLinesController = new UNIVERSE.GraphicsObject(
        object.id + "_visibilityLines",
        object.objectName,
        undefined,
        function(elapsedTime) {
            if(earthExtensions.enableVisibilityLines) {
                var sensorLength = object.sensors.length;
						
                var graphicsObjects = universe.getGraphicsObjects();
                var objectsToDrawLinesTo = new Array();
                for(var i = 0; i < sensorLength; i++) {
                    var sensor = object.sensors[i];
                    for(var j in graphicsObjects) {
                        var obj = graphicsObjects[j];
                        //console.log("obj.id: " + obj.id + " obj.id: " + obj.obj + " object.modelName: " + obj.modelName);
                        //console.log("currentLocation: " + obj.currentLocation);
                        //console.log("obj: " + JSON.stringify(obj));
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
                            //var currentLocationInEci = Utilities.threeDToEciCoordinates(obj.currentLocation);
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
            earthExtensions.showAllSensorVisibilityLines(earthExtensions.enableVisibilityLines);
					
        },
        function() {
        // nothing to draw, this is a controller
        }
    )
    
    return visibilityLinesController;
}/** 
    An object to be drawn in orbit around the Earth
    @constructor
    @param {string} id - Identifier for the object to be referenced later
    @param {string} objectName - A name for the object if different than id.  Set to the id if not defined
    @param {function} propagator - A function(time) to give the object's position at a time.  No time passed in means the current Universe time
    @param {string} modelId - Identifier for the model to use that has been added to the Universe's object library
    @param {boolean} showPropagationLine - should a propagation line be shown for the object
    @param {boolean} showGroundTrackPoint - should the ground track point be shown for the object
 */

UNIVERSE.SpaceObject = function(id, objectName, modelId, propagator, showPropagationLine, showGroundTrackPoint, sensors, currentLocation, universe, earthExtensions) {
    if(!id)
    { 
        return undefined;
    }
    this.id = id;
    this.objectName = objectName || id;
    this.propagator = propagator;
    this.modelId = modelId;
    this.showPropagationLine = showPropagationLine || false;
    this.showGroundTrackPoint = showGroundTrackPoint || false;
    this.sensors = sensors || undefined;
    
    this.currentLocation = currentLocation || undefined;
        this.universe = universe || undefined;
        this.earthExtensions = earthExtensions || undefined;
};

UNIVERSE.SpaceObject.prototype = {
    constructor: UNIVERSE.SpaceObject,
    
    set: function ( id, objectName, propagator, modelId, showPropogationLine, showGroundTrackPoint, sensors, currentLocation, universe, earthExtensions) {

        this.id = id;
        this.objectName = objectName || id;
        this.propagator = propagator;
        this.modelId = modelId;
        this.showPropagationLine = showPropogationLine || false;
        this.showGroundTrackPoint = showGroundTrackPoint || false;
        this.sensors = sensors || undefined;
        this.currentLocation = currentLocation || undefined;
                this.universe = universe || undefined;
                this.earthExtensions = earthExtensions || undefined;

        return this;
    },
    
    getEci: function () {
        //var location = this.propagator();
        
        return this.currentLocation;
    },
        
        getGraphicsObject: function(material, objectGeometry, universe, earthExtensions) {

            this.universe = universe;
            this.earthExtensions = earthExtensions;
            var spaceObject = this;
            
            objectGeometry.applyMatrix( new THREE.Matrix4().setRotationFromEuler( new THREE.Vector3( -Math.PI/2, 0, 0 ) ));
            var objectModel = new THREE.Mesh(objectGeometry, material);

            var spaceGraphicsObject = new UNIVERSE.GraphicsObject(
                this.id,
                this.objectName,
                undefined,
                function(elapsedTime) {
                    // need to pass a time to the propagator
                    var propagatedLocation = spaceObject.propagator();
                    var convertedLocation = Utilities.eciTo3DCoordinates(propagatedLocation, earthExtensions);
                    if(convertedLocation) {
                        objectModel.position.set(convertedLocation.x, convertedLocation.y, convertedLocation.z);

                        //http://mrdoob.github.com/three.js/examples/misc_lookat.html
                        objectModel.lookAt(new THREE.Vector3(0,0,0));
                        this.currentLocation = propagatedLocation;
                        //console.log("currentLocation: " + spaceObject.currentLocation);
                    }
                },
                function() {
                    spaceObject.universe.draw(this.id, objectModel, false);
                    spaceObject.earthExtensions.showModelForId(spaceObject.showVehicle, this.id);
                }
            );
            return spaceGraphicsObject;
        }
};UNIVERSE.Sun = function(universe, earthExtensions) {
    var sunGraphicsObject = new UNIVERSE.GraphicsObject(
        "sun",
        "sun",
        undefined,
        function(elapsedTime) {
            //console.log("sun update");
            var sunLocation = CoordinateConversionTools.getSunPositionECIAtCurrentTime(universe.getCurrentUniverseTime());
            //console.log("sun location: " + JSON.stringify(sunLocation));
            var convertedLocation = Utilities.eciTo3DCoordinates({
                x: sunLocation.x, 
                y: sunLocation.y, 
                z: sunLocation.z
            }, earthExtensions);
            //sunLight.position.set({x: sunLocation.x, y: sunLocation.y, z: sunLocation.z});
            //console.log("sunLocation: " + JSON.stringify(sunLocation));
            universe.updateLight(convertedLocation.x, convertedLocation.y, convertedLocation.z, 1.5);
            this.currentLocation = sunLocation;
        },
        function() {
            //console.log("sun draw");
            universe.draw(this.id, undefined, false);
        }
    );
        
    return sunGraphicsObject;
};

var NearCircularPropagator = {
    
    propagateOrbit: function(kep, elapsedTime, dt, timeAtStartOfPropagation) {
        //console.log('keping it up');
        var MA = kep.getMeanAnomaly() + kep.getMeanMotion() * elapsedTime; //update the mean anomaly (deg)
        var w = MathTools.toRadians(kep.getArgOfPerigee());
        var ra = MathTools.toRadians(kep.getRaan());
        var inc = MathTools.toRadians(kep.getInclination());
        var ecc = kep.getEccentricity();
        var mu = Constants.muEarth;
        //System.out.println("elapsed time: "+elapsedTime+" dt: "+dt+" ecc: "+kep.getEccentricity());
        //console.log("MA: "+kep.getMeanAnomaly()+" meanMotion: "+kep.getMeanMotion()+" new MA: "+MA + " elapsedTime: " + elapsedTime);
        MA = MathTools.toRadians(MA);  //convert the mean anomaly to radians
        //iterate to solve for the eccentric anomaly
        var EA = MA * 0.95; //fist guess at the eccentric anomaly (rads)
        var errorThreshold = 1e-5;  //how accurately do we need to solve for the eccentric anomaly?
        for (var i = 0; i < 500; i++)
        {
            var myerror = MA - (EA - ecc * Math.sin(EA));
            if (Math.abs(myerror) > errorThreshold)
            {
                if (myerror > 0)
                {
                    EA = EA + Math.abs(MA - EA) / 2;
                }
                else
                {
                    if (myerror < 0)
                    {
                        EA = EA - Math.abs(MA - EA) / 2;
                    }
                }
            }
            else
            {
                break;
            }

        }

        var f = 2 * Math.atan(Math.sqrt((1 + ecc) / (1 - ecc)) * Math.tan(EA / 2));
        var p = kep.getSemimajorAxis() * (1 - ecc * ecc);
        var r = kep.getSemimajorAxis() * (1 - ecc* Math.cos(EA)); //radius
        var h = Math.sqrt(mu * kep.getSemimajorAxis() * (1 - ecc * ecc));
        var x = r * (Math.cos(ra) * Math.cos(w + f) - Math.sin(ra) * Math.sin(w + f) * Math.cos(inc));
        var y = r * (Math.sin(ra) * Math.cos(w + f) + Math.cos(ra) * Math.sin(w + f) * Math.cos(inc));
        var z = r * Math.sin(inc) * Math.sin(w + f);
        var xdot = ((x * h * ecc) / (r * p)) * Math.sin(f) - (h / r) * (Math.cos(ra) * Math.sin(w + f) + Math.sin(ra) * Math.cos(w + f) * Math.cos(inc));
        var ydot = ((y * h * ecc) / (r * p)) * Math.sin(f) - (h / r) * (Math.sin(ra) * Math.sin(w + f) - Math.cos(ra) * Math.cos(w + f) * Math.cos(inc));
        var zdot = ((z * h * ecc) / (r * p)) * Math.sin(f) + (h / r) * (Math.sin(inc) * Math.cos(w + f));

        //System.out.println(vehicleName+","+x+","+y+","+z+","+xdot+","+ydot+","+zdot);
        var eciState = new UNIVERSE.ECICoordinates();

        eciState.setX(x);
        eciState.setY(y);
        eciState.setZ(z);
        eciState.setVX(xdot);
        eciState.setVY(ydot);
        eciState.setVZ(zdot);
        eciState.setAX(0.0);
        eciState.setAY(0.0);
        eciState.setAZ(0.0);
        return eciState;
    }
}; 
var OrbitPropagator = {

    /**
     *
     * @param eci                      ECICoordinates
     * @param elapsedTime              double
     * @param dt                       double, time-step
     * @param timeAtStartOfPropagation Date
     *
     * @returns {UNIVERSE.ECICoordinates} 
     */
    propagateOrbit: function(eci, elapsedTime, dt, timeAtStartOfPropagation)
    {
        
        var kep = CoordinateConversionTools.convertECIToKeplerian(eci);
        //console.log('eccentricity: ' + JSON.stringify(kep.getEccentricity()));
        //timespan is in seconds
        if (elapsedTime === 0.0 || isNaN(kep.getEccentricity()))
        {
            return eci;
        }
        else if(kep.getEccentricity() <= 0.1) {
            return NearCircularPropagator.propagateOrbit(kep, elapsedTime, dt, timeAtStartOfPropagation);
        }
        else
        {
            return RungeKuttaFehlbergPropagator.propagateOrbit(eci, elapsedTime, dt, timeAtStartOfPropagation);
        }
    }
};var RungeKuttaFehlbergPropagator = {

    /**
     *
     *
     * @param state                    double[]
     * @param elapsedTime              double
     * @param dt                       double
     * @param timeAtStartOfPropagation date
     *
     * @returns Array of doubles
     */
    rungeKuttaFehlbergIntegrator: function(state, elapsedTime, dt, timeAtStartOfPropagation)
    {
        //fifth order runge-kutta-fehlberg integrator
        var tempState = state;

        var f = [];          //array of doubles[9]
        var deltaState = []; //array of doubles[9]
        var dtPrime = 0.0;            //double

        var N = 1;  //int
        var h = dt; //double

        //if the timestep is too big, reduce it to a smaller timestep and loop through the updates at the smaller timestep to add up to the total timestep
        var maxResolution = 0.02; //double

        if (dt > maxResolution)
        {
            h = maxResolution;
        }

        var newMilliseconds = timeAtStartOfPropagation.getTime(); //long

        N = elapsedTime / h;

        var j = 1;

        for (j = 1; j <= N; j++)
        {
            newMilliseconds = newMilliseconds + (h * 1000.0); //keep in millis
            var simTime = new Date(newMilliseconds);
            GST = CoordinateConversionTools.convertTimeToGMST(simTime); //double

            var k1 = []; //double[9]
            var k2 = []; //double[9]
            var k3 = []; //double[9]
            var k4 = []; //double[9]
            var k5 = []; //double[9]
            var k6 = []; //double[9]

            //for loop counter
            var i = 0;

            //build k1
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i];
            }

            dtPrime = h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k1[i] = h * f[i];
            }

            //build k2
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] + 0.25 * k1[i];
            }

            dtPrime = 0.25 * h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k2[i] = h * f[i];
            }

            //build k3
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] + (3.0 / 32.0) * k1[i] + (9.0 / 32.0) * k2[i];
            }

            dtPrime = 0.375 * h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k3[i] = h * f[i];
            }

            //build k4
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] + ((1932.0 / 2197.0) * k1[i]) -
                    ((7200.0 / 2197.0) * k2[i]) + ((7296.0 / 2197.0) * k3[i]);
            }

            dtPrime = 0.9230769230769231 * h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k4[i] = h * f[i];
            }

            //build k5
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] + ((439.0 / 216.0) * k1[i]) -
                    (8.0 * k2[i]) + ((3680.0 / 513.0) * k3[i]) - ((845.0 / 4104.0) * k4[i]);
            }

            dtPrime = h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k5[i] = h * f[i];
            }

            //build k6
            for (i = 0; i < 9; i++)
            {
                deltaState[i] = tempState[i] - ((8.0 / 27.0) * k1[i]) +
                    ((2.0) * k2[i]) - ((3544.0 / 2565.0) * k3[i]) +
                    ((1859.0 / 4104.0) * k4[i]) - ((11.0 / 40.0) * k5[i]);
            }

            dtPrime = (0.5) * h;

            f = this.generateStateUpdate(deltaState, dtPrime, GST);

            for (i = 0; i < 9; i++)
            {
                k6[i] = h * f[i];
            }

            //generate the estimate for this step in time
            for (i = 0; i < 9; i++)
            {
                //http://en.wikipedia.org/wiki/Runge%E2%80%93Kutta%E2%80%93Fehlberg_method
                tempState[i] = tempState[i] + ((16.0 / 135.0) * k1[i]) +
                    ((6656.0 / 12825.0) * k3[i]) + ((28561.0 / 56430.0) * k4[i]) -
                    ((9.0 / 50.0) * k5[i]) + ((2.0 / 55.0) * k6[i]);
            }
        }

        return tempState;
    },

    /**
     *
     *
     * @param state double[]
     * @param dt    double
     * @param GST   double
     *
     * @returns double[]
     */
    generateStateUpdate: function(state, dt, GST)
    {
        //state is 9x1
        //state structure is x,y,z,vx,vy,vz,ax,ay,az
        var stateRateOfChange = []; //double[9]
        var mu = Constants.muEarth;     //double
        var r = Math.sqrt((state[0] * state[0]) + (state[1] * state[1]) +
            (state[2] * state[2])); //double

        //figure out the rate of change of x,y,z,vx,vy,vz
        stateRateOfChange[0] = state[3]; //vx
        stateRateOfChange[1] = state[4]; //vy
        stateRateOfChange[2] = state[5]; //vz
        stateRateOfChange[3] = -mu * state[0] / (r * r * r); //ax
        stateRateOfChange[4] = -mu * state[1] / (r * r * r); //ay
        stateRateOfChange[5] = -mu * state[2] / (r * r * r); //az
        stateRateOfChange[6] = 0.0;
        stateRateOfChange[7] = 0.0;
        stateRateOfChange[8] = 0.0;
       
        return stateRateOfChange;
    },
    
    propagateOrbit: function(eci, elapsedTime, dt, timeAtStartOfPropagation)
    {
        var state = [];     //double[9]

        //establish the starting state vector;
        state[0] = eci.x;
        state[1] = eci.y;
        state[2] = eci.z;
        state[3] = eci.vx;
        state[4] = eci.vy;
        state[5] = eci.vz;
        state[6] = eci.ax;
        state[7] = eci.ay;
        state[8] = eci.az;

        //call the integrator
        var updatedState =  //double[]
            this.rungeKuttaFehlbergIntegrator(state, elapsedTime, dt, timeAtStartOfPropagation);

        //console.log("updatedState: " + JSON.stringify(updatedState));
        //translate the integrated values into the correct class structure
        var newEci = new UNIVERSE.ECICoordinates(
            updatedState[0], 
            updatedState[1], 
            updatedState[2], 
            updatedState[3], 
            updatedState[4], 
            updatedState[5], 
            updatedState[6], 
            updatedState[7], 
            updatedState[8]); //ECICoordinates
        //console.log("newEci: " + JSON.stringify(newEci));
        return newEci;
    }
};
var Constants = {

    // define variables as <var name>: <value>
    radiusEarth:    6378.1363,     //km
    muEarth:        398600.4418,   //km3/s2
    eccEarthSphere: 0.081819221456, //vallado page 141
    piOverOneEighty: 0.01745329251, // reduce number of math operations performed
    oneEightyOverPi: 57.295779513   // reduce number of math operations performed
};var CoordinateConversionTools = {

    /**
     * returns the Julian date equivalent of the date provided
     * @param {Date} currentEpoch the time to be converted
     *
     * @returns {double} julianDate julian date in days
     */
    convertCurrentEpochToJulianDate: function(currentEpoch)
    {
        //convert a date to the Julian Date
        //this is the time since January 1, 4713 BC (12:00)
        //unit of measure = days
        //console.log("convertCurrentEpochToJulianDate:currentEpoch: " + currentEpoch);
        var JD = 0;                               //double
        var year = currentEpoch.getUTCFullYear();  //int
        var month = currentEpoch.getUTCMonth() + 1;      //int
        var day = currentEpoch.getUTCDate();         //int
        var hour = currentEpoch.getUTCHours();       //int
        var minute = currentEpoch.getUTCMinutes();   //int
        var second = currentEpoch.getUTCSeconds() + (currentEpoch.getUTCMilliseconds()/1000);   //double

        // console.log("year: " + year);
        //         console.log("month: " + month);
        //         console.log("day: " + day);
        //         console.log("hour: " + hour);
        //         console.log("minute: " + minute);
        //         console.log("second: " + second);

        JD = 367 * year - Math.floor((7 * (year + Math.floor(((month + 9) / 12))) / 4)) +
        Math.floor((275 * month / 9)) + (day) + 1721013.5 +
        ((second / 60 + minute) / 60 + hour) / 24;

        return JD;
    },

    /**
     * returns the Greenwich mean sideral time for the current epoch
     * @param {Date} currentEpoch the time to be converted
     *
     * @returns {double} GST angle in degrees
     */
    convertTimeToGMST: function(currentEpoch)
    {
        var JD = this.convertCurrentEpochToJulianDate(currentEpoch); //double

        //double - julian centuries since January 1, 2000 12h UT1
        var TUT = (JD - 2451545.0) / 36525.0;

        //this is in seconds
        var GMST = 67310.54841 + (876600.0 * 3600 + 8640184.812866) * TUT +
        0.093104 * TUT * TUT - (0.0000062) * TUT * TUT * TUT;  //double

        var multiples = Math.floor(GMST / 86400.0); //double

        GMST = GMST - multiples * 86400.00;   //reduce it to be within the range of one day
        GMST = GMST / 240.0; //convert to degrees

        if (GMST < 0)
        {
            GMST = GMST + 360;
        }

        return GMST;  //degrees
    },

    /**
     * returns the Earth Centered Earth Fixed XYZ equivalent of a passed
     * lat/lon/alt coordinate. Note that the returned velocity terms in ECEF
     * are set to zero (ignores Earth's rotation)
     * @param {LLACoordinates} lla lat/lon/alt
     *
     * @returns {ECEFCoordinates} ecef Earth Centered Earth Fixed XYZ coordinates (km)
     */
    convertLLAtoECEF: function(lla)
    {
        //lat = ground station latitude (deg)
        //lon = ground station longitude (deg)
        //alt = ground station altitude (km)

        var lat = MathTools.toRadians(lla.getLatitude());  //double
        var lon = MathTools.toRadians(lla.getLongitude()); //double
        var Re = Constants.radiusEarth;          //double - radius of the earth (mean) in kilometers
        var eearth = Constants.eccEarthSphere;   //double - eccentricity of the Earth's shape
        var sinLat = Math.sin(lat);                   //double
        var hellp = lla.getAltitude();                //double - height above the elliptical earth

        //REFER TO VALLADO PAGE 144 and 150
        var cearth = Re / Math.sqrt(1 - eearth * eearth * sinLat * sinLat); //double
        var searth = Re * (1 - eearth * eearth) / 
        Math.sqrt(1 - eearth * eearth * sinLat * sinLat); //double

        var x = (cearth + hellp) * (Math.cos(lat) * Math.cos(lon)); //double
        var y = (cearth + hellp) * (Math.cos(lat) * Math.sin(lon)); //double
        var z = (searth + hellp) * (Math.sin(lat));                 //double

        var ecef = new UNIVERSE.ECEFCoordinates(x, y, z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

        return ecef;
    },

    /**
     * returns the lat/lon/alt equivalent of an Earth Centered Earth Fixed coordinate
     * @param {ECEFCoordinates} ecef Earth Centered Earth Fixed XYZ coordinates (km)
     *
     * @returns {LLACoordinates} lla lat/lon/alt
     */
    convertECEFtoLLA: function(ecef)
    {
        //lat = ground station latitude (deg)
        //lon = ground station longitude (deg)
        //alt = ground station altitude (km)

        //REFER TO VALLADO PAGE 177
        var lla = new UNIVERSE.LLACoordinates();

        var ri = ecef.getX(); //double
        var rj = ecef.getY(); //double
        var rk = ecef.getZ(); //double

        var ecc = Constants.eccEarthSphere; //double - eccentricity of the Earth's surface
        var Re = Constants.radiusEarth;     //double - radius of the earth (mean) in kilometers

        var rdelta = Math.sqrt((ri * ri) + (rj * rj));  //double
        var sinalpha = rj / rdelta;                 //double
        var cosalpha = ri / rdelta;                 //double
        var alpha = Math.atan(sinalpha / cosalpha); //double
 
        var lambda = alpha;              //double - same as the longitude
        var tandelta = rk / rdelta;      //double
        var delta = Math.atan(tandelta); //double

        var tolerance = 1e-8; //double
        var c = 0;            //double
        var lat = delta;      //double
        var latOld = 2000;    //double
        var sinLat;           //double
        var tanLat;           //double
        var count = 0;        //int

        while (Math.abs(lat - latOld) > tolerance)
        {
            latOld = lat;
            sinLat = Math.sin(latOld);
            c = Re / Math.sqrt(1 - (ecc * ecc * sinLat * sinLat));
            tanLat = (rk + c * ecc * ecc * sinLat) / rdelta;
            lat = Math.atan(tanLat);
            
            count++;

            if (count > 500)
            {
                lat = 0;
                latOld = 0;
            }
        }

        //correct the quadrants
        if (lambda < -Math.PI)
        {
            lambda = lambda + 2 * Math.PI;
        }

        if (lambda > Math.PI)
        {
            lambda = lambda - 2 * Math.PI;
        }

        lla.setLatitude(MathTools.toDegrees(lat));
        lla.setLongitude(MathTools.toDegrees(lambda));
        lla.setAltitude(rdelta / Math.cos(lat) - c);

        return lla;
    },

    /**
     * returns the Earth Centered Earth Fixed coordinate equivalent of the 
     * provided Earth Centered Inertial coordinate at a given point in time
     * represented by the Greenwich Mean Sideral Time angle
     * @param {ECICoordinates} eci Earth Centered Intertial XYZ coordinates (km)
     * @param {double} GST Greenwich Mean Sideral Time angle in degrees
     *
     * @returns {ECEFCoordinates} ecef Earth Centered Earth Fixed XYZ coordinates (km)
     */
    convertECItoECEF: function(eci, GST)
    {
        //GST is in degrees
        var ecef = new UNIVERSE.ECEFCoordinates();

        //convert the position
        eciPos = []; //Double[3];
        eciPos[0] = eci.getX();
        eciPos[1] = eci.getY();
        eciPos[2] = eci.getZ();

        var xyz = MathTools.rot3(GST, eciPos); //Double[3];
        ecef.setX(xyz[0]);
        ecef.setY(xyz[1]);
        ecef.setZ(xyz[2]);

        //convert the velocity
        var eciVel = []; //Double[3];
        eciVel[0] = eci.getVX();
        eciVel[1] = eci.getVY();
        eciVel[2] = eci.getVZ();

        xyz = MathTools.rot3(GST, eciVel);

        ecef.setVX(xyz[0]);
        ecef.setVY(xyz[1]);
        ecef.setVZ(xyz[2]);

        //convert the acceleration
        var eciAcc = []; //Double[3];
        eciAcc[0] = eci.getAX();
        eciAcc[1] = eci.getAY();
        eciAcc[2] = eci.getAZ();

        xyz = MathTools.rot3(GST, eciAcc);

        ecef.setAX(xyz[0]);
        ecef.setAY(xyz[1]);
        ecef.setAZ(xyz[2]);

        return ecef;
    },

    /**
     * returns the Earth Centered Inertial coordinate equivalent of the 
     * provided Earth Centered Earth Fixed coordinate at a given point in time
     * represented by the Greenwich Mean Sideral Time angle
     * @param {ECEFCoordinates} ecef Earth Centered Earth Fixed XYZ coordinates (km)
     * @param {double} GST Greenwich Mean Sideral Time angle in degrees
     *
     * @returns {ECICoordinates} eci Earth Centered Intertial XYZ coordinates (km)
     */
    convertECEFtoECI: function(ecef,  GST)
    {
        //GST is in degrees
        var eci = new UNIVERSE.ECICoordinates();

        //convert the position
        var eciPos = []; //Double[3];
        eciPos[0] = ecef.getX();
        eciPos[1] = ecef.getY();
        eciPos[2] = ecef.getZ();

        var xyz = MathTools.rot3(-GST, eciPos);
        eci.setX(xyz[0]);
        eci.setY(xyz[1]);
        eci.setZ(xyz[2]);

        //convert the velocity
        var eciVel = []; //Double[3];
        eciVel[0] = ecef.getVX();
        eciVel[1] = ecef.getVY();
        eciVel[2] = ecef.getVZ();

        xyz = MathTools.rot3(-GST, eciVel);

        eci.setVX(xyz[0]);
        eci.setVY(xyz[1]);
        eci.setVZ(xyz[2]);

        //convert the acceleration
        var eciAcc = []; //Double[3];
        eciAcc[0] = ecef.getAX();
        eciAcc[1] = ecef.getAY();
        eciAcc[2] = ecef.getAZ();

        xyz = MathTools.rot3(-GST, eciAcc);

        eci.setAX(xyz[0]);
        eci.setAY(xyz[1]);
        eci.setAZ(xyz[2]);

        return eci;
    },

    /**
     * returns the Lat/Lon/Alt coordinate equivalent of the 
     * provided Earth Centered Inertial coordinate at a given point in time
     * represented by the Greenwich Mean Sideral Time angle
     * @param {ECICoordinates} eci Earth Centered Intertial XYZ coordinates (km)
     * @param {double} GST Greenwich Mean Sideral Time angle in degrees
     *
     * @returns {LLACoordinates} lla lat/lon/alt
     */
    convertECItoLLA: function(eci, GST)
    {
        var ecef = this.convertECItoECEF(eci, GST); //ECEFCoordinates
        return this.convertECEFtoLLA(ecef);
    },

    /**
     * returns the Earth Centered Inertial coordinate equivalent of the 
     * provided Lat/Lon/Alt coordinate at a given point in time
     * represented by the Greenwich Mean Sideral Time angle
     * @param {LLACoordinates} lla lat/lon/alt
     * @param {double} GST Greenwich Mean Sideral Time angle in degrees
     *
     * @returns {ECICoordinates} eci Earth Centered Intertial XYZ coordinates (km)
     */
    convertLLAtoECI: function(lla, GST)
    {
        var ecef = this.convertLLAtoECEF(lla); //ECEFCoordinates
        return this.convertECEFtoECI(ecef, GST);
    },

    /**
     * Estimates a vehicle's Earth Centered Inertial coordinates and velocity based upon the
     * Keplerian orbital elements of the vehicle
     * NOTE: results only valid for eccentricities <1 (elliptical and circular orbits)
     * @param {KeplerianCoordinates} keplar Keplerian orbital elements of the vehicle
     *
     * @returns {ECICoordinates} eci Earth Centered Intertial XYZ coordinates (km)
     */
    convertKeplerianToECI: function(kepler)
    {
        var eci = new UNIVERSE.ECICoordinates();
        var a = kepler.getSemimajorAxis(); //double
        var e = kepler.getEccentricity();  //double
        var p = a * (1 - e * e);           //double
        var nu = kepler.getTrueAnomaly();  //double

        //reference vallado page 125
        var cosNu = Math.cos(MathTools.toRadians(nu)); //double
        var sinNu = Math.sin(MathTools.toRadians(nu)); //double

        //determine the position conversion;    //double
        var Xpqw = p * cosNu / (1 + e * cosNu); //double
        var Ypqw = p * sinNu / (1 + e * cosNu); //double
        var Zpqw = 0;                           //double

        var pqw = []; //Double[3];
        pqw[0] = Xpqw;
        pqw[1] = Ypqw;
        pqw[2] = Zpqw;

        var eciValues = []; //Double[3];
        eciValues = MathTools.rot3(-kepler.getArgOfPerigee(), pqw);
        eciValues = MathTools.rot1(-kepler.getInclination(), eciValues);
        eciValues = MathTools.rot3(-kepler.getRaan(), eciValues);
        eci.setX(eciValues[0]);
        eci.setY(eciValues[1]);
        eci.setZ(eciValues[2]);

        //determine the velocity conversion;                             //double
        var VXpqw = -Math.sqrt(Constants.muEarth / p) * sinNu;      //double
        var VYpqw = Math.sqrt(Constants.muEarth / p) * (e + cosNu); //double
        var VZpqw = 0;                                                   //double
        pqw[0] = VXpqw;
        pqw[1] = VYpqw;
        pqw[2] = VZpqw;
        eciValues = MathTools.rot3(-kepler.getArgOfPerigee(), pqw);
        eciValues = MathTools.rot1(-kepler.getInclination(), eciValues);
        eciValues = MathTools.rot3(-kepler.getRaan(), eciValues);
        eci.setVX(eciValues[0]);
        eci.setVY(eciValues[1]);
        eci.setVZ(eciValues[2]);

        return eci;
    },

    /**
     * Estimates a vehicle's keplerian orbital elements based upon the
     * Earth Centered Inertial coordinates and velocity of the vehicle
     * NOTE: results only valid for eccentricities <1 (elliptical and circular orbits)
     * @param {ECICoordinates} eci Earth Centered Intertial XYZ coordinates (km)
     *
     * @returns {KeplerianCoordinates} keplar Keplerian orbital elements of the vehicle
     *
     */
    convertECIToKeplerian: function(eci)
    {
        var kepler = new KeplerianCoordinates();

        /*
        if ( eci == null || typeof eci.getX === 'undefined') {
            console.log("convertECIToKeplerian received bogus eci object" + eci);
            return null;
        }
        */
        //reference Vallado 120

        var r = new THREE.Vector3(
            eci.x,
            eci.y,
            eci.z
        );
        
        var v = new THREE.Vector3(
            eci.vx,
            eci.vy,
            eci.vz
        );

        var h = new THREE.Vector3();
        h.cross(r, v); //Double[3]
        var hmag = h.length(); //double
        var rmag = r.length(); //double
        var vmag = v.length(); //double

        var khat = new THREE.Vector3(
            0.0,
            0.0,
            1.0
        );

        var n = new THREE.Vector3();
        n.cross(khat, h);
        
        var coeff1 = vmag * vmag - Constants.muEarth / rmag; //double
        var coeff2 = r.dot(v);            //double
       
        var e = new THREE.Vector3(
            (1 / Constants.muEarth) * (coeff1 * r.x - coeff2 * v.x),
            (1 / Constants.muEarth) * (coeff1 * r.y - coeff2 * v.y),
            (1 / Constants.muEarth) * (coeff1 * r.z - coeff2 * v.z)
        );
        
        var emag = e.length();                       //double
        var energy = vmag * vmag / 2 - Constants.muEarth / rmag; //double
        
        var p = 0.0; //double
        var a = 0.0; //double

        if (emag == 1.0)
        {
            a = Infinity;
            p = hmag * hmag / Constants.muEarth;
        }
        else
        {
            a = -Constants.muEarth / (2 * energy);
            p = a * (1 - emag * emag);
        }

        var inc = MathTools.toDegrees(Math.acos(h.z / hmag));                    //double
        var raan = MathTools.toDegrees(Math.acos(n.x / n.length())); //double

        if (n.y < 0)
        {
            raan = 360 - raan;
        }
        
        
        var arg = MathTools.toDegrees(Math.acos(n.dot(e) /
            (n.length() * emag)));  //double

        if (e.z < 0)
        {
            arg = 360 - arg;
        }
        
        // console.log("MathTools.dotMultiplyVector(e, r) / (emag * rmag): " + MathTools.dotMultiplyVector(e, r) / (emag * rmag) )
        // console.log("Math.acos(MathTools.dotMultiplyVector(e, r) / (emag * rmag)): " + Math.acos(MathTools.dotMultiplyVector(e, r) / (emag * rmag)));
        
        var value = e.dot(r) / (emag * rmag);
        if(value > 1) {
            // console.log("setting to 1");
            value = 1;
        }
        var nu = MathTools.toDegrees(Math.acos(value)); //double
        // console.log("nu: " + nu);
        if (v.dot(r) < 0)
        {
            nu = 360 - nu;
        }

        if(isNaN(raan))
        {
            raan = 0.00001;
        }

        if(isNaN(arg))
        {
            arg = 0.00001;
        }
        
        
        kepler.setSemimajorAxis(a);
        kepler.setEccentricity(emag);
        kepler.setTrueAnomaly(nu);
        kepler.setRaan(raan);
        kepler.setInclination(inc);
        kepler.setMeanMotion(MathTools.toDegrees(Math.sqrt(Constants.muEarth / (a * a * a))));
        kepler.setArgOfPerigee(arg);
        
        //figure out the mean anomaly
        var sinNu = Math.sin(MathTools.toRadians(nu));
        var cosNu = Math.cos(MathTools.toRadians(nu));
        var sinEA = ((sinNu * Math.sqrt(1 - emag * emag)) / (1 + emag * cosNu));
        var cosEA = ((emag + cosNu) / (1 + emag * cosNu));
        var EA = Math.atan2(sinEA, cosEA);
        var MA = EA - emag * sinEA;
        MA = MathTools.toDegrees(MA);
        kepler.setMeanAnomaly(MA);

        return kepler;
    },

    /**
     * returns the rotation matrix (3x3) used to convert an Earth Centered Inertial
     * coordinate to a satellites's Radial, Along Track, Cross Track coordinates 
     * relative to the satellite's center
     * @param {satellite} SimulationObject
     *
     * @returns {double[][]} rotationMatrix (unitless)
     */
    buildRotationMatrixToConvertECItoRSW: function(satellite)
    {
        var satelliteKepler = CoordinateConversionTools.convertECIToKeplerian(satellite.getEci()); //KeplerianCoords

        var nu = satelliteKepler.getTrueAnomaly();  //double
        var w = satelliteKepler.getArgOfPerigee();  //double
        var inc = satelliteKepler.getInclination(); //double
        var raan = satelliteKepler.getRaan();       //double

        var netRotationMatrix = new Array(3);

        var i = 0;
        for(i = 0; i < 3; i++) //create as Double[3][3];
        {
            netRotationMatrix[i] = new Array(3);
        }

        netRotationMatrix = MathTools.buildRotationMatrix3(raan);
        netRotationMatrix = MathTools.multiply2dBy2d(MathTools.buildRotationMatrix1(inc), netRotationMatrix);
        netRotationMatrix = MathTools.multiply2dBy2d(MathTools.buildRotationMatrix3(w), netRotationMatrix);
        netRotationMatrix = MathTools.multiply2dBy2d(MathTools.buildRotationMatrix3(nu), netRotationMatrix);

        return netRotationMatrix;
    },

    /**
     * returns the Radial, Along Track, Cross Track coordinate equivalent of a 
     * provided Earth Centered Inertial coordinate relative to the satellite's center
     * @param satellite SimulationObject
     * @param {ECICoordinates} targetECI Earth Centered Intertial XYZ coordinates of the target object/point(km)
     *
     * @returns {RSWcoordinates} rsw RSW equivalent point (km)
     *
     */
    convertTargetECIToSatelliteRSW: function(satellite, targetECI)
    {
        var rsw = new RSWcoordinates();
        var satelliteKepler = CoordinateConversionTools.convertECIToKeplerian(satellite.getEci()); //KeplerianCoordinates
        var satelliteECI = satellite.getEci();       //ECICoordinates

        var nu = satelliteKepler.getTrueAnomaly();  //double
        var w = satelliteKepler.getArgOfPerigee();  //double
        var inc = satelliteKepler.getInclination(); //double
        var raan = satelliteKepler.getRaan();       //double

        var rijk = []; //Double[3];
        rijk[0] = targetECI.getX() - satelliteECI.getX();
        rijk[1] = targetECI.getY() - satelliteECI.getY();
        rijk[2] = targetECI.getZ() - satelliteECI.getZ();

        rijk = MathTools.rot3(raan, rijk);
        rijk = MathTools.rot1(inc, rijk);
        rijk = MathTools.rot3(w, rijk);
        rijk = MathTools.rot3(nu, rijk);

        rsw.setRadial(rijk[0]);
        rsw.setAlongTrack(rijk[1]);
        rsw.setCrossTrack(rijk[2]);

        return rsw;
    },

    /**
     * returns the Earth Centered Inertial coordinate equivalent of a provided 
     * Radial, Along Track, Cross Track coordinate relative to the satellite's center
     * @param satellite SimulationObject
     * @param {RSWcoordinates} rsw RSW point in question (km)
     *
     * @returns {ECICoordinates} eci Earth Centered Intertial equivalent point (km)
     */
    convertRSWToECI: function(satellite, rsw)
    {
        var eci = new UNIVERSE.ECICoordinates();
        var satelliteKepler = CoordinateConversionTools.convertECIToKeplerian(satellite.getEci());

        var nu = satelliteKepler.getTrueAnomaly();
        var w = satelliteKepler.getArgOfPerigee();
        var inc = satelliteKepler.getInclination();
        var raan = satelliteKepler.getRaan();

        var rswVec = [];        //Double[3];
        rswVec[0] = rsw.radial;
        rswVec[1] = rsw.alongTrack;
        rswVec[2] = rsw.crossTrack;

        var rijk = [];              //Double[3];
        rijk = MathTools.rot3(-nu, rswVec);  //to PQW format
        rijk = MathTools.rot3(-w, rijk);
        rijk = MathTools.rot1(-inc, rijk);
        rijk = MathTools.rot3(-raan, rijk);

        eci.setX(rijk[0]);
        eci.setY(rijk[1]);
        eci.setZ(rijk[2]);

        return eci;
    },

    /**
     * returns the position of the sun in Earth Centered Inertial coordinates
     * at the indicated time
     * @param {Date} currentEpoch the time in question
     *
     * @returns {ECICoordinates} eci Earth Centered Intertial XYZ coordinates (km)
     */
    getSunPositionECIAtCurrentTime: function(currentEpoch)
    {
        //ref Vallado 266
        var JD = this.convertCurrentEpochToJulianDate(currentEpoch);

        //julian centuries since January 1, 2000 12h UT1
        var TUT = (JD - 2451545.0) / 36525.0;
        var lambdaSun = 280.4606184 + 36000.77005361 * TUT;  //solar angle (deg)
        var Msun = 357.5277233 + 35999.05034 * TUT;
        var lambdaEcliptic = lambdaSun + 1.914666471 *
        Math.sin(MathTools.toRadians(Msun)) + 0.019994643 *
        Math.sin(2 * MathTools.toRadians(Msun));//ecliptic angle (deg)

        //distance of the sun in AU
        var rsun = 1.000140612 - 0.016708617 * Math.cos(MathTools.toRadians(Msun)) -
        0.000139589 * Math.cos(2 * MathTools.toRadians(Msun));
        var e = 23.439291 - 0.0130042 * TUT;  //ecliptic latitude on the earth

        var AU = 149597870.0;  //one astronomical unit (km)
        var sunPosition = new UNIVERSE.ECICoordinates();

        sunPosition.setX(rsun * Math.cos(MathTools.toRadians(lambdaEcliptic)) * AU);
        sunPosition.setY(rsun * Math.cos(MathTools.toRadians(e)) *
            Math.sin(MathTools.toRadians(lambdaEcliptic)) * AU);
        sunPosition.setZ(rsun * Math.sin(MathTools.toRadians(e)) *
            Math.sin(MathTools.toRadians(lambdaEcliptic)) * AU);

        return sunPosition;
    },

    /**
     * returns the Barycentric time equivalent of the provided time
     * at the indicated time
     * NOTE: accurate on the order of 100 km
     * @param {Date} currentEpoch the time in question
     *
     * @returns {double} BT Barycentric time equivalent (days)
     */
    convertCurrentEpochToBarycentricTime: function(currentEpoch)
    {
        //reference Vallado 3rd edition page 201
        var UTC = new Date(currentEpoch);
        
        //var newSeconds = (int) (UTC.getSeconds() - 0.463326);
        var UTI = new Date(UTC.getTime() - 463);
        //console.log("UTI: " + UTI)
        
        //Date UTI = new Date(UTC.getYear(), UTC.getMonth(), UTC.getDate(), UTC.getHours(), UTC.getMinutes(), newSeconds);
        //newSeconds = (int) (UTI.getSeconds() + 32);
        var TAI = new Date(UTI.getTime() + 32000);
        //Date TAI = new Date(UTI.getYear(), UTI.getMonth(), UTI.getDate(), UTI.getHours(), UTI.getMinutes(), newSeconds);

        var TT = new Date(TAI.getTime() + 32184);
        //newSeconds = (int) (TAI.getSeconds() + 32.184);
        //Date TT = new Date(TAI.getYear(), TAI.getMonth(), TAI.getDate(), TAI.getHours(), TAI.getMinutes(), newSeconds);
        
        //console.log("TT: " + TT);
        var JDtt = this.convertCurrentEpochToJulianDate(TT);
        var Ttt = (JDtt - 2451545.0) / 36525.0;
        //console.log("JDtt: " + JDtt);
        //newSeconds = (int) (TT.getSeconds() + 0.001658 * Math.sin(628.3076 * Ttt + 6.2401));  //note, higher order terms are available
        //console.log("equation: " + (0.001658 * Math.sin(628.3076 * Ttt + 6.2401)) * 1000)
        var TDB = new Date(TT.getTime() + ((0.001658 * Math.sin(628.3076 * Ttt + 6.2401)) * 1000));
        //Date TDB = new Date(TT.getYear(), TT.getMonth(), TT.getDate(), TT.getHours(), TT.getMinutes(), newSeconds);
        //console.log("TDB: " + TDB);
        var JDtdb = this.convertCurrentEpochToJulianDate(TDB);
        var Ttdb = (JDtdb - 2451545.0) / 36525.0;  //julian centuries since January 1, 2000 12h UT1  //this is the terrestrial time


        //*******************************
        //note, this may have issues due to the fact that the date objects don't use fractions of seconds
        //*******************************

        return Ttdb;
    },

    /**
     * returns the position of the moon in Earth Centered Inertial coordinates
     * at the indicated time
     * NOTE: accurate on the order of 100 km
     * @param {Date} currentEpoch the time in question
     *
     * @returns {ECICoordinates} eci Earth Centered Intertial XYZ coordinates (km)
     */
    getMoonPositionECIAtCurrentTime: function(currentEpoch)
    {
        //console.log("currentEpoch: " + currentEpoch);
        //reference Vallado 3rd ed page 291
        var Ttdb = CoordinateConversionTools.convertCurrentEpochToBarycentricTime(currentEpoch);
        //console.log("Ttdb: " + Ttdb);
        var lambda = 218.32 + 481267.8813 * Ttdb;
        lambda += 6.29 * Math.sin(MathTools.toRadians(134.9 + 477198.85 * Ttdb));
        lambda += -1.27 * Math.sin(MathTools.toRadians(259.2 - 413335.38 * Ttdb));
        lambda += 0.66 * Math.sin(MathTools.toRadians(235.7 + 890534.23 * Ttdb));
        lambda += 0.21 * Math.sin(MathTools.toRadians(269.9 + 954397.70 * Ttdb));
        lambda += -0.19 * Math.sin(MathTools.toRadians(357.5 + 35999.05 * Ttdb));
        lambda += -0.11 * Math.sin(MathTools.toRadians(186.6 + 966404.05 * Ttdb));  //degrees
        if (Math.abs(lambda) > 360)
        {
            lambda = (lambda % 360);
        }
        if (lambda < 0)
        {
            lambda += 360;
        }

        
        var phi = 5.13 * Math.sin(MathTools.toRadians(93.3 + 483202.03 * Ttdb));
        phi += 0.28 * Math.sin(MathTools.toRadians(228.2 + 960400.87 * Ttdb));
        phi += -0.28 * Math.sin(MathTools.toRadians(318.3 + 6003.18 * Ttdb));
        phi += -0.17 * Math.sin(MathTools.toRadians(217.6 - 407332.20 * Ttdb));
        if (Math.abs(phi) > 360)
        {
            phi = (phi % 360);
        }
        if (phi < 0)
        {
            phi += 360;
        }
        
        

        var parallax = 0.9508 + 0.0518 * Math.cos(MathTools.toRadians(134.9 + 477198.85 * Ttdb));
        parallax += +0.0095 * Math.cos(MathTools.toRadians(259.2 - 413335.38 * Ttdb));
        parallax += +0.0078 * Math.cos(MathTools.toRadians(235.7 + 890534.23 * Ttdb));
        parallax += +0.0028 * Math.cos(MathTools.toRadians(269.9 + 954397.70 * Ttdb));
        if (Math.abs(parallax) > 360)
        {
            parallax = (parallax % 360);
        }
        if (parallax < 0)
        {
            parallax += 360;
        }

        var e=23.439291-0.0130042*Ttdb;//obliquity of the ecliptic
        var rMoon=1/Math.sin(MathTools.toRadians(parallax));//earth radii
        rMoon=rMoon*Constants.radiusEarth;//km

        // console.log("lambda: " + lambda);
        // console.log("phi: " + phi);
        // console.log("parallax: " + parallax);
        e=MathTools.toRadians(e);
        phi=MathTools.toRadians(phi);
        lambda=MathTools.toRadians(lambda);


        moonPosition=new UNIVERSE.ECICoordinates();
        moonPosition.setX(rMoon*Math.cos(phi)*Math.cos(lambda));
        moonPosition.setY(rMoon*(Math.cos(e)*Math.cos(phi)*Math.sin(lambda)-Math.sin(e)*Math.sin(phi)));
        moonPosition.setZ(rMoon*(Math.sin(e)*Math.cos(phi)*Math.sin(lambda)+Math.cos(e)*Math.sin(phi)));
        return moonPosition;
    }

};
var CoordinateFunctionHelper = {

    /**
     * Uses a true anomoly to update the eccentric anomoly and mean anomoly.
     */
    updateKeplerianAnglesUsingTrueAnomaly: function(keplerianCoords)
    {
        var nu = MathTools.toRadians(trueAnomaly);
        var sinEA = Math.sin(nu) * Math.sqrt(1 - keplerianCoords.eccentricity * keplerianCoords.eccentricity) /
            (1 + keplerianCoords.eccentricity * Math.cos(nu));
        var cosEA = (keplerianCoords.eccentricity + Math.cos(nu)) /
            (1 + keplerianCoords.eccentricity * Math.cos(nu));

        keplerianCoords.eccentricAnomaly = MathTools.toDegrees(Math.atan2(sinEA, cosEA));
        keplerianCoords.meanAnomaly = MathTools.toDegrees(MathTools.toRadians(keplerianCoords.eccentricAnomaly) -
            keplerianCoords.eccentricity * sinEA);
    },

    /**
     * Sets a new true anomoly and updates the eccentric and mean anomoly vals.
     */
    setKeplerianTrueAnomaly: function(keplerianCoords, newTrueAnomaly)
    {
        keplerianCoords.trueAnomaly = newTrueAnomaly;
        updateAnglesUsingTrueAnomaly(keplerianCoords);
    }
};var UNIVERSE = UNIVERSE || {};

UNIVERSE.ECEFCoordinates = function(xVal, yVal, zVal, vxVal, vyVal, vzVal, axVal, ayVal, azVal)  {

    // define variables as <var name>: <value>

    this.x = xVal ? xVal : 0.0; //km
    this.y =  yVal ? yVal : 0.0; //km
    this.z =  zVal ? zVal : 0.0; //km
    this.vx = vxVal ? vxVal : 0.0; //km
    this.vy = vyVal ? vyVal : 0.0; //km
    this.vz = vzVal ? vzVal : 0.0; //km
    this.ax = axVal ? axVal : 0.0; //km
    this.ay = ayVal ? ayVal : 0.0; //km
    this.az = azVal ? azVal : 0.0; //km

   /**
     * Get the X value.
     */
    this.getX = function()
    {
        return this.x;
    };

    /**
     * Set the X value.
     */
    this.setX = function(newX)
    {
        this.x = newX;
    };

    /**
     * Get the Y value.
     */
    this.getY = function()
    {
        return this.y;
    };

    /**
     * Set the Y value.
     */
    this.setY = function(newY)
    {
        this.y = newY;
    };

    /**
     * Get the Z value.
     */
    this.getZ = function()
    {
        return this.z;
    };

    /**
     * Set the Z value.
     */
    this.setZ = function(newZ)
    {
        this.z = newZ;
    };

   /**
     * Get the VX value.
     */
    this.getVX = function()
    {
        return this.vx;
    };

    /**
     * Set the VX value.
     */
    this.setVX = function(newVX)
    {
        this.vx = newVX;
    };

    /**
     * Get the VY value.
     */
    this.getVY = function()
    {
        return this.vy;
    };

    /**
     * Set the VY value.
     */
    this.setVY = function(newVY)
    {
        this.vy = newVY;
    };

    /**
     * Get the VZ value.
     */
    this.getVZ = function()
    {
        return this.vz;
    };

    /**
     * Set the VZ value.
     */
    this.setVZ = function(newVZ)
    {
        this.vz = newVZ;
    };

    /**
     * Get the AX value.
     */
    this.getAX = function()
    {
        return this.ax;
    };

    /**
     * Set the AX value.
     */
    this.setAX = function(newAX)
    {
        this.ax = newAX;
    };

    /**
     * Get the AY value.
     */
    this.getAY = function()
    {
        return this.ay;
    };

    /**
     * Set the AY value.
     */
    this.setAY = function(newAY)
    {
        this.ay = newAY;
    };

    /**
     * Get the AZ value.
     */
    this.getAZ = function()
    {
        return this.az;
    };

    /**
     * Set the AZ value.
     */
    this.setAZ = function(newAZ)
    {
        this.az = newAZ;
    };
};var UNIVERSE = UNIVERSE || {};

UNIVERSE.ECICoordinates = function(xVal, yVal, zVal, vxVal, vyVal, vzVal, axVal, ayVal, azVal) {
    
    // define variables as <var name>: <value>

    this.x = xVal ? xVal : 0.0; //km
    this.y =  yVal ? yVal : 0.0; //km
    this.z =  zVal ? zVal : 0.0; //km
    this.vx = vxVal ? vxVal : 0.0; //km
    this.vy = vyVal ? vyVal : 0.0; //km
    this.vz = vzVal ? vzVal : 0.0; //km
    this.ax = axVal ? axVal : 0.0; //km
    this.ay = ayVal ? ayVal : 0.0; //km
    this.az = azVal ? azVal : 0.0; //km
};

UNIVERSE.ECICoordinates.prototype = {
    constructor: UNIVERSE.ECICoordinates,
    
    /**
     * Get the X value.
     */
    getX: function()
    {
        return this.x;
    },

    /**
     * Set the X value.
     */
    setX : function(newX)
    {
        this.x = newX;
    },

    /**
     * Get the Y value.
     */
    getY : function()
    {
        return this.y;
    },

    /**
     * Set the Y value.
     */
    setY : function(newY)
    {
        this.y = newY;
    },

    /**
     * Get the Z value.
     */
    getZ : function()
    {
        return this.z;
    },

    /**
     * Set the Z value.
     */
    setZ : function(newZ)
    {
        this.z = newZ;
    },

   /**
     * Get the VX value.
     */
    getVX : function()
    {
        return this.vx;
    },

    /**
     * Set the VX value.
     */
    setVX : function(newVX)
    {
        this.vx = newVX;
    },

    /**
     * Get the VY value.
     */
    getVY : function()
    {
        return this.vy;
    },

    /**
     * Set the VY value.
     */
    setVY : function(newVY)
    {
        this.vy = newVY;
    },

    /**
     * Get the VZ value.
     */
    getVZ : function()
    {
        return this.vz;
    },

    /**
     * Set the VZ value.
     */
    setVZ : function(newVZ)
    {
        this.vz = newVZ;
    },

    /**
     * Get the AX value.
     */
    getAX : function()
    {
        return this.ax;
    },

    /**
     * Set the AX value.
     */
    setAX : function(newAX)
    {
        this.ax = newAX;
    },

    /**
     * Get the AY value.
     */
    getAY : function()
    {
        return this.ay;
    },

    /**
     * Set the AY value.
     */
    setAY : function(newAY)
    {
        this.ay = newAY;
    },

    /**
     * Get the AZ value.
     */
    getAZ : function()
    {
        return this.az;
    },

    /**
     * Set the AZ value.
     */
    setAZ : function(newAZ)
    {
        this.az = newAZ;
    }
};function KeplerianCoordinates(theSemimajorAxis, theMeanAnomaly, theEccentricAnomaly, theTrueAnomaly, theInclination, theEccentricity, theRaan, theArgOfPerigee, theMeanMotion) {

    this.semimajorAxis = theSemimajorAxis ? theSemimajorAxis : 0.0; //km
    this.meanAnomaly = theMeanAnomaly ? theMeanAnomaly : 0.0;
    this.eccentricAnomaly = theMeanAnomaly ? theMeanAnomaly : 0.0;
    this.trueAnomaly = theTrueAnomaly ? theTrueAnomaly : 0.0;
    this.inclination = theInclination ? theInclination : 0.0; //deg
    this.eccentricity = theEccentricity ? theEccentricity : 0.0; //unitless
    this.raan = theRaan ? theRaan : 0.0; //deg
    this.argOfPerigee = theArgOfPerigee ? theArgOfPerigee : 0.0; //deg
    this.meanMotion = theMeanMotion ? theMeanMotion : 0.0; //deg/sec
    
    this.updateAnglesUsingTrueAnomaly =function()
    {
        /*
        double nu=Math.toRadians(this.TrueAnomaly);
        double sinEA=Math.sin(nu)*Math.sqrt(1-this.eccentricity*this.eccentricity)/(1+this.eccentricity*Math.cos(nu));
        double cosEA=(this.eccentricity+Math.cos(nu))/(1+this.eccentricity*Math.cos(nu));
        this.EccentricAnomaly=Math.toDegrees(Math.atan2(sinEA,cosEA));
        this.MeanAnomaly = Math.toDegrees(Math.toRadians(this.EccentricAnomaly) - this.eccentricity * sinEA);
        */
       var nu=MathTools.toRadians(this.trueAnomaly);
       var sinEA=Math.sin(nu)*Math.sqrt(1-this.eccentricity*this.eccentricity)/(1+this.eccentricity*Math.cos(nu));
       var cosEA=(this.eccentricity+Math.cos(nu))/(1+this.eccentricity*Math.cos(nu));
       this.EccentricAnomaly=MathTools.toDegrees(Math.atan2(sinEA,cosEA));
       this.MeanAnomaly = MathTools.toDegrees(MathTools.toRadians(this.EccentricAnomaly) - this.eccentricity * sinEA);
    };
    
    this.updateAnglesUsingMeanAnomaly= function()
    {
        /*
        //reference vallado 2nd ed page 74 (example 2-1)
        double requiredResolutionDeg=0.00001;//deg
        double currentError=5000.00;//deg
        double M=Math.toRadians(this.MeanAnomaly);//mean anomaly in radians
        double Eprevious=M-this.eccentricity;
        double Enew=0.0;
        int count=0;
        while(currentError>requiredResolutionDeg){
            Enew=Eprevious+(M-Eprevious+this.eccentricity*Math.sin(Eprevious))/(1-this.eccentricity*Math.cos(Eprevious));
            currentError=Math.abs(Enew-Eprevious);
            count++;
            if(count>100){
                break;
            }
            Eprevious=Enew;
        }
        this.EccentricAnomaly=Math.toDegrees(Enew);
        this.TrueAnomaly=Math.toDegrees(2*Math.atan(Math.sqrt((1+this.eccentricity)/(1-this.eccentricity))*Math.tan(Enew/2)));
        //System.out.println("Mean Anomaly: "+this.MeanAnomaly);
        //System.out.println("Ecc Anomaly: "+this.EccentricAnomaly);
        //System.out.println("True Anomaly: "+this.TrueAnomaly);
        */
       
        var requiredResolutionDeg=0.00001;//deg
        var currentError=5000.00;//deg
        var M=MathTools.toRadians(this.MeanAnomaly);//mean anomaly in radians
        var Eprevious=M-this.eccentricity;
        var Enew=0.0;
        var count=0;
        while(currentError>requiredResolutionDeg){
            Enew=Eprevious+(M-Eprevious+this.eccentricity*Math.sin(Eprevious))/(1-this.eccentricity*Math.cos(Eprevious));
            currentError=Math.abs(Enew-Eprevious);
            count++;
            if(count>100){
                break;
            }
            Eprevious=Enew;
        }
        this.EccentricAnomaly=MathTools.toDegrees(Enew);
        this.TrueAnomaly=MathTools.toDegrees(2*Math.atan(Math.sqrt((1+this.eccentricity)/(1-this.eccentricity))*Math.tan(Enew/2)));
        
    };
    
    
    
    this.getSemimajorAxis = function()
    {
        return this.semimajorAxis;
    };
    
    this.getMeanAnomaly = function()
    {
        return this.meanAnomaly;
    };

    this.getEccentricAnomaly = function()
    {
        return this.eccentricAnomaly;
    };
    
    this.getTrueAnomaly = function()
    {
        return this.trueAnomaly;
    };

    this.getInclination = function()
    {
        return this.inclination;
    };
    
    this.getEccentricity = function()
    {
        return this.eccentricity;
    };
    
    this.getRaan = function() {
        return this.raan;
    };
    
    this.getArgOfPerigee = function() {
        return this.argOfPerigee;
    };
    
    this.getMeanMotion = function() {
        return this.meanMotion;
    };

    // setters
    this.setSemimajorAxis = function(theSemimajorAxis)
    {
         this.semimajorAxis = theSemimajorAxis;
    };
    
    this.setMeanAnomaly = function(theMeanAnomaly)
    {
         this.meanAnomaly = theMeanAnomaly;
         this.updateAnglesUsingMeanAnomaly();
    };
    
    this.setEccentricAnomaly = function(theEccentricAnomaly)
    {
         this.eccentricAnomaly = theEccentricAnomaly;
    };
    
    this.setTrueAnomaly = function(theTrueAnomaly)
    {
         this.trueAnomaly = theTrueAnomaly;
         this.updateAnglesUsingTrueAnomaly();
    };

    this.setInclination = function(theInclination)
    {
         this.inclination = theInclination;
    };
    
    this.setEccentricity = function(theEccentricity)
    {
         this.eccentricity = theEccentricity;
    };
    
    this.setRaan = function(theRaan) {
         this.raan = theRaan;
    };
    
    this.setArgOfPerigee = function(theArgOfPerigee) {
         this.argOfPerigee = theArgOfPerigee;
    };
    
    this.setMeanMotion = function(theMeanMotion) {
         this.meanMotion = theMeanMotion;
    };
}var UNIVERSE = UNIVERSE || {};

UNIVERSE.LLACoordinates = function(lat, lon, alt) {

    // define variables as <var name>: <value>

    this.latitude =  lat ? lat : 0.0; //deg
    this.longitude = lon ? lon : 0.0; //deg
    this.altitude =  alt ? alt : 0.0;  //km

    /**
     * Returns the altitude value.
     */
    this.getAltitude = function()
    {
        return this.altitude;
    };

    /**
     * Sets a new altitude value.
     */
    this.setAltitude = function(newAltitude)
    {
        this.altitude = newAltitude;
    };

    /**
     * Returns the latitude value.
     */
    this.getLatitude = function()
    {
        return this.latitude;
    };

    /**
     * Sets a new latitude value.
     */
    this.setLatitude = function(newLatitude)
    {
        this.latitude = newLatitude;
    };

    /**
     * Returns the longitude value.
     */
    this.getLongitude = function()
    {
        return this.longitude;
    };

    /**
     * Sets a new longitude value.
     */
    this.setLongitude = function(setLongitude)
    {
        this.longitude = setLongitude;
    };
};
var MathTools = {
    
    /**
     * returns the angle between two vectors
     * @param {vector} x (unitless)
     * @param {vector} y (unitless)
     *
     * @returns {Number} angle
     */
    angleBetweenTwoVectorsVector: function(x, y)
    {
        var angle = 0;                 //double
        var magX = x.length();       //double
        var magY = y.length();       //double
        var xDotY = x.dot(y); //double

        angle = MathTools.toDegrees(Math.acos(xDotY / (magX * magY)));

        if (angle > 90)
        {
            angle = 180 - angle;
        }

        return angle; //deg
    },

    /**
     * rotates vector 'vec' about the x-axis by 'x' degrees
     * @param {Number} x (degrees)
     * @param {Double[]} vec (an array of length 3, assumed to be x,y,z values)
     *
     * @returns {Double[]} result (3x1)
     */
    rot1: function(x, vec)
    {
        x = MathTools.toRadians(x);

        var result = []; //Double[3];
        result[0] = vec[0];
        result[1] = Math.cos(x) * vec[1] + Math.sin(x) * vec[2];
        result[2] = -Math.sin(x) * vec[1] + Math.cos(x) * vec[2];

        return result;
    },

    /**
     * rotates vector 'vec' about the y-axis by 'x' degrees
     * @param {Number} x (degrees)
     * @param {Double[]} vec (an array of length 3, assumed to be x,y,z values)
     *
     * @returns {Double[]} result (3x1)
     */
    rot2: function(x, vec)
    {
        x = MathTools.toRadians(x);
        
        var result = []; //Double[3];

        result[0] = Math.cos(x) * vec[0] - Math.sin(x) * vec[2];
        result[1] = vec[1];
        result[2] = Math.sin(x) * vec[0] + Math.cos(x) * vec[2];

        return result;
    },

    /**
     * rotates vector 'vec' about the z-axis by 'x' degrees
     * @param {Number} x (degrees)
     * @param {Double[]} vec (an array of length 3, assumed to be x,y,z values)
     *
     * @returns {Double[]} result (3x1)
     */
    rot3: function(x, vec)
    {
        x = MathTools.toRadians(x);

        var result = []; //Double[3];

        result[0] = Math.cos(x) * vec[0] + Math.sin(x) * vec[1];
        result[1] = -Math.sin(x) * vec[0] + Math.cos(x) * vec[1];
        result[2] = vec[2];

        return result;
    },

    /**
     * returns the radian equivalent of an angle provided in degrees
     * @param {Number} valueInDegrees 
     *
     * @returns {Number} valueInRadians
     */
    toRadians: function(valueInDegrees)
    {
        // return valueInDegrees * Math.PI / 180.0;
            return valueInDegrees * Constants.piOverOneEighty;
    },

    /**
     * returns the degree equivalent of an angle provided in radians
     * @param {Number} valueInRadians 
     *
     * @returns {Number} valueInDegrees
     */
    toDegrees: function(valueInRadians)
    {
        //return valueInRadians * 180 / Math.PI;
          return valueInRadians * Constants.oneEightyOverPi;
    },

    /**
     * returns the 3x3 rotation matrix that is used to rotate a vector
     * about the x-axis by 'x' degrees
     * @param {Number} x (degrees)
     *
     * @returns {Number[][]} rotationMatrix  (3x3)
     */
    buildRotationMatrix1: function(x)
    {
        x = MathTools.toRadians(x);
        var result = []; //Double[3][3];

        var i = 0;
        for(i = 0; i < 3; i++)
        {
           result[i] = [];
        }

        result[0][0] = 1.0;
        result[0][1] = 0.0;
        result[0][2] = 0.0;
        result[1][0] = 0.0;
        result[1][1] = Math.cos(x);
        result[1][2] = -Math.sin(x);
        result[2][0] = 0.0;
        result[2][1] = Math.sin(x);
        result[2][2] = Math.cos(x);

        return result;
    },

    /**
     * returns the 3x3 rotation matrix that is used to rotate a vector
     * about the y-axis by 'x' degrees
     * @param {Number} x (degrees)
     *
     * @returns {Number[][]} rotationMatrix  (3x3)
     */
    buildRotationMatrix2: function(x)
    {
        x = MathTools.toRadians(x);
        var result = []; //Double[3][3];

        var i = 0;
        for(i = 0; i < 3; i++)
        {
           result[i] = [];
        }

        result[0][0] = Math.cos(x);
        result[0][1] = 0.0;
        result[0][2] = Math.sin(x);
        result[1][0] = 0.0;
        result[1][1] = 1.0;
        result[1][2] = 0.0;
        result[2][0] = -Math.sin(x);
        result[2][1] = 0.0;
        result[2][2] = Math.cos(x);

        return result;
    },

    /**
     * returns the 3x3 rotation matrix that is used to rotate a vector
     * about the z-axis by 'x' degrees
     * @param {Number} x (degrees)
     *
     * @returns {Number[][]} rotationMatrix  (3x3)
     */
    buildRotationMatrix3: function(x)
    {
        x = MathTools.toRadians(x);
        var result = []; //Double[3][3];

        var i = 0;
        for(i = 0; i < 3; i++)
        {
           result[i] = [];
        }

        result[0][0] = Math.cos(x);
        result[0][1] = -Math.sin(x);
        result[0][2] = 0.0;
        result[1][0] = Math.sin(x);
        result[1][1] = Math.cos(x);
        result[1][2] = 0.0;
        result[2][0] = 0.0;
        result[2][1] = 0.0;
        result[2][2] = 1.0;

        return result;
    },

    /**
     * returns an identity matrix (a matrix of all zeros with ones on the diagonals)
     * of size (NxN)
     * @param {int} N size of the desired identity matrix (NxN)
     *
     * @returns {Number[][]} identityMatrix (size NxN)
     */
    ones: function(N)
    {
        var x = []; //Double[N][N];

        var i = 0;
        var j = 0;

        for(i = 0; i < N; i++)
        {
           result[i] = new Array(N);
        }

        for (i = 0; i < N; i++)
        {
            for (j = 0; j < N; j++)
            {
                if (i != j)
                {
                    x[i][j] = 0.0;
                }
                else
                {
                    x[i][j] = 1.0;
                }
            }
        }

        return x;
    },

   /**
     * returns a matrix full of zeros (no null values) of size (NxN)
     * @param {int} N size of the desired matrix (NxN)
     *
     * @returns {Number[][]} zerosMatrix (size NxN)
     */
    zeros: function(N)
    {
        var x = new Array(N); //Double[3][3];

        var i = 0;
        var j = 0;

        for(i = 0; i < N; i++)
        {
           result[i] = new Array(N);
        }

        for (i = 0; i < N; i++)
        {
            for (j = 0; j < N; j++)
            {
                x[i][j] = 0.0;
            }
        }

        return x;
    },

   /**
     * returns a matrix full of zeros (no null values) of size (MxN)
     * @param {int} M number of rows in the desired matrix (MxN)
     * @param {int} N number of columns the desired matrix (MxN)
     *
     * @returns {Number[][]} zerosMatrix (size MxN)
     */
    zeros: function(M, N)
    {
        var x = new Array(M); //Double[M][N];

        var i = 0;
        var j = 0;

        for(i = 0; i < M; i++)
        {
           result[i] = new Array(N);
        }

        for (i = 0; i < M; i++)
        {
            for ( j = 0; j < N; j++)
            {
                x[i][j] = 0.0;
            }
        }

        return x;
    },

    /**
     * returns the product of two arrays where the first array is 1xN in size and the
     * second array is NxM in size
     * @param {Number[]} x 1d array of size (1xN)
     * @param {Number[][]} y 2d array of size (NxM)
     *
     * @returns {Number[]} product 1d array of size (1xM)
     */
    multiply1dBy2d: function(x, y)
    {
        var x1 = x.length;
        var y1 = y.length;
        var y2 = y[0].length;

        if (x1 != y1)
        {
            return null;
        }

        var returnVal = new Array(y2); //Double[y2];

        for (var i = 0; i < y2; i++)
        {
            var val = 0;

            for (var j = 0; j < x1; j++)
            {
                val = val + x[j] * y[j][i];
            }

            returnVal[i] = val;
        }

        return returnVal;
    },

    /**
     * returns the product of two arrays where the first array is MxN in size and the
     * second array is Nx1 in size
     * @param {Number[][]} x 2d array of size (MxN)
     * @param {Number[]} y 1d array of size (Nx1)
     *
     * @returns {Number[]} product 1d array of size (Mx1)
     */
    multiply2dBy1d: function(x, y)
    {
        //where x is MxN and Y is Nx1
        var M_x1 = x.length;
        var N_x2 = x[0].length;
        var N_y1 = y.length;

        if (N_x2 != N_y1)
        {
            return null;
        }

        var returnVal = new Array(M_x1); //Double[M_x1];

        for (var i = 0; i < M_x1; i++)
        {
            var val = 0;

            for (var j = 0; j < N_y1; j++)
            {
                val = val + x[i][j] * y[j];
            }

            returnVal[i] = val;
        }

        return returnVal;
    },

    /**
     * returns a matrix multiplied by a scalar
     * @param {Number} h scalar
     * @param {Number[][]} x 2d array of size (MxN)
     *
     * @returns {Number[][]} product 2d array of size (MxN)
     */
    multiplyDoubleBy2d: function(h, x)
    {
        var M = x.length;
        var N = x[0].length;
        var hTimesX = new Array(M); //Double[M][N];

        var i = 0;
        var j = 0;

        for(i = 0; i < M; i++)
        {
           hTimesX[i] = new Array(N);
        }

        for (i = 0; i < M; i++)
        {
            for (j = 0; j < N; j++)
            {
                if (x[i][j] === 0)
                {
                    hTimesX[i][j] = 0.0;
                }
                else
                {
                    hTimesX[i][j] = h * x[i][j];
                }
            }
        }

        return hTimesX;
    },

   /**
     * returns the product of two arrays where the first array is MxN in size and the
     * second array is NxP in size
     * @param {Number[][]} x 2d array of size (MxN)
     * @param {Number[][]} y 2d array of size (NxP)
     *
     * @returns {Number[][]} product 2d array of size (MxP)
     */
    multiply2dBy2d: function(x, y)
    {
        var x1 = x.length;
        var x2 = x[0].length;
        var y1 = y.length;
        var y2 = y[0].length;

        if (x2 != y1)
        {
            return null;
        }

        var returnVal = new Array(x1); //Double[3][3];

        var i = 0;
        var j = 0;

        for(i = 0; i < x1; i++)
        {
           returnVal[i] = new Array(y2);
        }

        //each row of the target matrix
        for (i = 0; i < x1; i++)
        {
            //each column of the target matrix
            for (j = 0; j < y2; j++)
            {
                var val = 0;
                var k = 0;

                //the components of the target cell
                for (k = 0; k < y1; k++)
                {
                    val = val + x[i][k] * y[k][j];
                }

                returnVal[i][j] = val;
            }
        }

        return returnVal;
    },

    /**
     * returns the transpose of an array
     * given an array of size (MxN), this will transpose the matrix to size (NxM)
     * @param {Number[][]} x 2d array of size (MxN)
     *
     * @returns {Number[][]} transpose 2d array of size (NxM)
     */
    transposeMatrix: function(x)
    {
        var x1 = x.length;
        var x2 = x[0].length;

        var returnVal = new Array(x2); //Double[x2][x1];

        var i = 0;
        var j = 0;

        for(i = 0; i < x2; i++)
        {
           returnVal[i] = new Array(x1);
        }

        //each row of the target matrix
        for (i = 0; i < x1; i++)
        {  
            //each column of the target matrix
            for (j = 0; j < x2; j++)
            { 
                returnVal[j][i] = x[i][j];
            }
        }

        return returnVal;
    },

    /**
     * returns the sum of two arrays of size (Nx1)
     * NOTE: both arrays must be of the same size
     * @param {Number[]} x 1d array of size (Nx1)
     * @param {Number[]} y 1d array of size (Nx1)
     *
     * @returns {Number[]} sum 1d array of size (Nx1)
     */
    add1dTo1d: function(x, y)
    {
        var x1 = x.length;
        var y1 = y.length;

        if (x1 != y1)
        {
            return null;
        }

        var returnVal = new Array(x1); //Double[x1];
        var i = 0;

        //each row of the target matrix
        for (i = 0; i < x1; i++)
        {  
            returnVal[i] = x[i] + y[i];
        }

        return returnVal;
    },

        /**
     * returns the sum of two arrays of size (MxN)
     * NOTE: both arrays must be of the same size
     * @param {Number[][]} x 2d array of size (MxN)
     * @param {Number[][]} y 2d array of size (MxN)
     *
     * @returns {Number[][]} sum 1d array of size (MxN)
     */
    add2dTo2d: function(x, y)
    {
        var x1 = x.length;
        var x2 = x[0].length;
        var y1 = y.length;
        var y2 = y[0].length;

        if ((x1 != y1) || (x2 != y2))
        {
            return null;
        }

        var returnVal = new Array(x1); //Double[x1][x2];
        var i = 0;
        var j = 0;

        for(i = 0; i < x1; i++)
        {
           returnVal[i] = new Array(x2);
        }

        //each row of the target matrix
        for (i = 0; i < x1; i++)
        {
            //each column of the target matrix
            for (j = 0; j < x2; j++)
            { 
                returnVal[i][j] = x[i][j] + y[i][j];
            }
        }

        return returnVal;
    },

    /**
     * returns the difference of two arrays of size (MxN)  (x - y)
     * NOTE: both arrays must be of the same size
     * @param {Number[][]} x 2d array of size (MxN)
     * @param {Number[][]} y 2d array of size (MxN)
     *
     * @returns {Number[][]} difference 2d array of size (MxN) representing x-y
     */
    subtract2dMinus2d: function(x, y)
    {
        var x1 = x.length;
        var x2 = x[0].length;
        var y1 = y.length;
        var y2 = y[0].length;

        if ((x1 != y1) || (x2 != y2))
        {
            return null;
        }

        var returnVal = new Array(x1); //Double[x1][x2];
        var i = 0;
        var j = 0;

        for(i = 0; i < x1; i++)
        {
           returnVal[i] = new Array(x2);
        }

        //each row of the target matrix
        for (i = 0; i < x1; i++)
        {
            //each column of the target matrix
            for (j = 0; j < x2; j++)
            { 
                returnVal[i][j] = x[i][j] - y[i][j];
            }
        }

        return returnVal;
    },

    /**
     * returns the difference of two arrays of size (Nx1)  (x - y)
     * NOTE: both arrays must be of the same size
     * @param {Number[]} x 1d array of size (Nx1)
     * @param {Number[]} y 1d array of size (Nx1)
     *
     * @returns {Number[]} difference 1d array of size (Nx1) representing x-y
     */
    subtract1dMinus1d: function(x, y)
    {
        var x1 = x.length;
        var y1 = y.length;

        if (x1 != y1)
        {
            return null;
        }

        var returnVal = new Array(x1); //Double[x1];
        var i = 0;

        //each row of the target matrix
        for (i = 0; i < x1; i++)
        {  
            returnVal[i] = x[i] - y[i];
        }

        return returnVal;
    }
};
function Quaternion(wVal, xVal, yVal, zVal) {

    this.w = wVal ? wVal : 0.0;
    this.x = xVal ? xVal : 0.0;
    this.y = yVal ? yVal : 0.0;
    this.z = zVal ? zVal : 0.0;
    this.q = new Array(4);

    /**
     *
     */
    this.updateQ = function()
    {
        this.q[0] = this.w;
        this.q[1] = this.x;
        this.q[2] = this.y;
        this.q[3] = this.z;
    };

    /**
     *
     * @returns
     */
    this.getQ = function()
    {
        return q;
    };

    /**
     *
     * @param q Double[]
     */
    this.setQ = function(q)
    {
        this.w = q[0];
        this.x = q[1];
        this.y = q[2];
        this.z = q[3];
        this.q = q;
    };

    /**
     *
     *
     * @returns double
     */
    this.getW = function()
    {
        return this.w;
    };

    /**
     *
     * @param newW double
     */
    this.setW = function(newW)
    {
        this.w = newW;
        this.updateQ();
    };

    /**
     *
     * @returns double
     */
    this.getX = function()
    {
        return this.x;
    };

    /**
     *
     * @param newX double
     */
    this.setX = function(newX)
    {
        this.x = newX;
        this.updateQ();
    };

    /**
     *
     * @returns double
     */
    this.getY = function()
    {
        return this.y;
    };

    /**
     *
     * @param newY double
     */
    this.setY = function(newY)
    {
        this.y = newY;
        this.updateQ();
    };

    /**
     *
     * @returns double
     */
    this.getZ = function()
    {
        return this.z;
    };

    /**
     *
     * @param newZ double
     */
    this.setZ = function(newZ)
    {
        this.z = newZ;
        this.updateQ();
    };

    /**
     *
     * @returns boolean
     */
    this.isZero = function()
    {
        for (var i = 0; i < 4; i++)
        {
            if (this.q[i] && this.q[i] !== 0)
            {
                return false;
            }
        }

        return true;
    };
}var QuaternionMath = {

    /**
     *
     * @param q1 Quaternion
     * @param q2 Quaternion
     *
     * @returns Quaternion
     */
    multiplyQuaternions: function(q1, q2)
    {
        //multiplies q1 by q2;
        if (q1.isZero())
        {
            return q2;
        }
        else if (q2.isZero())
        {
            return q1;
        }
        else
        {
            var w1 = q1.getW(); //double
            var x1 = q1.getX(); //double
            var y1 = q1.getY(); //double
            var z1 = q1.getZ(); //double
            var w2 = q2.getW(); //double
            var x2 = q2.getX(); //double
            var y2 = q2.getY(); //double
            var z2 = q2.getZ(); //double

            //now that each quaternion has an axis of rotation that is a unit vector, multiply the two:
            var quaternionProduct = new Quaternion();
            quaternionProduct.setW(w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2);
            quaternionProduct.setX(w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2);
            quaternionProduct.setY(w1 * y2 + y1 * w2 + z1 * x2 - x1 * z2);
            quaternionProduct.setZ(w1 * z2 + z1 * w2 + x1 * y2 - y1 * x2);

            return quaternionProduct;
        }
    },

    /**
     *
     * @param qRotation Quaternion
     * @param inputVector Double[]
     *
     * @returns Double[]
     */
    applyQuaternionRotation: function(qRotation, inputVector)
    {
        //applies qRotation q1 to the vector inputVector (3x1)
        var q0 = qRotation.getW(); //double
        var q1 = qRotation.getX(); //double
        var q2 = qRotation.getY(); //double
        var q3 = qRotation.getZ(); //double

        var A = new Array(3); //Double[3][3];
        var i = 0;
        for(i = 0; i < 3; i++)
        {
            A[i] = new Array(3);
        }

        A[0][0] = 2*q0*q0-1+2*q1*q1;
        A[0][1] = 2*q1*q2+2*q0*q3;
        A[0][2] = 2*q1*q3-2*q0*q2;
        A[1][0] = 2*q1*q2-2*q0*q3;
        A[1][1] = 2*q0*q0-1+2*q2*q2;
        A[1][2] = 2*q2*q3+2*q0*q1;
        A[2][0] = 2*q1*q3+2*q0*q2;
        A[2][1] = 2*q2*q3-2*q0*q1;
        A[2][2] = 2*q0*q0-1+2*q3*q3;

        var matrixProduct = MathTools.multiply2dBy1d(A, [inputVector.x, inputVector.y, inputVector.z]);

        return new THREE.Vector3(
            matrixProduct[0],
            matrixProduct[1],
            matrixProduct[2]
        );
    },

    /**
     *
     * @param q Quaternion
     *
     * @returns Double[]
     */
    getEulerAngles: function(q)
    {
        //------DETERMINING THE EQUIVALENT EULER ROTATION ANGLES------
        //translate the net (final) quaternion back to euler angles
        var q0 = q.getW(); //double
        var q1 = q.getX(); //double
        var q2 = q.getY(); //double
        var q3 = q.getZ(); //double

        var phi = Math.atan2((2 * (q0 * q1 + q2 * q3)),
            (1 - 2 * (q1 * q1 + q2 * q2)));   //rad  (rotation about the x-axis)
        var theta = Math.asin(2 * (q0 * q2 - q3 * q1)); //rad  (rotation about the y-axis)
        var gamma = Math.atan2((2 * (q0 * q3 + q1 * q2)),
            (1 - 2 * (q2 * q2 + q3 * q3))); //rad  (rotation about the z-axis)

        //equivalentRotationMatrix=Rot3(gamma*180/pi)*Rot2(theta*180/pi)*Rot1(phi*180/pi);
        var EulerAngles = new Array(3); //Double[3];
        EulerAngles[0] = MathTools.toDegrees(phi);     //deg  (rotation about the x-axis)
        EulerAngles[1] = MathTools.toDegrees(theta);   //deg  (rotation about the y-axis)
        EulerAngles[2] = MathTools.toDegrees(gamma);   //deg  (rotation about the z-axis)

        //remember, the equivalentRotationMatrix=Rot3(gamma*180/pi)*Rot2(theta*180/pi)*Rot1(phi*180/pi);
        return EulerAngles;
    },

    /**
     *
     * @param m Double[][]
     *
     * @returns Quaternion
     */
    convertRotationMatrixToQuaternion: function(m)
    {
        //converts a 3x3 rotation matrix to an equivalent quaternion
        var q = new Quaternion();
        var m11 = m[0][0]; //double
        var m12 = m[0][1]; //double
        var m13 = m[0][2]; //double
        var m21 = m[1][0]; //double
        var m22 = m[1][1]; //double
        var m23 = m[1][2]; //double
        var m31 = m[2][0]; //double
        var m32 = m[2][1]; //double
        var m33 = m[2][2]; //double

        // q.setW(0.5 * Math.sqrt(m11+m22+m33+1));
        //         q.setX((m23 - m32) / (4 * q.getW()));
        //         q.setY((m31 - m13) / (4 * q.getW()));
        //         q.setZ((m12 - m21) / (4 * q.getW()));

        q.setW(0.5*Math.sqrt(1+m11-m22-m33));
        q.setX((m12+m21)/(4*q.getW()));
        q.setY((m13+m31)/(4*q.getW()));
        q.setZ((m32-m23)/(4*q.getW()));

        return q;
    }
};var UNIVERSE = UNIVERSE || {};

UNIVERSE.RSWCoordinates = function(radial, alongTrack, crossTrack) {
 
    // define variables as <var name>: <value>

    this.radial = radial ? radial : 0.0; //radial vector (km)
    this.alongTrack = alongTrack ? alongTrack : 0.0; //along track vector (km)
    this.crossTrack = crossTrack ? crossTrack : 0.0; //cross track vector (km)
};var Utilities = {
    get_random_color: function() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '0x';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
    },
    
    /**
		Converts ECI to THREE.js 3D coordinate system. Compare these two websites for details on why we have to do this:
    	http://celestrak.com/columns/v02n01/
    	http://stackoverflow.com/questions/7935209/three-js-3d-coordinates-system
		@private
	*/
    eciTo3DCoordinates: function(location, earthExtensions) {
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
    },
        
    threeDToEciCoordinates: function(location, earthExtensions) {
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
    
    // have to do this this way since the decision of whether to show or hide it has to be made at draw time
    this.enableVisibilityLines = false;
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
        @param {function} callback - A function called at completion of the addition
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
    
    /**
        Add Lines from a space object to objects in it's sensor FOVs to the Universe
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add to the Universe
        @param {function} callback - A function called at completion of the addition
    */
    this.addSensorVisibilityLines = function(object, callback) {
        if(object.sensors && object.sensors.length > 0) {
            var visibilityLinesController = new UNIVERSE.SensorVisibilityLinesController(object, universe, earthExtensions)
            universe.addObject(visibilityLinesController);
            universe.updateOnce();
            callback();
        }
    };

    /**
        Add a Ground Object to the Earth
        @public
        @param {UNIVERSE.GroundObject} groundObject - an object to display on the Earth
        @param {function} callback - A function called at completion of the addition
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
        @param {function} callback - A function called at completion of the addition
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
        @param {function} callback - A function called at completion of the addition
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
        var objectLocation = Utilities.eciTo3DCoordinates(spaceObject.propagator(undefined, false), earthExtensions);
        
        if(objectLocation) {
            var sensorProjection = UNIVERSE.SensorProjection(sensor, spaceObject, universe, earthExtensions, objectLocation);
            universe.addObject(sensorProjection);
            universe.updateOnce();
        }
    };


    /**
        Add sensor projections for a space object
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add projections for
        @param {function} callback - A function called at completion of the addition
    */
    this.addSensorProjections = function(spaceObject, callback) {
        if(spaceObject.sensors.length > 0 ) {
            for(var i = spaceObject.sensors.length-1; i >= 0; i--) {
                this.addSensorProjection(spaceObject.sensors[i], spaceObject);
            }
            callback();
        }
    };
    
    
    /**
        Add sensor projection footprints for all sensors on a space object
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add projections for
        @param {function} callback - A function called at completion of the addition
    */
    this.addSensorFootprintProjections = function(spaceObject, callback) {
        if(spaceObject.sensors.length > 0 ) {
            for(var i = 0; i < spaceObject.sensors.length; i++) {
                this.addSensorFootprintProjection(spaceObject.sensors[i], spaceObject);
            }
            callback();
        }
    };
    
    /**
        Add sensor projection footprints for a specific sensor on a space object
        @public
        @param {UNIVERSE.SpaceObject} spaceObject - An orbiting object to add projections for
        @param {function} callback - A function called at completion of the addition
    */
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
                var objectLocation = Utilities.eciTo3DCoordinates(object.propagator(undefined, false), earthExtensions);

                var closestGroundObject = earthExtensions.findClosestGroundObject(objectLocation);

                if(closestGroundObject !== undefined && closestGroundObject.id != closestObject_id) {
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
        @param {string} color - color code in hex of the line between objects
        @param {string} customIdentifier - a specific identifier to put between objects in the id
    */
    this.addLineBetweenObjects = function(object1_id, object2_id, color, customIdentifier) {
        var lineGraphicsObject = new UNIVERSE.LineBetweenObjects(object1_id, object2_id, universe, earthExtensions, color, customIdentifier);        
        universe.addObject(lineGraphicsObject);
    }

    /**
        Remove a Line between two graphics objects
        @public
        @param {string} object1_id - starting object of the line
        @param {string} object2_id - end object of the line
        @param {string} customIdentifier - a specific identifier to put between objects in the id
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
        if(location) {
            var location_vector = new THREE.Vector3(location.x, location.y, location.z);

            // move the vector to the surface of the earth
            location_vector.multiplyScalar(Constants.radiusEarth / location_vector.length());

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
            if(graphicsObjects[i].currentLocation) {
                var vector = new THREE.Vector3(graphicsObjects[i].currentLocation.x, graphicsObjects[i].currentLocation.y, graphicsObjects[i].currentLocation.z);
                var distance_to = vector.distanceTo(location_vector);
                if(closestDistance === undefined || distance_to < closestDistance) {
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
        this.enableVisibilityLines = isEnabled;

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
        
    /**
        Lock the position of the camera relative to the Earth so that it appears
        that the Earth is not spinning
        @public
        @param {boolean} isLocked
    */
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
    }
};
