/*jshint -W004*/
/*global document, THREE, setInterval, setTimeout, requestAnimationFrame, waitTime, console, window, Util, RigidBody, getUserInputs, Boiler, State*/ 

/** 
 *   @author: Kade Keith
 */

var doc = document; //shorthand
var simTimeout;     //for starting and stopping the sim

//boilerplate
var scene, renderer, camera, light, axes;

var body, clock;

//if fish is false then render as cube
var fish = false;
function toggleFish(elem){
    fish = elem.checked;
    initBody();
}

var vertArr;    //shorthand reference to the vertice array of the body

var CR = 0.5;   // coefficient of restitution. 1 is maximum bouncy
var CF = 0.5;   // coefficient of friction. 0 is no friction

//variables that the user sets
var H;              // Step time in seconds
var H_MILLI;        // In milliseconds
var G = new THREE.Vector3(0, -10, 0);  // The accel due to gravity in m/s^2 
var useRK4 = false;

var collidables = [];

var cubeAttr1 = {
    p: [-7, -30 , 0],
    r: [Math.radians(10), Math.radians(30), Math.radians(30)],
    scale: 20
};

var cubeAttr2 = {
    p: [50, -90 , 0],
    r: [Math.radians(0), Math.radians(0), Math.radians(30)],
    scale: 50
};

//ugly, but saves time garbage collecting
var state_mut = new State();

//I keep mutable vectors for all calculations
var v1_mut = new THREE.Vector3(0,0,0); 
var v2_mut = new THREE.Vector3(0,0,0);
var v3_mut = new THREE.Vector3(0,0,0);
var v4_mut = new THREE.Vector3(0,0,0);
var v5_mut = new THREE.Vector3(0,0,0);
var v6_mut = new THREE.Vector3(0,0,0);
var v7_mut = new THREE.Vector3(0,0,0);
var v8_mut = new THREE.Vector3(0,0,0);

var m1_mut = new THREE.Matrix4();
var m2_mut = new THREE.Matrix4();
var m3_mut = new THREE.Matrix4();
var m4_mut = new THREE.Matrix4();

var q1_mut = new THREE.Quaternion();
var q2_mut = new THREE.Quaternion();

var p0_mut = new THREE.Vector3(0,0,0);
var p1_mut = new THREE.Vector3(0,0,0);
var p2_mut = new THREE.Vector3(0,0,0);
var vNormal = new THREE.Vector3(0,0,0);
var plane_mut = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

var vNew = new THREE.Vector3(0,0,0);
var xNew = new THREE.Vector3(0,0,0);
var collisionX = new THREE.Vector3(0,0,0);

//states
var deriv = new State();
var K1 = new State();
var K2 = new State();
var K3 = new State(); 
var K4 = new State();
var oldState = new State();

//edge collisions
var q1 = new THREE.Vector3(0,0,0);
var q2 = new THREE.Vector3(0,0,0);
var pa = new THREE.Vector3(0,0,0);
var qa = new THREE.Vector3(0,0,0);

window.onload = function(){
    scene = new THREE.Scene();
    renderer = Boiler.initRenderer();
    camera = Boiler.initCamera();
    light = Boiler.initLight();
    axes = Boiler.initAxes();
    var polygon1 = Boiler.initCube(cubeAttr1);
    collidables.push(polygon1);
    
    var polygon2 = Boiler.initCube(cubeAttr2);
    collidables.push(polygon2);
    
    //add edges to the object    
    for (var p=0; p < collidables.length; p++){
        var mesh = collidables[p];
        Util.addEdges(mesh);
    }
    
    //change what the camera is looking at and add our controls
    camera.position.set(0, 0, 45);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
        
    render();
    initBody();   
};

function initBody(){
    if (body){        
        scene.remove(body.mesh);
        window.clearTimeout(simTimeout);
    }
        
    body = new RigidBody(scene, loadIntegrationVars, fish);

    if (!fish){
        loadIntegrationVars();
    }
}

/* load up all the mutables for integration */
function loadIntegrationVars(){
    vertArr = body.mesh.geometry.vertices; //shorthand   
}

/** create the sphere and set it according to user inputs, then start simulation and rendering */
function initMotion(){    
    getUserInputs();

    clock = new THREE.Clock();
    clock.start();
    clock.getDelta();
        
    window.clearTimeout(simTimeout);
    
    //give it an initial angular velocity
    body.STATE.L.set(0,0,1);
    simulate();
}

