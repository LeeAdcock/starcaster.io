import React, { useEffect, useRef } from "react";

function Map(props) {
  const sunsRef = useRef([]);
  const allianceRef = useRef([]);
  const userRef = useRef([]);
  const viewportRef = useRef({x:0, y:0, w:0, h:0});
  
  const scale = 1/50

  useEffect(() => {
    allianceRef.current = props.alliance;
  }, [props.alliance]);
  
  useEffect(() => {
    sunsRef.current = props.suns;
  }, [props.suns]);

  useEffect(() => {
    userRef.current = props.user;
  }, [props.user]);

  useEffect(() => {
    viewportRef.current = props.viewport;
  }, [props.viewport]);

  useEffect(() => {
    const canvas = document.getElementById("map_canvas");
    const ctx = canvas.getContext("2d");
    let dragStart

    canvas.addEventListener(
        "mousedown",
        function (evt) {
          dragStart = {
              x:evt.offsetX || evt.pageX - canvas.offsetLeft, 
              y:evt.offsetY || evt.pageY - canvas.offsetTop
            }
          props.viewportChange(dragStart.x/scale, dragStart.y/scale) 
        },
        false
      );
  
      canvas.addEventListener(
        "mousemove",
        function (evt) {
          if (dragStart) {
            dragStart = {
                x:evt.offsetX || evt.pageX - canvas.offsetLeft, 
                y:evt.offsetY || evt.pageY - canvas.offsetTop
            }

            props.viewportChange(dragStart.x/scale, dragStart.y/scale) 
          }
        },
        false
      );
  
      canvas.addEventListener(
        "mouseup",
        function (evt) {
          dragStart = null;
        }
      )

    // borrowed from https://gist.github.com/dzhang123/2a3a611b3d75a45a3f41
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let xform = svg.createSVGMatrix();

    const rgb = (r, g, b) => "rgb(" + r + "," + g + "," + b + ")";

    setInterval(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      ctx.fillStyle = "#0dcaf022";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(scale, scale);

      // Draw suns
      Object.values(sunsRef.current).forEach(sun => {

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

        if (sun.owner) {
          var ownerHase = ctx.createRadialGradient(
            sun.x,
            sun.y,
            0,
            sun.x,
            sun.y,
            1500
          );
          ownerHase.addColorStop(
            0,
            allianceRef.current.userIds.includes(sun.owner)
              ? (sun.owner===userRef.current.id ? "rgb(0,255,0,.25)" : "rgb(0,0,255,.25)")
              : "rgb(255,0,0,.25)"
          );
          ownerHase.addColorStop(1, "rgb(0,0,0,0)");
          ctx.fillStyle = ownerHase;
          ctx.beginPath();
          ctx.arc(sun.x, sun.y, 1500, 0, 2 * Math.PI);
          ctx.fill();
        }

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, 5, 0, 2 * Math.PI);
        ctx.fill();

      });

      ctx.fillStyle = "rgb(255,255,255,.25)";
      ctx.fillRect(viewportRef.current.x, viewportRef.current.y, viewportRef.current.w, viewportRef.current.h);

      ctx.restore();
    }, 500);
  }, []);

  return (
    <div id="map" style={{
        opacity:".9",
        position: "absolute",
        bottom: "20px",
        right: "20px",
        height: "200px",
        width: "200px",
        border: "1px solid #0dcaf0aa",
        overflow: "hidden"
    }}>
      <canvas style={{width:"200px", height:"200px"}}id="map_canvas"></canvas>
    </div>
  );
}

export default Map;
