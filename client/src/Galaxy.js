import React, { useEffect, useRef } from "react";
import Toolbar from "./components/Toolbar.js";
const stars = [];
for (let x = 0; x < 1000; x++) {
  stars.push({
    x: Math.random() * 30000 - 10000,
    y: Math.random() * 30000 - 10000,
    color: ["#FFFFE0", "#FFFACD", "#FAFAD2", "#FFFF99", "#FFFFCC"][
      Math.round(Math.random() * 5)
    ],
  });
}

var getDistance = (x1, y1, x2, y2) => {
  let dy = x2 - x1;
  let dx = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

function Galaxy(props) {
  const timeRef = useRef(0);
  const sunsRef = useRef({});
  const shipsRef = useRef({});
  const userRef = useRef({});
  const allianceRef = useRef([]);

  const explosionsRef = useRef({});

  let vehicleType = useRef("fighter");

  let zoomscale = useRef(1);
  let zoomscaleTarget = useRef(1);
  let viewportRef = useRef({x:0, y:0, width:0, height:0});

  let centerX = useRef(0);
  let centerY = useRef(0);

  let lastSun = useRef(null);

  var initViewport = () => {
    const canvas = document.getElementById("galaxy_canvas");

    // Initialize user viewport
    if (lastSun.current === null) {
      Object.values(sunsRef.current).forEach(sun => {
        Object.values(sun.planets).forEach(planet => {
          if (allianceRef.current.userIds.includes(planet.owner)) {
            let planetAngle =
              planet.angle.value +
              ((timeRef.current * Math.PI) / planet.distance) *
                planet.angle.speed;
            let planetX = sun.x + planet.distance * Math.sin(planetAngle);
            let planetY = sun.y + planet.distance * Math.cos(planetAngle);

            const canvas = document.getElementById("galaxy_canvas");
            centerX.current = planetX;
            centerY.current = planetY;
          }
        });
      });
    } else {
      centerX.current = sunsRef.current[lastSun.current].x;
      centerY.current = sunsRef.current[lastSun.current].y;
    }

    zoomscaleTarget.current = 1;

    // Recalculate viewport for minimap
    const ctx = canvas.getContext("2d");
    if(ctx.transformedPoint) {
        ctx.save()
        ctx.translate(centerX.current - canvas.width / 2, centerY.current - canvas.height / 2);
        ctx.scale(zoomscale.current, zoomscale.current);
        var tl = ctx.transformedPoint(0, 0);
        var br = ctx.transformedPoint(canvas.width, canvas.height);
        props.viewportChange(tl.x, tl.y, br.x-tl.x, br.y-tl.y)
        ctx.restore()
    }
  };

  useEffect(() => {
    setInterval(() => {
      timeRef.current += 0.1;
    }, 100);
  }, []);

  useEffect(() => {
    timeRef.current = props.time;
  }, [props.time]);

  useEffect(() => {
      // TODO
    const canvas = document.getElementById("galaxy_canvas");
    centerX.current = props.minimapViewport.x;
    centerY.current = props.minimapViewport.y;

    const ctx = canvas.getContext("2d");
    if(ctx.transformedPoint) {
        ctx.save()
        ctx.translate(-centerX.current + (canvas.width/2), -centerY.current + (canvas.height/2));
        ctx.scale(zoomscale.current, zoomscale.current);
        var tl = ctx.transformedPoint(0, 0);
        var br = ctx.transformedPoint(canvas.width, canvas.height);
        props.viewportChange(tl.x, tl.y, br.x-tl.x, br.y-tl.y)
        ctx.restore()
    }

}, [props.minimapViewport]);

  useEffect(() => {
    explosionsRef.current = props.explosions;
  }, [props.explosions]);

  useEffect(() => {
    allianceRef.current = props.alliance;
  }, [props.alliance]);
  
  useEffect(() => {
    const isInitialLoad = Object.values(sunsRef.current).length === 0;
    sunsRef.current = props.suns;
    if (isInitialLoad) {
      initViewport();
    }
  }, [props.suns]);

  useEffect(() => {
    userRef.current = props.user;
  }, [props.user]);

  useEffect(() => {
    shipsRef.current = props.ships;
    }, [props.ships]);

  useEffect(() => {
    const canvas = document.getElementById("galaxy_canvas");
    const ctx = canvas.getContext("2d");

    let lastX = canvas.width / 2;
    let lastY = canvas.height / 2;
    let startX = null;
    let startY = null;
    let dragStart, dragged;

    canvas.addEventListener(
      "mousedown",
      function (evt) {
        document.body.style.mozUserSelect =
          document.body.style.webkitUserSelect =
          document.body.style.userSelect =
            "none";
        lastX = evt.offsetX || evt.pageX - canvas.offsetLeft;
        lastY = evt.offsetY || evt.pageY - canvas.offsetTop;
        startX = evt.offsetX || evt.pageX - canvas.offsetLeft;
        startY = evt.offsetY || evt.pageY - canvas.offsetTop;
        dragStart = ctx.transformedPoint(lastX, lastY);
        dragged = false;
      },
      false
    );

    canvas.addEventListener(
      "mousemove",
      function (evt) {
        lastX = evt.offsetX || evt.pageX - canvas.offsetLeft;
        lastY = evt.offsetY || evt.pageY - canvas.offsetTop;
        dragged = true;
        if (dragStart) {
          var pt = ctx.transformedPoint(lastX, lastY);
          centerX.current += dragStart.x - pt.x;
          centerY.current += dragStart.y - pt.y;
          dragStart = pt;

          // Recalculate viewport for minimap
          ctx.save();
          ctx.translate(-centerX.current + (canvas.width/2), -centerY.current + (canvas.height/2));
          ctx.scale(zoomscale.current, zoomscale.current);
          var tl = ctx.transformedPoint(0, 0);
          var br = ctx.transformedPoint(canvas.width, canvas.height);
          props.viewportChange(tl.x, tl.y, br.x-tl.x, br.y-tl.y)
          ctx.restore()

        }
      },
      false
    );

    canvas.addEventListener(
      "mouseup",
      function (evt) {
        dragStart = null;

        // TODO ignore if dragged a small distance
        if (!dragged || getDistance(startX, startY, lastX, lastY)<10) {
          ctx.save();
          ctx.translate(-centerX.current + (canvas.width/2), -centerY.current + (canvas.height/2));
          ctx.scale(zoomscale.current, zoomscale.current);

          var pt = ctx.transformedPoint(lastX, lastY);

          // Recalculate viewport for minimap
          var tl = ctx.transformedPoint(0, 0);
          var br = ctx.transformedPoint(canvas.width, canvas.height);
          props.viewportChange(tl.x, tl.y, br.x-tl.x, br.y-tl.y)

          ctx.restore();

          Object.values(shipsRef.current).forEach(ship => {
            if (
              ship.type === "carrier" ||
              ship.type === "carrier2" ||
              ship.type === "carrier3"
            ) {
              let shipX =
                ship.x +
                ship.speed *
                  (timeRef.current - ship.angle.time) *
                  Math.cos(ship.angle.value);
              let shipY =
                ship.y +
                ship.speed *
                  (timeRef.current - ship.angle.time) *
                  Math.sin(ship.angle.value);

              const shipDistance = getDistance(shipX, shipY, pt.x, pt.y);
              if (shipDistance < 8 && allianceRef.current.userIds.includes(ship.owner)) {
                const angle = Math.atan2(pt.y - shipY, pt.x - shipX);
                props.launch(
                  vehicleType.current,
                  "carrier",
                  { shipId:ship.id },
                  evt.shiftKey ? 10 : 1,
                  angle
                );
              }
            } else if (ship.type === "commander") {
              let shipX =
                ship.x +
                ship.speed *
                  (timeRef.current - ship.angle.time) *
                  Math.cos(ship.angle.value);
              let shipY =
                ship.y +
                ship.speed *
                  (timeRef.current - ship.angle.time) *
                  Math.sin(ship.angle.value);

              const shipDistance = getDistance(shipX, shipY, pt.x, pt.y);
              if (shipDistance < 8 && allianceRef.current.userIds.includes(ship.owner)) {
                const angle = Math.atan2(pt.y - shipY, pt.x - shipX);
                props.navigate("commander", { shipId:ship.id }, angle);
              }
            }
          });

          Object.values(sunsRef.current).forEach(sun => {
            const sunDistance = getDistance(sun.x, sun.y, pt.x, pt.y);
            if (sunDistance < sun.size) {
              if (allianceRef.current.userIds.includes(sun.owner)) {
                const angle = Math.atan2(pt.y - sun.y, pt.x - sun.x);
                props.navigate("sun", { sunId:sun.id }, angle);
              }
            } else {
              Object.values(sun.planets).forEach(planet => {
                let planetAngle =
                  planet.angle.value +
                  ((timeRef.current * Math.PI) / planet.distance) *
                    planet.angle.speed;
                let planetX = sun.x + planet.distance * Math.cos(planetAngle);
                let planetY = sun.y + planet.distance * Math.sin(planetAngle);

                const planetDistance = getDistance(
                  planetX,
                  planetY,
                  pt.x,
                  pt.y
                );

                if (planetDistance < planet.size) {
                  if (allianceRef.current.userIds.includes(planet.owner)) {
                    lastSun.current = sun.id;
                    if (
                      vehicleType.current === "shield" ||
                      vehicleType.current === "shield2" ||
                      vehicleType.current === "shield3"
                    ) {
                      props.planitaryShield(
                        sun.id,
                        planet.id,
                        vehicleType.current
                      );
                    } else {
                      const angle = Math.atan2(pt.y - planetY, pt.x - planetX);
                      props.launch(
                        vehicleType.current,
                        "planet",
                        { sunId: sun.id, planetId: planet.id },
                        evt.shiftKey ? 10 : 1,
                        angle
                      );
                    }
                  }
                } else if (planetDistance < 500) {
                  Object.values(planet.moons).forEach(moon => {
                    let moonAngle =
                      moon.angle.value +
                      ((timeRef.current * Math.PI) / moon.distance) *
                        moon.angle.speed;
                    let moonX = planetX + moon.distance * Math.cos(moonAngle);
                    let moonY = planetY + moon.distance * Math.sin(moonAngle);

                    const moonDistance = getDistance(moonX, moonY, pt.x, pt.y);

                    if (
                      moonDistance < moon.size &&
                      allianceRef.current.userIds.includes(moon.owner)
                    ) {
                      if (
                        vehicleType.current === "shield" ||
                        vehicleType.current === "shield2" ||
                        vehicleType.current === "shield3"
                      ) {
                        // no shields on moons
                        // TODO server validation
                      } else {
                        lastSun.current = sun.id;
                        const angle = Math.atan2(pt.y - moonY, pt.x - moonX);
                        props.launch(
                          vehicleType.current,
                          "moon",
                          {
                            sunId: sun.id,
                            planetId: planet.id,
                            moonId: moon.id,
                          },
                          evt.shiftKey ? 10 : 1,
                          angle
                        );
                      }
                    }
                  });
                }
              });
            }
          });
        }
      },
      false
    );

    var zoom = function (clicks) {
      zoomscaleTarget.current += clicks;
      zoomscaleTarget.current = Math.min(Math.max(zoomscaleTarget.current, 0.1), 8);

      // Recalculate viewport for minimap
      ctx.save();
      ctx.translate(-centerX.current, -centerY.current);
      ctx.scale(zoomscale.current, zoomscale.current);
      ctx.translate((canvas.clientWidth)/2, (canvas.clientHeight)/2);

      var tl = ctx.transformedPoint(0, 0);
      var br = ctx.transformedPoint(canvas.clientWidth, canvas.clientHeight);
      // TODO: use a useEffect to call this prop
      viewportRef.current = {x:tl.x, y:tl.y, width:br.x-tl.x, height:br.y-tl.y}
      props.viewportChange(tl.x, tl.y, br.x-tl.x, br.y-tl.y)
      ctx.restore();
    };

    var handleScroll = function (evt) {
      var delta = evt.wheelDelta
        ? evt.wheelDelta / 400
        : evt.detail / 10
        ? -evt.detail / 10
        : 0;
      if (delta) zoom(delta);
      return evt.preventDefault() && false;
    };

    canvas.addEventListener("DOMMouseScroll", handleScroll, false);
    canvas.addEventListener("mousewheel", handleScroll, false);

    window.addEventListener(
      "keypress",
      (e) => {
        if (e.code === "Space") {
          initViewport();
        }
      },
      false
    );

    const rgb = (r, g, b) => "rgb(" + r + "," + g + "," + b + ")";

    setInterval(() => {

        console.log("center", centerX.current, centerY.current)
      zoomscale.current = (zoomscale.current + zoomscaleTarget.current) / 2

      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Background stars
      ctx.save();
      ctx.translate(-centerX.current + (viewportRef.current.width/2), -centerY.current + (viewportRef.current.height/2));
      ctx.scale(zoomscale.current*.8, zoomscale.current*.8);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = star.color;
        ctx.fill();
      });
      ctx.restore();

      // User view window
      ctx.save();
      ctx.translate(-centerX.current, -centerY.current);
      ctx.scale(zoomscale.current, zoomscale.current);
      //ctx.translate((canvas.width) / 2, (canvas.height) / 2);

      // Grid
      for(let x=-100000; x<100000; x+=10000) {
        ctx.strokeStyle = "rgb(13,202,240,.5)";
        ctx.beginPath();
        ctx.moveTo(x, -100000);
        ctx.lineTo(x, 100000);
        ctx.stroke();
        }
        for(let y=-100000; y<100000; y+=10000) {
            ctx.strokeStyle = "rgb(13,202,240,.5)";
            ctx.beginPath();
            ctx.moveTo(-100000, y);
            ctx.lineTo(100000, y);
            ctx.stroke();
        }
        for(let x=-100000; x<100000; x+=1000) {
            ctx.strokeStyle = "rgb(13,202,240," + (1 / (40 * zoomscale.current)) + ")";
            ctx.beginPath();
            ctx.moveTo(x, -100000);
            ctx.lineTo(x, 100000);
            ctx.stroke();
            }
            for(let y=-100000; y<100000; y+=1000) {
                ctx.strokeStyle = "rgb(13,202,240," + (1 / (40 * zoomscale.current)) + ")";
                ctx.beginPath();
                ctx.moveTo(-100000, y);
                ctx.lineTo(100000, y);
                ctx.stroke();
            }
            
      // Draw suns
      Object.values(sunsRef.current).forEach(sun => {
        // Sun name
        ctx.font = "35pt Calibri";
        ctx.textAlign = "center";
        ctx.fillStyle =
          "rgb(255, 255, 0, " + 1 / (10 * zoomscale.current) + ")";
        const farthestPlanet = Object.values(sun.planets)
          .map(planet => planet.distance)
          .reduce((a, b) => Math.max(a, b), 0);
        ctx.fillText(sun.name, sun.x, sun.y - farthestPlanet - 50);

        // Sun
        if (sun.dark) {
          ctx.beginPath();
          ctx.arc(sun.x, sun.y, sun.size, 0, 2 * Math.PI);
          ctx.fillStyle = "dark gray";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(sun.x, sun.y, sun.size, 0, 2 * Math.PI);
          ctx.fillStyle = "yellow";
          ctx.fill();
        }

        // Draw orbits
        if (zoomscale.current > 0.3) {
          Object.values(sun.planets).forEach(planet => {
            let planetAngle =
              planet.angle.value +
              ((timeRef.current * Math.PI) / planet.distance) *
                planet.angle.speed;
            let planetX = sun.x + planet.distance * Math.cos(planetAngle);
            let planetY = sun.y + planet.distance * Math.sin(planetAngle);

            // Planet orbit
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, planet.distance, 0, 2 * Math.PI);
            ctx.strokeStyle = "#3F3F3F55";
            ctx.stroke();

            // Moon orbits
            if (zoomscale.current > 0.15) {
              Object.values(planet.moons).forEach(moon => {
                ctx.beginPath();
                ctx.arc(planetX, planetY, moon.distance, 0, 2 * Math.PI);
                ctx.strokeStyle = "#3F3F3F55";
                ctx.stroke();
              });
            }
          });
        }
      });

      // Ships
      if (zoomscale.current > 0.1) {
        Object.values(shipsRef.current).forEach(ship => {
          let shipX =
            ship.x +
            ship.speed *
              (timeRef.current - ship.angle.time) *
              Math.cos(ship.angle.value);
          let shipY =
            ship.y +
            ship.speed *
              (timeRef.current - ship.angle.time) *
              Math.sin(ship.angle.value);

          // Smoother ship turning
          let shipAngle = ship.angle.value;
          if (ship.prevAngle) {
            let turnAngle = ship.angle.value - ship.prevAngle.value;
            while (turnAngle > Math.PI) turnAngle -= Math.PI * 2;
            while (turnAngle < -Math.PI) turnAngle += Math.PI * 2;
            shipAngle -=
              (turnAngle / 10) *
              Math.max(0, 10 - (timeRef.current - ship.prevAngle.time) * 20);
          }

          ctx.save();
          ctx.translate(shipX, shipY);
          ctx.rotate(shipAngle);

          ctx.fillStyle = allianceRef.current.userIds.includes(ship.owner) ? (ship.owner === userRef.current.id ? "green" : "blue") : "red";
          ctx.strokeStyle = allianceRef.current.userIds.includes(ship.owner) ? (ship.owner === userRef.current.id ? "green" : "blue") : "red";
          if (ship.type === "fighter") {
            ctx.beginPath();
            ctx.moveTo(-4, -2);
            ctx.lineTo(4, 0);
            ctx.lineTo(-4, 2);
            ctx.fill();
          } else if (
            ship.type === "missile" ||
            ship.type === "missile2" ||
            ship.type === "missile3" ||
            ship.type === "missile4"
          ) {
            ctx.beginPath();
            ctx.moveTo(-2, -0.5);
            ctx.lineTo(-2, 0.5);
            ctx.lineTo(2, 0.5);
            ctx.lineTo(3, 0);
            ctx.lineTo(2, -0.5);
            ctx.fill();
            if (ship.type === "missile2") {
              ctx.beginPath();
              ctx.lineTo(4, 0.5);
              ctx.lineTo(5, 0);
              ctx.lineTo(4, -0.5);
              ctx.stroke();
            }
            if (ship.type === "missile3") {
              ctx.beginPath();
              ctx.lineTo(1, 1);
              ctx.lineTo(4, 0.5);
              ctx.lineTo(5, 0);
              ctx.lineTo(4, -0.5);
              ctx.lineTo(1, -1);
              ctx.stroke();
            }
          } else if (
            ship.type === "carrier" ||
            ship.type === "carrier2" ||
            ship.type === "carrier3"
          ) {
            ctx.beginPath();
            ctx.moveTo(3 * -2, 3 * (-2 + -0.5));
            ctx.lineTo(3 * -2, 3 * (-2 + 0.5));
            ctx.lineTo(3 * 2, 3 * (-2 + 0.5));
            ctx.lineTo(3 * 3, 3 * (-2 + 0));
            ctx.lineTo(3 * 2, 3 * (-2 + -0.5));
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(3 * -2, 3 * (2 + -0.5));
            ctx.lineTo(3 * -2, 3 * (2 + 0.5));
            ctx.lineTo(3 * 2, 3 * (2 + 0.5));
            ctx.lineTo(3 * 3, 3 * (2 + 0));
            ctx.lineTo(3 * 2, 3 * (2 + -0.5));
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 7.5, 0, 2 * Math.PI);
            ctx.fill();

            ctx.rotate(Math.PI / 2);
            ctx.font = "5pt Calibri";
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            ctx.fillText(ship.strength, 0, 2);
          } else if (ship.type === "commander") {
            ctx.beginPath();
            ctx.moveTo(-3, -3);
            ctx.lineTo(-3, 3);
            ctx.lineTo(3, 3);
            ctx.lineTo(3, -3);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, 2 * Math.PI);
            ctx.fill();

            ctx.arc(0, 0, 2.5, 0, 2 * Math.PI);
            ctx.lineWidth = "0.5";
            ctx.strokeStyle = "black";
            ctx.stroke();
          }
          ctx.restore();
        });
      }

      // Planets
      Object.values(sunsRef.current).forEach(sun => {
        Object.values(sun.planets).forEach(planet => {
          let planetAngle =
            planet.angle.value +
            ((timeRef.current * Math.PI) / planet.distance) *
              planet.angle.speed;
          let planetStrength = planet.owner
            ? Math.min(
                planet.strength.max,
                planet.strength.value +
                  (timeRef.current - planet.strength.time) *
                    planet.strength.speed
              )
            : 0;
          let planetX = sun.x + planet.distance * Math.cos(planetAngle);
          let planetY = sun.y + planet.distance * Math.sin(planetAngle);

          // Planet shadow
          if (zoomscale.current > 1) {
            var grd = ctx.createRadialGradient(
              planetX,
              planetY,
              0,
              planetX,
              planetY,
              planet.size * 2
            );
            grd.addColorStop(0, "rgb(0,0,0,1)");
            grd.addColorStop(1, "rgb(0,0,0,0)");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(planetX, planetY, planet.size * 2, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Planet
          ctx.beginPath();
          ctx.arc(planetX, planetY, planet.size, 0, 2 * Math.PI);
          ctx.fillStyle = planet.owner
            ? allianceRef.current.userIds.includes(planet.owner)
              ? (planet.owner === userRef.current.id ? rgb(0, 55 + Math.min(200, planetStrength), 0) 
              : rgb(0, 0, 55 + Math.min(200, planetStrength)))
              : rgb(55 + Math.min(200, planetStrength), 0, 0)
            : "gray";
          ctx.fill();

          if (planet.strength.max >= 125) {
            ctx.beginPath();
            ctx.arc(planetX, planetY, planet.size + 2, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgb(255,255,0,.5)";
            ctx.stroke();
          }
          if (planet.strength.max >= 150) {
            ctx.beginPath();
            ctx.arc(planetX, planetY, planet.size + 4, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgb(255,255,0,.5)";
            ctx.stroke();
          }
          if (planet.strength.max >= 175) {
            ctx.beginPath();
            ctx.arc(planetX, planetY, planet.size + 6, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgb(255,255,0,.5)";
            ctx.stroke();
          }

          // Planet strength
          if (zoomscale.current > 0.75 && planetStrength > 0) {
            ctx.font = "5pt Calibri";
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            ctx.fillText(Math.round(planetStrength), planetX, planetY + 2);
          }

          // Draw moons
          if (zoomscale.current > 0.15) {
            Object.values(planet.moons).forEach(moon => {
              const moonAngle =
                moon.angle.value +
                ((timeRef.current * Math.PI) / moon.distance) *
                  moon.angle.speed;
              const moonStrength = moon.owner
                ? Math.min(
                    moon.strength.max,
                    moon.strength.value +
                      (timeRef.current - moon.strength.time) *
                        moon.strength.speed
                  )
                : 0;
              const moonX = planetX + moon.distance * Math.cos(moonAngle);
              const moonY = planetY + moon.distance * Math.sin(moonAngle);

              // Moon shadow
              if (zoomscale.current > 1) {
                var grd = ctx.createRadialGradient(
                  moonX,
                  moonY,
                  0,
                  moonX,
                  moonY,
                  moon.size * 2
                );
                grd.addColorStop(0, "rgb(0,0,0,1)");
                grd.addColorStop(1, "rgb(0,0,0,0)");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(moonX, moonY, moon.size * 2, 0, 2 * Math.PI);
                ctx.fill();
              }

              // Moon
              ctx.beginPath();
              ctx.arc(moonX, moonY, moon.size, 0, 2 * Math.PI);
              ctx.fillStyle = moon.owner
                ? allianceRef.current.userIds.includes(moon.owner)
                  ? (moon.owner === userRef.current.id ? rgb(0, 55 + Math.min(200, moonStrength), 0) 
                  : rgb(0, 0, 55 + Math.min(200, moonStrength)))
                  : rgb(55 + Math.min(200, moonStrength), 0, 0)
                : "gray";
              ctx.fill();

              // Moon strength
              if (zoomscale.current > 0.75 && moonStrength > 0) {
                ctx.font = "3pt Calibri";
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.fillText(Math.round(moonStrength), moonX, moonY + 1);
              }
            });
          }
        });
      });

      // Draw sun hase
      Object.values(sunsRef.current).forEach((sun) => {
        if (sun.owner) {
          var ownerHase = ctx.createRadialGradient(
            sun.x,
            sun.y,
            0,
            sun.x,
            sun.y,
            750
          );
          const transparency = 1/(10 + (zoomscale.current*10))
          ownerHase.addColorStop(
            0,
            allianceRef.current.userIds.includes(sun.owner)
              ? (sun.owner===userRef.current.id ? "rgb(0,255,0,"+transparency+")" : "rgb(0,0,255,"+transparency+")")
              : "rgb(255,0,0,"+transparency+")"
          );
          ownerHase.addColorStop(1, "rgb(0,0,0,0)");
          ctx.fillStyle = ownerHase;
          ctx.beginPath();
          ctx.arc(sun.x, sun.y, 750, 0, 2 * Math.PI);
          ctx.fill();
        }

        if (!sun.dark) {
          var sunHase = ctx.createRadialGradient(
            sun.x,
            sun.y,
            0,
            sun.x,
            sun.y,
            100
          );
          sunHase.addColorStop(0, "rgb(255,255,0, .25)");
          sunHase.addColorStop(1, "rgb(0,0,0,0)");
          ctx.fillStyle = sunHase;
          ctx.beginPath();
          ctx.arc(sun.x, sun.y, 100, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      Object.values(explosionsRef.current).forEach((explosion) => {
        var explosionHase = ctx.createRadialGradient(
          explosion.x,
          explosion.y,
          0,
          explosion.x,
          explosion.y,
          750
        );
        explosionHase.addColorStop(0, "rgb(255,215,0,.10)");
        explosionHase.addColorStop(1, "rgb(0,0,0,0)");
        ctx.fillStyle = explosionHase;
        ctx.beginPath();
        ctx.arc(
          explosion.x,
          explosion.y,
          Math.min(0.5, timeRef.current - explosion.time) * 25,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });

      ctx.restore();
    }, 100);
  }, []);

  return (
    <div id="galaxy">
      <Toolbar
        changeVehicle={(type) => (vehicleType.current = type)}
        centerViewport={initViewport}
        alliance={props.alliance}
        allianceChange={alliance => props.setAlliance(alliance)}
      />
      <canvas id="galaxy_canvas"></canvas>
    </div>
  );
}

export default Galaxy;
