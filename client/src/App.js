import './App.css';
import Galaxy from './Galaxy.js'
import React, {useEffect, useState, useRef} from 'react';

function App() {
    
  const [time, setTime] = useState(0);
  const [suns, setSuns] = useState([]);
  const [ships, setShips] = useState([]);
  const [user, setUser] = useState([]);

  const sunsRef = useRef(suns);
  sunsRef.current = suns

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
      //const ws = new WebSocket((window.location.protocol === "https:" ? 'wss' : 'ws') +'://port-8080-galaxy-lee508578.preview.codeanywhere.com/api');
      const ws = new WebSocket((window.location.protocol === "https:" ? 'wss' : 'ws') +'://'+window.location.hostname+'/api');

    socket.current = ws

    ws.onopen = () => {
      console.log('Connected to socket');

      // Send authentication if we have it, otherwise request
      if(localStorage.getItem('user')) {
        send({type:'auth', user: localStorage.getItem('user'), secret: localStorage.getItem('secret')})
        setUser({id: localStorage.getItem('user')})
      } else {
        send({type:'auth'})
      }

      // TODO cancel this later
      setInterval(() => {
        send({type:'ping'})
      }, 2500)

      // receive messages
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log('received', msg);

        if(msg.time) {
            setTime(msg.time)
        }

        if(msg.type==='auth') {
            localStorage.setItem('user', msg.user)
            localStorage.setItem('secret', msg.secret)
            setUser({id:msg.user})
        }

        if(msg.type==='update') {
            if(msg.suns) {
                setSuns(msg.suns)
            }        

            if(msg.ships) {
                setShips(msg.ships)
            }
        }
        if(msg.type==='moonUpdate') {
            sunsRef.current[msg.sunId].planets[msg.planetId].moons[msg.moon.id].owner = msg.moon.owner
            sunsRef.current[msg.sunId].planets[msg.planetId].moons[msg.moon.id].strength = msg.moon.strength
            setSuns(sunsRef.current)
        }
        if(msg.type==='sunUpdate') {
            sunsRef.current[msg.sun.id].owner = msg.sun.owner
            setSuns(sunsRef.current)
        }
        if(msg.type==='planetUpdate') {

            sunsRef.current[msg.sunId].planets[msg.planet.id].owner = msg.planet.owner
            sunsRef.current[msg.sunId].planets[msg.planet.id].strength = msg.planet.strength
            setSuns(sunsRef.current)
        }
        if(msg.type==='shipUpdate') {
            ships[msg.ship.id] = msg.ship
            setShips(ships)
        }
        if(msg.type==='shipDestroyed') {
            delete ships[msg.ship.id]
            setShips(ships)
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
      <Galaxy 
        time={time} 
        suns={suns} 
        ships={ships}
        user={user}
        launch={(shipType, sourceType, source, count, angle) => {send({type:'launch', shipType, sourceType, source, count, angle})}}
        navigate={(sourceType, source, angle) => {send({type:'navigate', sourceType, source, angle})}}
        planitaryShield={(sunId, planetId, shieldType) => {send({type:'shield', sunId, planetId, shieldType})}}
    />
  );
}

export default App;