//gets the derivative of a state. plus external forces. returns deep copy of array
function F(state, m, I_0_inv){
    
    state_mut.x.copy(state.P).multiplyScalar(1 / body.mass); //Velocity
    
    m1_mut.makeRotationFromQuaternion(state.q); //Rotation matrix - R
    m2_mut.copy(m1_mut).transpose(); //R transpose
    m3_mut.copy(m1_mut).multiply(I_0_inv).multiply(m2_mut);    //new inverse moi
    
    v1_mut.copy(state.L).applyMatrix4(m3_mut); //w
    v2_mut.copy(v1_mut).normalize();       
    
    // w => (0,w)
    q1_mut.set(v2_mut.x, v2_mut.y, v2_mut.z, 0);
    state_mut.q.copy(state.q).multiply(q1_mut);
    state_mut.q.set(state_mut.q.x / 2, state_mut.q.y / 2, state_mut.q.z / 2, state_mut.q.w / 2);
    
    state_mut.P.copy(G);    //Force do to gravity
    state_mut.L.set(0,0,0);
    
    //test torque
    /*
    var F = new THREE.Vector3(1,1,1);
    state_mut.P.add(F);
    
    var r = new THREE.Vector3(0,0,0).copy(body.mesh.localToWorld(body.mesh.geometry.vertices[0].clone())).sub(state.x);
    state_mut.L.copy(r).cross(F);
    */
    
    /*
    for Vector3 Fi do
        deriv.P+ = Fi;
        if Fi is applied at a point p then
            Vector3 r = p - S.x;
            deriv.L += r ⇥ Fi; 
    end
    */
    
    return state_mut;
}

function integrateState(state, deriv, H){
    oldState.copy(state);
    deriv.multScalar(H);
    state.add(deriv);    
}

function integrateVector(v1, v2, timestep){
    v1_mut.copy(v1);
    v2_mut.copy(v2);
    return v1_mut.add(v2_mut.multiplyScalar(timestep));
}

/** the main simulation loop. recursive */ 
function simulate(){ 

    //first order deriv
    deriv.copy(F(body.STATE, body.mass, body.I_0)); 
    //weird that it doesn't matter whether i use body.I or body.I_0
    //i think it is because I am using a cube
    
    deriv.q.normalize();
    
    if (useRK4) {       /******************************************* rk4 integration */ 
        K1.copy(deriv);//K1 = F(Xn)

        //second order deriv
        deriv.copy(K1);
        deriv.multScalar(H * 0.5);
        deriv.add(body.STATE);
        K2.copy(F(deriv, body.mass, body.I_0)); //K2 = F(Xn + 1/2 * H * K1)
        K2.q.normalize();
        
        //third order deriv
        deriv.copy(K2);
        deriv.multScalar(H * 0.5);
        deriv.add(body.STATE);
        K3.copy(F(deriv, body.mass, body.I_0)); //K3 = F(Xn + 1/2 * H * K2)
        K3.q.normalize();
        
        //fourth order deriv
        deriv.copy(K3);
        deriv.multScalar(H);
        deriv.add(body.STATE);
        K4.copy(F(deriv, body.mass, body.I_0)); //K4 = F(Xn + H * K3)
        K4.q.normalize();
        
        K2.multScalar(2);
        K3.multScalar(2);
        K1.add(K2);
        K1.add(K3);
        K1.add(K4); //Xn+1 = Xn + (K1 + 2*K2 + 2*K3 + K4)/6
        
        integrateState(body.STATE, K1, H/6);
    }
    else {              /******************************************* euler integration */ 
        integrateState(body.STATE, deriv, H);
    }
    
    body.STATE.q.normalize();

    //COLLISION DETECTION
    
    //Edge-Edge Collision
    for (var j=0; j<body.mesh.edges.length; j++){
        var edge = body.mesh.edges[j];

        p1_mut.copy(vertArr[edge[0]]);
        p2_mut.copy(vertArr[edge[1]]);
        p1_mut.applyQuaternion(body.STATE.q); //xOld
        p1_mut.add(body.STATE.x);
        p2_mut.applyQuaternion(body.STATE.q); //xNew
        p2_mut.add(body.STATE.x);
        
        //TODO response w/ velocities
        var edgeResponse = edgeEdgeResponse(p1_mut, 
                                            p2_mut, 
                                            new THREE.Vector3(0,0,0), 
                                            new THREE.Vector3(0,0,0));    
        /*
        if(edgeResponse){
            break;  //only one collision per frame
        }
        */
    }
    
    //Vertex Face Collision
    for (var i = 0; i < vertArr.length; i++){
        v4_mut.copy(vertArr[i]); //xOld
        v5_mut.copy(vertArr[i]); //xNew
        body.mesh.localToWorld(v4_mut); //xOld
        v5_mut.applyQuaternion(body.STATE.q); //xNew
        v5_mut.add(body.STATE.x);

        //TODO response w/ velocities
        v6_mut.clone(v5_mut).sub(v4_mut).multiplyScalar(1/H); //velocity

        
        var vertexResponse = vertexFaceResponse(v4_mut, 
                                                v5_mut, 
                                                v6_mut);
        if (vertexResponse){
            console.log('vertex face collision detection');
            //body.STATE[i].copy(vertexResponse.xNew);
            //body.STATE[i + body.count].copy(vertexResponse.vNew);
        }
    }
        
    // the transpose may happen first
    // update MOI (I = RI_0R^T)
    m1_mut.makeRotationFromQuaternion(body.STATE.q); //Rotation matrix - R
    m2_mut.copy(m1_mut).transpose(); //R transpose
    body.I.copy(m1_mut.multiply(body.I_0).multiply(m2_mut));
    
    body.mesh.geometry.verticesNeedUpdate = true;

    //translate
    body.mesh.position.copy(body.STATE.x);
    //rotate
    body.mesh.setRotationFromQuaternion(body.STATE.q);

    var waitTime = H_MILLI - clock.getDelta(); 
    if (waitTime < 4){ //4 milliseconds is the minimum wait for most browsers
        console.log("simulation getting behind and slowing down!");
    }
    simTimeout = setTimeout(simulate, waitTime);
}

