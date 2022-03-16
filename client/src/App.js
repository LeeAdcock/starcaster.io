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

    const ws = new WebSocket('wss://port-8080-galaxy-lee508578.preview.codeanywhere.com/');

    socket.current = ws

    ws.onopen = () => {
      console.log('Connected to socket');

      // TODO cancel this later
      setInterval(() => {
        send({type:'ping'})
      }, 2500)

      // receive messages
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log(msg)

        if(msg.time) {
            setTime(msg.time)
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
            sunsRef.current[msg.sunId].planets[msg.planetId].moons[msg.moon.id] = msg.moon
            setSuns(sunsRef.current)
        }
        if(msg.type==='planetUpdate') {

            console.log(sunsRef.current)
            sunsRef.current[msg.sunId].planets[msg.planet.id] = msg.planet
            setSuns(sunsRef.current)
        }
        if(msg.type==='shipUpdate') {
            ships[msg.ship.id] = msg.ship
            setShips(ships)
        }
        if(msg.type==='userUpdated') {
            setUser(msg.user)
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
        launchFighter={(sourceType, source, angle) => {send({type:'launchFighter', sourceType, source, angle})}}
    />
  );
}

export default App;
