import "./App.css";
import Galaxy from "./Galaxy.js";
import Map from "./Map.js";
import React, { useEffect, useState, useRef } from "react";
import Moment from 'react-moment';
import Spinner from "react-bootstrap/Spinner"

function App() {
  const [viewport, setViewport] = useState({x:0, y:0, w: 0, h:0});
  const [minimapViewport, setMinimapViewport] = useState({x:0, y:0, w: 0, h:0});
  
  const [time, setTime] = useState(0);
  const [suns, setSuns] = useState({});
  const [ships, setShips] = useState({});
  const [user, setUser] = useState({});
  const [alliance, setAlliance] = useState({id:'', userIds:[]});
  const [explosions, setExplosions] = useState([]);

  const sunsRef = useRef(suns);
  sunsRef.current = suns;

  const shipsRef = useRef(ships);
  shipsRef.current = ships;

  const socket = useRef(null);

  // function to send messages
  const send = (data) => {
    try {
      const d = JSON.stringify(data);
      socket.current.send(d);
      return true;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    const ws = new WebSocket(
      (window.location.protocol === "https:" ? "wss" : "ws") +
        "://" +
        //"port-8080-starcaster-io-lee508578.preview.codeanywhere.com" +
        window.location.hostname +
        "/api"
    );

    socket.current = ws;

    ws.onopen = () => {
      console.log("Connected to socket");

      // Send authentication if we have it, otherwise request
      if (localStorage.getItem("userId")) {
        send({
          type: "authRequest",
          userId: localStorage.getItem("userId"),
          secret: localStorage.getItem("secret"),
        });
        setUser({ id: localStorage.getItem("userId") });
      } else {
        send({ type: "authRequest" });
      }

      // TODO cancel this later
      setInterval(() => {
        send({ type: "ping" });
      }, 30000); // 30 seconds

      // receive messages
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log("received", msg);

        if (msg.time) {
          setTime(msg.time);
        }

        if (msg.type === "auth") {
          localStorage.setItem("userId", msg.user);
          localStorage.setItem("secret", msg.secret);
          setUser({ id: msg.user });
        }

        if (msg.type === "update") {
          if (msg.suns) {
            setSuns(msg.suns);
          }

          if (msg.ships) {
            shipsRef.current = msg.ships
            setShips(shipsRef.current);
            console.log("Received ships", Object.values(msg.ships).length)
          }
        }
        if (msg.type === "moonUpdate") {
          sunsRef.current[msg.sunId].planets[msg.planetId].moons[
            msg.moon.id
          ].owner = msg.moon.owner;
          sunsRef.current[msg.sunId].planets[msg.planetId].moons[
            msg.moon.id
          ].strength = msg.moon.strength;
          setSuns(sunsRef.current);
        }
        if (msg.type === "sunUpdate") {
          sunsRef.current[msg.sun.id].owner = msg.sun.owner;
          sunsRef.current[msg.sun.id].dark = msg.sun.dark;
          setSuns(sunsRef.current);
        }
        if (msg.type === "planetUpdate") {
          sunsRef.current[msg.sunId].planets[msg.planet.id].owner =
            msg.planet.owner;
          sunsRef.current[msg.sunId].planets[msg.planet.id].strength =
            msg.planet.strength;
          setSuns(sunsRef.current);
        }
        if (msg.type === "shipUpdate") {
          shipsRef.current[msg.ship.id] = msg.ship;
          setShips(shipsRef.current);
        }
        if (msg.type === "allianceUpdate") {
          setAlliance({id: msg.allianceId, userIds: msg.userIds});
        }
        if (msg.type === "shipDestroyed" && shipsRef.current[msg.ship.id]) {
          let ship = shipsRef.current[msg.ship.id];

          // there may be references to this object even after we 
          // remove it from our list, so set the strength to zero
          ship.strength = 0
          delete shipsRef.current[msg.ship.id];
          setShips(shipsRef.current);

          if (msg.explosion) {
            let shipX =
              ship.x +
              ship.speed *
                (msg.time - ship.angle.time) *
                Math.cos(ship.angle.value);
            let shipY =
              ship.y +
              ship.speed *
                (msg.time - ship.angle.time) *
                Math.sin(ship.angle.value);

            explosions[msg.ship.id] = { x: shipX, y: shipY, time: msg.time };
            setExplosions(explosions);
            setTimeout(() => {
              delete explosions[msg.ship.id];
            }, 500);
          }
        }
      };
    };

    // on close we should update connection state
    // and retry connection
    ws.onclose = () => {
      // retry logic?
    };

    // terminate connection on unmount
    return () => {
      ws.close();
    };
  }, []);

  const timeUntilReset = time*1000 - (time * 1000) % 10800000 + 10800000

  return (
    <>
        {Object.values(suns).length === 0 && <div style={{
            position: "absolute",
            top: "50%",
            right: "50%",
            marginTop: "-4rem",
            marginLeft: "-4rem",
            width:"8rem",
            height: "8rem",
            textShadow: "0px 0px 10px rgb(13 202 240)"
        }}>
            <Spinner style={{
                width: "8rem",
                height: "8rem"
            }} animation="border" variant="info" />
        </div> }

        <div style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            color: "#0dcaf0",
            fontSize: "30px",
            fontFamily: "Mulish",
            textShadow: "0px 0px 10px rgb(13 202 240)"
        }}>
            starcaster.io
        </div>


        {time && <div style={{
            position: "absolute",
            top: "50px",
            right: "20px",
            color: (timeUntilReset < 300000 ? "rgb(255, 193, 7)" : (timeUntilReset < 60000 ? "rgb(220, 53, 69)" : "#0dcaf0")),
            fontSize: "12px",
            fontFamily: "Mulish",
            textShadow: "0px 0px 10px rgb(13 202 240)"
        }}>
            New game starts <Moment fromNow>{timeUntilReset}</Moment>
        </div> }

        <div style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            left: "0px",
            height: "80px",
            backgroundColor: "#0dcaf022",
            borderBottom: "1px solid #0dcaf033"
        }}>
            &nbsp;
        </div>        

        <Galaxy
        time={time}
        suns={suns}
        alliance={alliance}
        ships={ships}
        user={user}
        explosions={explosions}
        viewportChange={(x, y, w, h) => setViewport({x, y, w, h})}
        minimapViewport={minimapViewport}
        launch={(shipType, sourceType, source, count, angle) => {
            send({ type: "launch", shipType, sourceType, source, count, angle });
        }}
        navigate={(sourceType, source, angle) => {
            send({ type: "navigate", sourceType, source, angle });
        }}
        planitaryShield={(sunId, planetId, shieldType) => {
            send({ type: "shield", sunId, planetId, shieldType });
        }}
        setAlliance={(allianceId) => {
            send({ type: "changeAlliance", allianceId });
        }}
        />

        {Object.values(suns).length != 0 &&  <Map
        suns={suns}
        alliance={alliance}
        user={user}        
        viewport={viewport}
        viewportChange={(x, y) => {
            setMinimapViewport({x, y})
            setViewport({x:x, y:y, w:viewport.w, h:viewport.h})
        }}
        /> }
    </>
  );
}

export default App;