/** find results of any vertex face collisions */
function vertexFaceResponse(x1, x2, vAvg){
        
    //loop through all collidable objects
    for (var p=0; p < collidables.length; p++){
        var mesh = collidables[p];
        
        //all faces on the object
        for (var i=0; i < mesh.geometry.faces.length; i++){
            var face = mesh.geometry.faces[i];
            
            v1_mut.copy(x1);
            v2_mut.copy(x2);

            p0_mut.set(mesh.geometry.vertices[face.a].x + mesh.position.x, 
                       mesh.geometry.vertices[face.a].y + mesh.position.y,
                       mesh.geometry.vertices[face.a].z + mesh.position.z);
            p1_mut.set(mesh.geometry.vertices[face.b].x + mesh.position.x, 
                       mesh.geometry.vertices[face.b].y + mesh.position.y, 
                       mesh.geometry.vertices[face.b].z + mesh.position.z);
            p2_mut.set(mesh.geometry.vertices[face.c].x + mesh.position.x,
                       mesh.geometry.vertices[face.c].y + mesh.position.y, 
                       mesh.geometry.vertices[face.c].z + mesh.position.z);
            
            plane_mut.setFromCoplanarPoints(p0_mut, p1_mut, p2_mut);

            var dOld = plane_mut.distanceToPoint(v1_mut);
            var dNew = plane_mut.distanceToPoint(v2_mut);

            //check if they have the same sign
            if (dOld*dNew <= 0){            

                var fraction = dOld / (dOld-dNew);
                collisionX.copy(integrateVector(x1, vAvg, fraction * H));
                
                // TODO be more accurate by binary search integration
                
                if (pointInFace(collisionX, p0_mut, p1_mut, p2_mut)){

                    var r1 = new THREE.Vector3().copy(body.STATE.x).sub(collisionX); 
                    
                    var j = vAvg.clone().multiplyScalar(-(1+CR)).dot(plane_mut.normal) /
                            1 + r1.cross(plane_mut.normal.applyMatrix4(body.I.clone().getInverse(body.I))).dot(plane_mut.normal);

                            // 1/m1 + 1/m2 + (i1_inv(r1 x nHat) x r1 + i2_inv(r2 x nHat) x r2) . nHat
                    
                    //TODO apply impulse
                    return j;
                }
            }
        }
    }
    return false;
}

