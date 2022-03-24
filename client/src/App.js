import "./App.css";
import Galaxy from "./Galaxy.js";
import React, { useEffect, useState, useRef } from "react";

function App() {
  const [time, setTime] = useState(0);
  const [suns, setSuns] = useState([]);
  const [ships, setShips] = useState([]);
  const [user, setUser] = useState([]);
  const [alliance, setAlliance] = useState({id:'', userIds:[]});
  const [explosions, setExplosions] = useState([]);

  const sunsRef = useRef(suns);
  sunsRef.current = suns;

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
        //"port-8080-galaxy-lee508578.preview.codeanywhere.com" +
        window.location.hostname +
        "/api"
    );

    socket.current = ws;

    ws.onopen = () => {
      console.log("Connected to socket");

      // Send authentication if we have it, otherwise request
      if (localStorage.getItem("user")) {
        send({
          type: "auth",
          user: localStorage.getItem("user"),
          secret: localStorage.getItem("secret"),
        });
        setUser({ id: localStorage.getItem("user") });
      } else {
        send({ type: "auth" });
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
          localStorage.setItem("user", msg.user);
          localStorage.setItem("secret", msg.secret);
          setUser({ id: msg.user });
        }

        if (msg.type === "update") {
          if (msg.suns) {
            setSuns(msg.suns);
          }

          if (msg.ships) {
            setShips(msg.ships);
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
          ships[msg.ship.id] = msg.ship;
          setShips(ships);
        }
        if (msg.type === "allianceUpdate") {
          setAlliance({id: msg.allianceId, userIds: msg.userIds});
        }
        if (msg.type === "shipDestroyed") {
          let ship = ships[msg.ship.id];
          delete ships[msg.ship.id];
          setShips(ships);

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

  return (
    <>
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
        launch={(shipType, sourceType, source, count, angle) => {
            send({ type: "launch", shipType, sourceType, source, count, angle });
        }}
        navigate={(sourceType, source, angle) => {
            send({ type: "navigate", sourceType, source, angle });
        }}
        planitaryShield={(sunId, planetId, shieldType) => {
            send({ type: "shield", sunId, planetId, shieldType });
        }}
        setAlliance={(alliance) => {
            send({ type: "alliance", alliance });
        }}
        
        />
    </>
  );
}

export default App;
