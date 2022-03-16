import React, {useEffect, useState, useRef} from 'react';

const stars = []
for(let x=0; x<1000; x++) {
    stars.push({
        x: Math.random() * 5000,
        y: Math.random() * 5000,
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

  useEffect(() => {
    setInterval( () => { timeRef.current += .1 }, 100)
  }, [])

  useEffect(() => {
    timeRef.current = props.time
  }, [props.time])

  useEffect(() => {
    sunsRef.current = props.suns
  }, [props.suns])

  useEffect(() => {
    userRef.current = props.user
  }, [props.user])

  useEffect(() => {
    shipsRef.current = props.ships
  })

  useEffect(() => {

    const canvas = document.getElementById('galaxy');
    const ctx = canvas.getContext('2d');

    // borrowed from https://gist.github.com/dzhang123/2a3a611b3d75a45a3f41
    let svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    let xform = svg.createSVGMatrix();

    let zoomscale = 1.0;
    let translateX = 0;
    let translateY = 0;
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
          translateX += pt.x-dragStart.x
          translateY += pt.y-dragStart.y
          dragStart = pt
        }
    },false);

    canvas.addEventListener('mouseup',function(evt){
        dragStart = null;

        ctx.save()
        ctx.translate(translateX,translateY)   
        ctx.scale(zoomscale,zoomscale)        
        var pt = ctx.transformedPoint(lastX,lastY);
        ctx.restore()

        // TODO take short
        Object.entries(sunsRef.current).forEach(([sunId, sun]) => {
            Object.entries(sun.planets).forEach(([planetId, planet]) => {

                let planetAngle = planet.angle.value + (timeRef.current * Math.PI/planet.distance * planet.angle.speed);
                let planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                let planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                const planetDistance = getDistance(planetX, planetY, pt.x, pt.y)
                
                if(planetDistance<planet.size) {
                    const angle = Math.atan2(pt.y - planetY, pt.x - planetX)
                    // TODO move this randomization to the server
                    const randomizedAngle = angle + (Math.random() * (Math.PI / 20)) - (Math.PI / 40)

                    props.launchFighter("planet", {sun, planet}, randomizedAngle)
                } else if(planetDistance<500) {

                    Object.entries(planet.moons).forEach(([moonId, moon]) => {

                        let moonAngle = moon.angle.value + (timeRef.current * Math.PI/moon.distance * moon.angle.speed);
                        let moonX = planetX + (moon.distance * Math.sin(moonAngle));
                        let moonY = planetY + (moon.distance * Math.cos(moonAngle));
        
                        const moonDistance = getDistance(moonX, moonY, pt.x, pt.y)
        
                        if(moonDistance<moon.size) {
                            const angle = Math.atan2(pt.y - moonY, pt.x - moonX)
                            // TODO move this randomization to the server
                            const randomizedAngle = angle + (Math.random() * (Math.PI / 20)) - (Math.PI / 40)

                            props.launchFighter("moon", {sun, planet, moon}, randomizedAngle)
                        }
                    })
                }
            })
        })

    },false);

    var zoom = function(clicks) {

        ctx.save()
        ctx.translate(translateX,translateY)   
        ctx.scale(zoomscale,zoomscale)        
        var pt1 = ctx.transformedPoint(lastX,lastY);
        ctx.restore()

        zoomscale += clicks
        zoomscale = Math.min(Math.max(zoomscale, .1), 8)
        
        ctx.save()
        ctx.translate(translateX,translateY)   
        ctx.scale(zoomscale,zoomscale)        
        var pt2 = ctx.transformedPoint(lastX,lastY);
        ctx.restore()

        translateX += zoomscale * (pt2.x - pt1.x);
        translateY += zoomscale * (pt2.y - pt1.y);

    }

    var handleScroll = function(evt){
        var delta = evt.wheelDelta ? evt.wheelDelta/400 : evt.detail/10 ? -evt.detail/10 : 0;
        if (delta) zoom(delta);
        return evt.preventDefault() && false;
    };
  
    canvas.addEventListener('DOMMouseScroll',handleScroll,false);
    canvas.addEventListener('mousewheel',handleScroll,false);

    const rgb = (r, g, b) => "rgb("+r+","+g+","+b+")"

    setInterval( () => {      
                
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save()
        ctx.translate(translateX,translateY)   
        ctx.scale(zoomscale,zoomscale)        

        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, 1, 0, 2 * Math.PI);
            ctx.fillStyle = star.color;
            ctx.fill();
        })

        Object.entries(shipsRef.current).forEach(([shipId, ship]) => {
            let shipX = ship.x + (8 * (timeRef.current - ship.angle.time) * Math.cos(ship.angle.value))
            let shipY = ship.y + (8 * (timeRef.current - ship.angle.time) * Math.sin(ship.angle.value))

            ctx.save();
            ctx.translate(shipX, shipY);
            ctx.rotate(ship.angle.value);
            ctx.beginPath();
            ctx.moveTo(-4, -2);
            ctx.lineTo(4, 0);
            ctx.lineTo(-4, 2);
            console.log(ship.owner, userRef.current.id )
            ctx.fillStyle = ship.owner === userRef.current.id ? "green" : "red";
            ctx.fill();
            ctx.restore()  
        })

        Object.entries(sunsRef.current).forEach(([sunId, sun]) => {
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, sun.size, 0, 2 * Math.PI);
            ctx.fillStyle = "yellow";
            ctx.fill();

            Object.entries(sun.planets).forEach(([planetId, planet]) => {
                let planetAngle = planet.angle.value + (timeRef.current * Math.PI/planet.distance * planet.angle.speed);
                let planetStrength = planet.owner ? planet.strength.value + Math.min(100, ((timeRef.current-planet.strength.time) * 1)) : 0
                let planetX = sun.x + (planet.distance * Math.sin(planetAngle))
                let planetY = sun.y + (planet.distance * Math.cos(planetAngle))

                ctx.beginPath();
                ctx.arc(sun.x, sun.y, planet.distance, 0, 2 * Math.PI);
                ctx.strokeStyle = "#3F3F3F";
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(planetX, planetY, planet.size, 0, 2 * Math.PI);
                ctx.fillStyle = planet.owner ? (planet.owner===userRef.current.id ? rgb(0, 55+Math.min(200, planetStrength), 0) : rgb(55+Math.min(200, planetStrength), 0, 0)): "gray";
                ctx.fill();

                Object.entries(planet.moons).forEach(([moonId, moon]) => {
                    let moonAngle = moon.angle.value + (timeRef.current * Math.PI/moon.distance * moon.angle.speed);
                    let moonStrength = moon.owner ? moon.strength.value + Math.min(100, ((timeRef.current-moon.strength.time) * 1)) : 0

                    ctx.beginPath();
                    ctx.arc(planetX, planetY, moon.distance, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#3F3F3F";
                    ctx.stroke();
    
                    ctx.beginPath();
                    ctx.arc(planetX + (moon.distance * Math.sin(moonAngle)), planetY + (moon.distance * Math.cos(moonAngle)), moon.size, 0, 2 * Math.PI);
                    ctx.fillStyle = moon.owner ? (moon.owner===userRef.current.id ? rgb(0, 55+Math.min(200, moonStrength), 0) : rgb(55+Math.min(200, moonStrength), 0, 0)): "gray";
                    ctx.fill();
                })
    
            })
        })

        ctx.restore()

    }, 100)
  }, []);

  return (
      <div>
        <canvas id="galaxy"></canvas>
    </div>
  );
}

export default Galaxy;