/** determine whether point is in a face */
function pointInFace(x, p0, p1, p2){
    var v0, v1, v2, dot00, dot01, dot02, dot11, dot12, denom, u, v;

    v0 = p2.sub(p0);
    v1 = p1.sub(p0);
    v1_mut.copy(x);
    v2 = v1_mut.sub(p0);
    
    // Compute dot products
    dot00 = v0.dot(v0);
    dot01 = v0.dot(v1);
    dot02 = v0.dot(v2);
    dot11 = v1.dot(v1);
    dot12 = v1.dot(v2);

    // Compute barycentric coordinates
    denom = 1 / (dot00 * dot11 - dot01 * dot01);
    u = (dot11 * dot02 - dot01 * dot12) * denom;
    v = (dot00 * dot12 - dot01 * dot02) * denom;        

    if ( u >= 0 && v >= 0 && (u+v) <= 1){
        return true;
    }
}

/** find results of any edge edge collisions */
function edgeEdgeResponse(p1, p2, v1, v2){
    
    for (var i=0; i < collidables.length; i++){
        var mesh = collidables[i];
        for (var j=0; j < mesh.edges.length; j++){
            var edge = mesh.edges[j];
            
            q1.set(mesh.geometry.vertices[edge[0]].x + mesh.position.x, 
                    mesh.geometry.vertices[edge[0]].y + mesh.position.y,
                    mesh.geometry.vertices[edge[0]].z + mesh.position.z);
            q2.set(mesh.geometry.vertices[edge[1]].x + mesh.position.x, 
                    mesh.geometry.vertices[edge[1]].y + mesh.position.y, 
                    mesh.geometry.vertices[edge[1]].z + mesh.position.z);
            
            v1_mut.copy(p2).sub(p1); //a
            v2_mut.copy(q2).sub(q1); //b
            
            v3_mut.copy(v1_mut).cross(v2_mut).normalize(); //nHat
            
            v4_mut.copy(q1).sub(p1); //r
            
            v5_mut.copy(v1_mut).normalize(); //aHat
            v6_mut.copy(v2_mut).normalize(); //bHat
            
            v7_mut.copy(v5_mut).cross(v3_mut); // aHat x nHat 
            v8_mut.copy(v6_mut).cross(v3_mut); // bHat x nHat 
            
            var s = v4_mut.dot(v8_mut) / v1_mut.dot(v8_mut);        // r . (bHat x nHat) / a . (bHat x nHat)
            var t = -1 * v4_mut.dot(v7_mut) / v2_mut.dot(v7_mut);   // -r . (aHat x nHat) / b . (aHat x nHat)
            
            if (s < 0 || s > 1 || t < 0 || t > 1){
                continue;
            }
            else {
                pa.copy(v1_mut).multiplyScalar(s).add(p1); //pa = p1 +sa
                qa.copy(v2_mut).multiplyScalar(t).add(q1); //qa = q1 +tb   
                var dist = qa.clone().sub(pa).length(); //clone is for debugging
                if (dist < 0.3){ 
                    console.log('edge-edge collision');
                    
                    
                    var magnitude = v1_mut.copy(v1).add(v2).multiplyScalar(0.5).length(); //average magnitude
                    v4_mut.copy(v3_mut).multiplyScalar(magnitude); //points move in opposite direction
                
                    var response = [{
                        xNew : new THREE.Vector3(0,0,0),
                        vNew : new THREE.Vector3(0,0,0)
                    },{
                        xNew : new THREE.Vector3(0,0,0),
                        vNew : new THREE.Vector3(0,0,0) 
                    }];

                    v5_mut.copy(v4_mut).multiplyScalar(s-1);
                    v6_mut.copy(v4_mut).multiplyScalar(s);
                    
                    response[0].vNew.copy(v5_mut);
                    response[1].vNew.copy(v6_mut); 
                    
                    response[0].xNew.copy(integrateVector(p1, v5_mut, H));
                    response[1].xNew.copy(integrateVector(p2, v6_mut, H));
                                        
                    return response;    
                }
            }
        }
    }
    
    return false;
}

/** rendering loop */
function render() {	
    renderer.render(scene, camera); //draw it
	requestAnimationFrame(render);  //redraw whenever the browser refreshes
}