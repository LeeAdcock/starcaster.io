import React, {useEffect, useState, useRef} from 'react';
import Toolbar from './components/Toolbar.js'
const stars = []
for(let x=0; x<1000; x++) {
    stars.push({
        x: (Math.random() * 30000) - 10000,
        y: (Math.random() * 30000) - 10000,
        color: ['#FFFFE0', '#FFFACD', '#FAFAD2', '#FFFF99', '#FFFFCC'][Math.round(Math.random() * 5)]
    })
}

var getDistance = (x1, y1, x2, y2) => {
    let dy = x2 - x1;
    let dx = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}



function Galaxy(props) {
  
  const timeRef = useRef(0);
  const sunsRef = useRef([]);
  const shipsRef = useRef([]);
  const userRef = useRef({});

  let vehicleType = useRef('fighter');

  let zoomscale = useRef(1);
  let translateX = useRef( 0);
  let translateY = useRef(0);

  var initViewport = () => {
    // Initialize user viewport
    Object.entries(sunsRef.current).forEach(([sunId, sun]) => {
        Object.entries(sun.planets).forEach(([planetId, planet]) => {
            if(planet.owner === userRef.current.id) {
                let planetAngle = planet.angle.value + (timeRef.current * Math.PI/planet.distance * planet.angle.speed);
                let planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                let planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                const canvas = document.getElementById('galaxy_canvas');
                translateX.current = -planetX + canvas.width/2;
                translateY.current = -planetY + canvas.height/2;
            }
        })
    })    
    zoomscale.current = 1
}

  useEffect(() => {
    setInterval( () => { timeRef.current += .1 }, 100)
  }, [])

  useEffect(() => {
    timeRef.current = props.time
  }, [props.time])

  useEffect(() => {
    const isInitialLoad = (sunsRef.current.length===0)
    sunsRef.current = props.suns
    if(isInitialLoad) {
        initViewport()
    }
  }, [props.suns])

  useEffect(() => {
    userRef.current = props.user
  }, [props.user])

  useEffect(() => {
    shipsRef.current = props.ships
  })

  useEffect(() => {

    const canvas = document.getElementById('galaxy_canvas');
    const ctx = canvas.getContext('2d');

    // borrowed from https://gist.github.com/dzhang123/2a3a611b3d75a45a3f41
    let svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    let xform = svg.createSVGMatrix();

    let lastX=canvas.width/2, lastY=canvas.height/2;
    let dragStart,dragged;

    ctx.getTransform = function(){ return xform; };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function(){
        savedTransforms.push(xform.translate(0,0));
        return save.call(ctx);
    };
  
    var restore = ctx.restore;
    ctx.restore = function(){
      xform = savedTransforms.pop();
      return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function(sx,sy){
      xform = xform.scaleNonUniform(sx,sy);
      return scale.call(ctx,sx,sy);
    };
  
    var rotate = ctx.rotate;
    ctx.rotate = function(radians){
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(ctx,radians);
    };
  
    var translate = ctx.translate;
    ctx.translate = function(dx,dy){
        xform = xform.translate(dx,dy);
        return translate.call(ctx,dx,dy);
    };
  
    var transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
        var m2 = svg.createSVGMatrix();
        m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
        xform = xform.multiply(m2);
        return transform.call(ctx,a,b,c,d,e,f);
    };
  
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a,b,c,d,e,f){
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx,a,b,c,d,e,f);
    };
  
    var pt = svg.createSVGPoint();
    ctx.transformedPoint = function(x,y){
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
    }

    canvas.addEventListener('mousedown',function(evt){
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragStart = ctx.transformedPoint(lastX,lastY);
        dragged = false;
    },false);

    canvas.addEventListener('mousemove',function(evt){
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragged = true;
        if (dragStart){
          var pt = ctx.transformedPoint(lastX,lastY);
          translateX.current += pt.x-dragStart.x
          translateY.current += pt.y-dragStart.y
          dragStart = pt
       }
    },false);

    canvas.addEventListener('mouseup',function(evt){
        dragStart = null;
        console.log(evt)

        ctx.save()
        ctx.translate(translateX.current,translateY.current)   
        ctx.scale(zoomscale.current,zoomscale.current)
        var pt = ctx.transformedPoint(lastX,lastY);
        ctx.restore()

        Object.entries(shipsRef.current).forEach(([shipId, ship]) => {
            if(ship.type==='carrier') {
                let shipX = ship.x + (ship.speed * (timeRef.current - ship.angle.time) * Math.cos(ship.angle.value))
                let shipY = ship.y + (ship.speed * (timeRef.current - ship.angle.time) * Math.sin(ship.angle.value))

                const shipDistance = getDistance(shipX, shipY, pt.x, pt.y)
                if(shipDistance < 8 && ship.owner === userRef.current.id) {
                    const angle = Math.atan2(pt.y - shipY, pt.x - shipX)
                    props.launch(vehicleType.current, "carrier", {shipId}, evt.shiftKey?10:1, angle)
                }
            } else if(ship.type==='commander') {
                let shipX = ship.x + (ship.speed * (timeRef.current - ship.angle.time) * Math.cos(ship.angle.value))
                let shipY = ship.y + (ship.speed * (timeRef.current - ship.angle.time) * Math.sin(ship.angle.value))

                const shipDistance = getDistance(shipX, shipY, pt.x, pt.y)
                if(shipDistance < 8 && ship.owner === userRef.current.id) {
                    const angle = Math.atan2(pt.y - shipY, pt.x - shipX)
                    props.navigate('commander', {shipId}, angle)
                }
            }

        })

        Object.entries(sunsRef.current).forEach(([sunId, sun]) => {
            const sunDistance = getDistance(sun.x, sun.y, pt.x, pt.y)
            if(sunDistance<sun.size) {
                if(sun.owner === userRef.current.id) {
                    const angle = Math.atan2(pt.y - sun.y, pt.x - sun.x)
                    props.navigate('sun', {sunId}, angle)
                }
            } else {

                Object.entries(sun.planets).forEach(([planetId, planet]) => {

                    let planetAngle = planet.angle.value + (timeRef.current * Math.PI/planet.distance * planet.angle.speed);
                    let planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                    let planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                    const planetDistance = getDistance(planetX, planetY, pt.x, pt.y)
                    
                    if(planetDistance<planet.size) {
                        if(planet.owner === userRef.current.id) {
                            const angle = Math.atan2(pt.y - planetY, pt.x - planetX)
                            props.launch(vehicleType.current, "planet", {sunId: sun.id, planetId: planet.id}, evt.shiftKey?10:1, angle)
                        }
                    } else if(planetDistance<500) {

                        Object.entries(planet.moons).forEach(([moonId, moon]) => {

                            let moonAngle = moon.angle.value + (timeRef.current * Math.PI/moon.distance * moon.angle.speed);
                            let moonX = planetX + (moon.distance * Math.sin(moonAngle));
                            let moonY = planetY + (moon.distance * Math.cos(moonAngle));
            
                            const moonDistance = getDistance(moonX, moonY, pt.x, pt.y)
            
                            if(moonDistance<moon.size && moon.owner === userRef.current.id) {
                                const angle = Math.atan2(pt.y - moonY, pt.x - moonX)
                                props.launch(vehicleType.current, "moon", {sunId: sun.id, planetId: planet.id, moonId: moon.id}, evt.shiftKey?10:1,angle)
                            }
                        })
                    }
                })
            }
        })

    },false);

    var zoom = function(clicks) {

        ctx.save()
        ctx.translate(translateX.current,translateY.current)   
        ctx.scale(zoomscale.current,zoomscale.current)
        var pt1 = ctx.transformedPoint(lastX,lastY);
        ctx.restore()

        zoomscale.current += clicks
        zoomscale.current = Math.min(Math.max(zoomscale.current, .1), 8)
        
        ctx.save()
        ctx.translate(translateX.current,translateY.current)   
        ctx.scale(zoomscale.current,zoomscale.current)        
        var pt2 = ctx.transformedPoint(lastX,lastY);
        ctx.restore()

        translateX.current += zoomscale.current * (pt2.x - pt1.x);
        translateY.current += zoomscale.current * (pt2.y - pt1.y);
    }

    var handleScroll = function(evt){
        var delta = evt.wheelDelta ? evt.wheelDelta/400 : evt.detail/10 ? -evt.detail/10 : 0;
        if (delta) zoom(delta);
        return evt.preventDefault() && false;
    };
  
    canvas.addEventListener('DOMMouseScroll',handleScroll,false);
    canvas.addEventListener('mousewheel',handleScroll,false);

    window.addEventListener("keypress", (e) => {
        if(e.code==='Space') {
            initViewport()
        }
    }, false);

    const rgb = (r, g, b) => "rgb("+r+","+g+","+b+")"

    setInterval( () => {      
                
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // User view window
        ctx.save()
        ctx.translate(translateX.current,translateY.current)   
        ctx.scale(zoomscale.current,zoomscale.current)

        // Background stars
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, 1, 0, 2 * Math.PI);
            ctx.fillStyle = star.color;
            ctx.fill();
        })

        // Draw suns
        Object.entries(sunsRef.current).forEach(([sunId, sun]) => {

            // Sun name
            ctx.font = '35pt Calibri';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgb(255, 255, 0, ' + 1/(10*zoomscale.current) + ')';
            const farthestPlanet = Object.entries(sun.planets).map(([planetId, planet]) => planet.distance).reduce((a, b) => Math.max(a, b), 0)
            ctx.fillText(sun.name, sun.x, sun.y-farthestPlanet-50);

            // Sun
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, sun.size, 0, 2 * Math.PI);
            ctx.fillStyle = "yellow";
            ctx.fill();

            // Draw orbits
            if(zoomscale.current>.3) {
                Object.entries(sun.planets).forEach(([planetId, planet]) => {
                    let planetAngle = planet.angle.value + (timeRef.current * Math.PI/planet.distance * planet.angle.speed);
                    let planetX = sun.x + (planet.distance * Math.sin(planetAngle))
                    let planetY = sun.y + (planet.distance * Math.cos(planetAngle))

                    // Planet orbit
                    ctx.beginPath();
                    ctx.arc(sun.x, sun.y, planet.distance, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#3F3F3F55";
                    ctx.stroke();

                    // Moon orbits
                    if(zoomscale.current>.15) {
                        Object.entries(planet.moons).forEach(([moonId, moon]) => {
                            ctx.beginPath();
                            ctx.arc(planetX, planetY, moon.distance, 0, 2 * Math.PI);
                            ctx.strokeStyle = "#3F3F3F55";
                            ctx.stroke();
                        })
                    }  
                })
            }
        })

        // Ships
        if(zoomscale.current>.1) {
            Object.entries(shipsRef.current).forEach(([shipId, ship]) => {
                let shipX = ship.x + (ship.speed * (timeRef.current - ship.angle.time) * Math.cos(ship.angle.value))
                let shipY = ship.y + (ship.speed * (timeRef.current - ship.angle.time) * Math.sin(ship.angle.value))

                // Smoother ship turning
                let shipAngle = ship.angle.value
                if(ship.prevAngle) {
                    let turnAngle = ship.angle.value - ship.prevAngle.value
                    while(turnAngle>Math.PI) turnAngle -= Math.PI * 2
                    while(turnAngle<-Math.PI) turnAngle += Math.PI * 2   
                    shipAngle -= (turnAngle/10) * Math.max(0, 10-(timeRef.current - ship.prevAngle.time)*20)
                }

                ctx.save();
                ctx.translate(shipX, shipY);
                ctx.rotate(shipAngle);

                ctx.fillStyle = ship.owner === userRef.current.id ? "green" : "red";
                if(ship.type==='fighter') {
                    ctx.beginPath();
                    ctx.moveTo(-4, -2);
                    ctx.lineTo(4, 0);
                    ctx.lineTo(-4, 2);
                    ctx.fill();
                } else if(ship.type==='missle') {
                    ctx.beginPath();
                    ctx.moveTo(-2, -.5);
                    ctx.lineTo(-2, .5);
                    ctx.lineTo(2, .5);
                    ctx.lineTo(3, 0);
                    ctx.lineTo(2, -.5);
                    ctx.fill();
                } else if(ship.type==='carrier') {
                    ctx.beginPath();
                    ctx.moveTo(3*-2, 3*(-2+-.5));
                    ctx.lineTo(3*-2, 3*(-2+.5));
                    ctx.lineTo(3*2, 3*(-2+.5));
                    ctx.lineTo(3*3, 3*(-2+0));
                    ctx.lineTo(3*2, 3*(-2+-.5));
                    ctx.fill();
    
                    ctx.beginPath();
                    ctx.moveTo(3*-2, 3*(2+-.5));
                    ctx.lineTo(3*-2, 3*(2+.5));
                    ctx.lineTo(3*2, 3*(2+.5));
                    ctx.lineTo(3*3, 3*(2+0));
                    ctx.lineTo(3*2, 3*(2+-.5));
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(0, 0, 7.5, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.rotate(Math.PI/2);
                    ctx.font = '5pt Calibri';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'white';
                    ctx.fillText(ship.strength, 0, 2);                

                } else if(ship.type==='commander') {
                    ctx.beginPath();
                    ctx.moveTo(-3,-3);
                    ctx.lineTo(-3,3);
                    ctx.lineTo(3,3);
                    ctx.lineTo(3,-3);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(0, 0, 3.5, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.arc(0, 0, 2.5, 0, 2 * Math.PI);
                    ctx.lineWidth = "0.5";
                    ctx.strokeStyle = "black"
                    ctx.stroke();

                }
                ctx.restore()  
            })
        }

        // Planets
        Object.entries(sunsRef.current).forEach(([sunId, sun]) => {

            Object.entries(sun.planets).forEach(([planetId, planet]) => {
                let planetAngle = planet.angle.value + (timeRef.current * Math.PI/planet.distance * planet.angle.speed);
                let planetStrength = planet.owner ? Math.min(planet.strength.max, planet.strength.value + ((timeRef.current-planet.strength.time) * planet.strength.speed)) : 0
                let planetX = sun.x + (planet.distance * Math.sin(planetAngle))
                let planetY = sun.y + (planet.distance * Math.cos(planetAngle))

                // Planet shadow
                if(zoomscale.current>1) {
                    var grd = ctx.createRadialGradient(planetX, planetY, 0, planetX, planetY, planet.size*2);
                    grd.addColorStop(0, "rgb(0,0,0,1)");
                    grd.addColorStop(1, "rgb(0,0,0,0)");
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.arc(planetX, planetY, planet.size*2, 0, 2 * Math.PI);
                    ctx.fill();
                }
    
                // Planet
                ctx.beginPath();
                ctx.arc(planetX, planetY, planet.size, 0, 2 * Math.PI);
                ctx.fillStyle = planet.owner ? (planet.owner===userRef.current.id ? rgb(0, 55+Math.min(200, planetStrength), 0) : rgb(55+Math.min(200, planetStrength), 0, 0)): "gray";
                ctx.fill();

                // Planet strength
                if(zoomscale.current>.75 && planetStrength> 0) { 
                    ctx.font = '5pt Calibri';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'white';
                    ctx.fillText(Math.round(planetStrength), planetX, planetY+2);                
                }

                // Draw moons
                if(zoomscale.current>.15) {
                    Object.entries(planet.moons).forEach(([moonId, moon]) => {
                        const moonAngle = moon.angle.value + (timeRef.current * Math.PI/moon.distance * moon.angle.speed);
                        const moonStrength = moon.owner ? Math.min(moon.strength.max, moon.strength.value + ((timeRef.current-moon.strength.time) * moon.strength.speed)) : 0
                        const moonX = planetX + (moon.distance * Math.sin(moonAngle))
                        const moonY = planetY + (moon.distance * Math.cos(moonAngle))

                        // Moon shadow
                        if(zoomscale.current>1) {
                            var grd = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moon.size*2);
                            grd.addColorStop(0, "rgb(0,0,0,1)");
                            grd.addColorStop(1, "rgb(0,0,0,0)");
                            ctx.fillStyle = grd;
                            ctx.beginPath();
                            ctx.arc(moonX, moonY, moon.size*2, 0, 2 * Math.PI);
                            ctx.fill();
                        }

                        // Moon
                        ctx.beginPath();
                        ctx.arc(moonX, moonY, moon.size, 0, 2 * Math.PI);
                        ctx.fillStyle = moon.owner ? (moon.owner===userRef.current.id ? rgb(0, 55+Math.min(200, moonStrength), 0) : rgb(55+Math.min(200, moonStrength), 0, 0)): "gray";
                        ctx.fill();

                        // Moon strength
                        if(zoomscale.current>.75 && moonStrength> 0) { 
                            ctx.font = '3pt Calibri';
                            ctx.textAlign = 'center';
                            ctx.fillStyle = 'white';
                            ctx.fillText(Math.round(moonStrength), moonX, moonY+1);                
                        }

                    })
                }    
            })
        })

        // Draw sun hase
        Object.entries(sunsRef.current).forEach(([sunId, sun]) => {
            if(sun.owner) {
                var grd = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 750);
                grd.addColorStop(0, sun.owner === userRef.current.id ? "rgb(0,255,0,.10)" : "rgb(255,0,0,.10)");
                grd.addColorStop(1, "rgb(0,0,0,0)");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(sun.x, sun.y, 750, 0, 2 * Math.PI);
                ctx.fill();
            }

            var grd = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 100);
            grd.addColorStop(0, "rgb(255,255,0, .25)");
            grd.addColorStop(1, "rgb(0,0,0,0)");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, 100, 0, 2 * Math.PI);
            ctx.fill();
        })        

        ctx.restore()

    }, 100)
  }, []);

  return (
    <div id='galaxy'>
        <Toolbar
            changeVehicle={type => vehicleType.current = type}
        ></Toolbar>
        <canvas id="galaxy_canvas"></canvas>
    </div>
  );
}

export default Galaxy;
