var SSI = SSI || {};

SSI.Universe = function(options, container) {
    var controller = new SSI.UniverseController({});
    var core = new SSI.Core3D(container);
    var objectLibrary = new SSI.ObjectLibrary();

    // earthOptions:
    // image
    //
    this.addEarth = function(earthOptions) {
        var earthSphereRadius = 6371, earthSphereSegments = 40, earthSphereRings = 30;

        // Create the sphere
        var geometry = new THREE.Sphere(earthSphereRadius, earthSphereSegments, earthSphereRings);

        // Define the material to be used for the sphere surface by pulling the image and wrapping it around the sphere
        var shader = {
            uniforms : {
                'texture' : {
                    type : 't',
                    value : 0,
                    texture : null
                }
            },
            vertexShader : ['varying vec3 vNormal;', 'varying vec2 vUv;', 'void main() {', 'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );', 'vNormal = normalize( normalMatrix * normal );', 'vUv = uv;', '}'].join('\n'),
            fragmentShader : ['uniform sampler2D texture;', 'varying vec3 vNormal;', 'varying vec2 vUv;', 'void main() {', 'vec3 diffuse = texture2D( texture, vUv ).xyz;', 'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );', 'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );', 'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );', '}'].join('\n')
        };
        var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

        uniforms['texture'].texture = THREE.ImageUtils.loadTexture(earthOptions.image);

        var material = new THREE.MeshShaderMaterial({
            uniforms : uniforms,
            vertexShader : shader.vertexShader,
            fragmentShader : shader.fragmentShader
        });

        var earthMesh = new THREE.Mesh(geometry, material);

        controller.addGraphicsObject({
            id : "earth",
            objectName : "earth",
            update : function() {
                // retrieve earth rotation at a time and change rotation
                earthMesh.rotation.y += 0.01;
                this.draw();
            },
            draw : function() {
                core.draw(this.id, earthMesh);
            }
        });
    };

    // adds a model to the universe with an ID and url to retrieve
    // the model's geometry
    this.addJsonMeshModel = function(modelId, modelUrl, material, callback) {
        console.log("Adding mesh model to universe; id: [" + modelId +
            "] url: [" + modelUrl + "], material: [" + material + "]");
        objectLibrary.addMeshObjectFromUrl(modelId, modelUrl, material, callback);
    };


    // spaceObject:
    // id
    // stateVector
    //   time
    //   x, y, z
    // objectName
    // propogator
    // modelId
    this.addSpaceObject = function(spaceObject) {
        var objectModel = objectLibrary.getObjectById(spaceObject.modelId);

        controller.addGraphicsObject({
            id : spaceObject.id,
            objectName : spaceObject.objectName,
            update : function() {
                // need to pass a time to the propogator
                var location = spaceObject.propogator();
                objectModel.position.set(location.x, location.y, location.z);
                this.draw();
            },
            draw : function() {
                core.draw(this.id, objectModel);
            }
        });
    };
    // groundObject:
    // id
    // propogator
    // object
    this.addGroundObject = function(groundObject) {
        var geometry = new THREE.Sphere(200, 20, 10);

        var sphereMaterial = new THREE.MeshLambertMaterial({
            color : 0xCC0000
        });

        var groundObjectMesh = new THREE.Mesh(geometry, sphereMaterial);

        controller.addGraphicsObject({
            id : groundObject.id,
            objectName : groundObject.objectName,
            update : function() {
                // check earth rotation and update location
                var position = groundObject.propogator();
                groundObjectMesh.position.set(position.x, position.y, position.z);
                this.draw();
            },
            draw : function() {
                core.draw(this.id, groundObjectMesh);
            }
        });
    };
    // method to add an orbit line
    // needs some more work but can at least see one orbit
    this.addPropogationLineForObject = function(object) {

        var geometry = new THREE.Geometry();

        for(var j = 0; j < 1000; j++) {
            // TODO: y and z are flipped for now
            var location = object.propogator(j);
            var vx = location.x;
            var vy = location.y;
            var vz = location.z;
            var vector = new THREE.Vector3(vx, vy, vz);
            geometry.vertices.push(new THREE.Vertex(vector));
        }
        var lineS = new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color : 0x990000,
            opacity : 1
        }));

        controller.addGraphicsObject({
            id : object.id + "_propogation",
            objectName : object.objectName,
            update : function() {
                //check that the current time isn't close to the end of my propogation and propogate further if necessary
                this.draw();
            },
            draw : function() {
                core.draw(this.id, lineS);
            }
        })

    }

    this.play = function() {
        controller.play();
    };

    this.pause = function() {
        controller.pause();
    };
};

SSI.Universe.prototype.goToTime = function(time) {
    };
