const express = require('express');
const WebSocket = require("ws");
var http = require('http');

const app = express();
const server = http.createServer(app);

let time = 0;
setInterval(() => time = time + .1, 100)

app.use(express.json());
  
app.get('/', (req, res) => {
    res.send('success');
});
 
const getUniqueID = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4();
  };

  const suns = {}
  const sunNames = [
    "Absolutno",
	"Acamar",
	"Achernar",
	"Achird",
	"Acrab",
	"Acrux",
	"Acubens",
	"Adhafera",
	"Adhara",
	"Adhil",
	"Ain",
	"Ainalrami",
	"Aladfar",
	"Alamak",
	"Alasia",
	"Alathfar",
	"Albaldah",
	"Albali",
	"Albireo",
	"Alchiba",
	"Alcor",
	"Alcyone",
	"Aldebaran",
	"Alderamin",
	"Aldhanab",
	"Aldhibah",
	"Aldulfin",
	"Alfirk",
	"Algedi",
	"Algenib",
	"Algieba",
	"Algol",
	"Algorab",
	"Alhena",
	"Alioth",
	"Aljanah",
	"Alkaid",
	"Al Kalb al Rai",
	"Alkalurops",
	"Alkaphrah",
	"Alkarab",
	"Alkes",
	"Almaaz",
	"Almach",
	"Al Minliar al Asad",
	"Alnair",
	"Alnasl",
	"Alnilam",
	"Alnitak",
	"Alniyat",
	"Alphard",
	"Alphecca",
	"Alpheratz",
	"Alpherg",
	"Alrakis",
	"Alrescha",
	"Alruba",
	"Alsafi",
	"Alsciaukat",
	"Alsephina",
	"Alshain",
	"Alshat",
	"Altair",
	"Altais",
	"Alterf",
	"Aludra",
	"Alula Australis",
	"Alula Borealis",
	"Alya",
	"Alzirr",
	"Amadioha",
	"Amansinaya",
	"Anadolu",
	"Ancha",
	"Angetenar",
	"Aniara",
	"Ankaa",
	"Anser",
	"Antares",
	"Arcalís",
	"Arcturus",
	"Arkab Posterior",
	"Arkab Prior",
	"Arneb",
	"Ascella",
	"Asellus Australis",
	"Asellus Borealis",
	"Ashlesha",
	"Asellus Primus",
	"Asellus Secundus",
	"Asellus Tertius",
	"Aspidiske",
	"Asterope, Sterope",
	"Atakoraka",
	"Athebyne",
	"Atik",
	"Atlas",
	"Atria",
	"Avior",
	"Axólotl",
	"Ayeyarwady",
	"Azelfafage",
	"Azha",
	"Azmidi",
	"Baekdu",
	"Barnard's Star",
	"Baten Kaitos",
	"Beemim",
	"Beid",
	"Belel",
	"Bélénos",
	"Bellatrix",
	"Berehynia",
	"Betelgeuse",
	"Bharani",
	"Bibhā",
	"Biham",
	"Bosona",
	"Botein",
	"Brachium",
	"Bubup",
	"Buna",
	"Bunda",
	"Canopus",
	"Capella",
	"Caph",
	"Castor",
	"Castula",
	"Cebalrai",
	"Ceibo",
	"Celaeno",
	"Cervantes",
	"Chalawan",
	"Chamukuy",
	"Chaophraya",
	"Chara",
	"Chason",
	"Chechia",
	"Chertan",
	"Citadelle",
	"Citalá",
	"Cocibolca",
	"Copernicus",
	"Cor Caroli",
	"Cujam",
	"Cursa",
	"Dabih",
	"Dalim",
	"Deneb",
	"Deneb Algedi",
	"Denebola",
	"Diadem",
	"Dingolay",
	"Diphda",
	"Dìwö",
	"Diya",
	"Dofida",
	"Dombay",
	"Dschubba",
	"Dubhe",
	"Dziban",
	"Ebla",
	"Edasich",
	"Electra",
	"Elgafar",
	"Elkurud",
	"Elnath",
	"Eltanin",
	"Emiw",
	"Enif",
	"Errai",
	"Fafnir",
	"Fang",
	"Fawaris",
	"Felis",
	"Felixvarela",
	"Flegetonte",
	"Fomalhaut",
	"Formosa",
	"Franz",
	"Fulu",
	"Funi",
	"Fumalsamakah",
	"Furud",
	"Fuyue",
	"Gacrux",
	"Gakyid",
	"Garnet Star",
	"Giausar",
	"Gienah",
	"Ginan",
	"Gloas",
	"Gomeisa",
	"Graffias",
	"Grumium",
	"Gudja",
	"Gumala",
	"Guniibuu",
	"Hadar",
	"Haedus",
	"Hamal",
	"Hassaleh",
	"Hatysa",
	"Helvetios",
	"Heze",
	"Hoggar",
	"Homam",
	"Horna",
	"Hunahpú",
	"Hunor",
	"Iklil",
	"Illyrian",
	"Imai",
	"Intercrus",
	"Inquill",
	"Intan",
	"Irena",
	"Itonda",
	"Izar",
	"Jabbah",
	"Jishui",
	"Kaffaljidhma",
	"Kakkab",
	"Kalausi",
	"Kamuy",
	"Kang",
	"Karaka",
	"Kaus Australis",
	"Kaus Borealis",
	"Kaus Media",
	"Kaveh",
	"Kekouan",
	"Keid",
	"Khambalia",
	"Kitalpha",
	"Kochab",
	"Koeia",
	"Koit",
	"Kornephoros",
	"Kraz",
	"Kuma",
	"Kurhah",
	"La Superba",
	"Larawag",
	"Lerna",
	"Lesath",
	"Libertas",
	"Lich",
	"Liesma",
	"Lilii Borea",
	"Lionrock",
	"Lucilinburhuc",
	"Lusitânia",
	"Maasym",
	"Macondo",
	"Mago",
	"Mahasim",
	"Mahsati",
	"Maia",
	"Malmok",
	"Marfak",
	"Marfik",
	"Markab",
	"Markeb",
	"Márohu",
	"Marsic",
	"Matar",
	"Mazaalai",
	"Mebsuta",
	"Megrez",
	"Meissa",
	"Mekbuda",
	"Meleph",
	"Menkalinan",
	"Menkar",
	"Menkent",
	"Menkib",
	"Merak",
	"Merga",
	"Meridiana",
	"Merope",
	"Mesarthim",
	"Miaplacidus",
	"Mimosa",
	"Minchir",
	"Minelauva",
	"Mintaka",
	"Mira",
	"Mirach",
	"Miram",
	"Mirfak",
	"Mirzam",
	"Misam",
	"Mizar",
	"Moldoveanu",
	"Mönch",
	"Montuno",
	"Morava",
	"Moriah",
	"Mothallah",
	"Mouhoun",
	"Mpingo",
	"Muliphein",
	"Muphrid",
	"Muscida",
	"Musica",
	"Muspelheim",
	"Nahn",
	"Naledi",
	"Naos",
	"Nash",
	"Nashira",
	"Násti",
	"Natasha",
	"Navi",
	"Nekkar",
	"Nembus",
	"Nenque",
	"Nervia",
	"Nihal",
	"Nikawiy",
	"Nosaxa",
	"Nunki",
	"Nusakan",
	"Nushagak",
	"Nyamien",
	"Ogma",
	"Okab",
	"Paikauhale",
	"Parumleo",
	"Peacock",
	"Petra",
	"Phact",
	"Phecda",
	"Pherkad",
	"Phoenicia",
	"Piautos",
	"Pincoya",
	"Pipoltr",
	"Pipirima",
	"Pleione",
	"Poerava",
	"Polaris",
	"Polaris Australis",
	"Polis",
	"Pollux",
	"Porrima",
	"Praecipua",
	"Prima Hyadum",
	"Procyon",
	"Propus",
	"Proxima Centauri",
	"Ran",
	"Rapeto",
	"Rasalas",
	"Rasalgethi",
	"Rasalhague",
	"Rastaban",
	"Regor",
	"Regulus",
	"Revati",
	"Rigel",
	"Rigil Kentaurus",
	"Rosalíadecastro",
	"Rotanev",
	"Ruchbah",
	"Rukbat",
	"Sabik",
	"Saclateni",
	"Sadachbia",
	"Sadalbari",
	"Sadalmelik",
	"Sadalsuud",
	"Sadr",
	"Sagarmatha",
	"Saiph",
	"Salm",
	"Sāmaya",
	"Sansuna",
	"Sargas",
	"Sarin",
	"Sarir",
	"Sceptrum",
	"Scheat",
	"Schedar",
	"Secunda Hyadum",
	"Segin",
	"Seginus",
	"Sham",
	"Shama",
	"Sharjah",
	"Shaula",
	"Sheliak",
	"Sheratan",
	"Sika",
	"Sirius",
	"Situla",
	"Skat",
	"Solaris",
	"Spica",
	"Sterrennacht",
	"Stribor",
	"Sualocin",
	"Subra",
	"Suhail",
	"Sulafat",
	"Syrma",
	"Tabit",
	"Taika",
	"Taiyangshou",
	"Taiyi",
	"Talitha",
	"Tangra",
	"Tania Australis",
	"Tania Borealis",
	"Tapecue",
	"Tarazed",
	"Tarf",
	"Taygeta",
	"Tegmine",
	"Tejat",
	"Terebellum",
	"Tevel",
	"Thabit",
	"Theemin",
	"Thuban",
	"Tiaki",
	"Tianguan",
	"Tianyi",
	"Timir",
	"Tislit",
	"Titawin",
	"Tojil",
	"Toliman",
	"Tonatiuh",
	"Torcular",
	"Tuiren",
	"Tupã",
	"Tupi",
	"Tureis",
	"Ukdah",
	"Uklun",
	"Unukalhai",
	"Unurgunite",
	"Uruk",
	"Vega",
	"Veritate",
	"Vindemiatrix",
	"Wasat",
	"Wazn",
	"Wezen",
	"Wurren",
	"Xamidimura",
	"Xihe",
	"Xuange",
	"Yed Posterior",
	"Yed Prior",
	"Yildun",
	"Zaniah",
	"Zaurak",
	"Zavijava",
	"Zhang",
	"Zibal",
	"Zosma",
	"Zubenelgenubi",
	"Zubenelhakrabi",
	"Zubeneschamali"
]
const createSun = () => {
    const sun = {
        id: getUniqueID(),
        name: sunNames[Math.floor(Math.random()*sunNames.length)],
        owner: null,
        x: Math.random() * 10000,
        y: Math.random() * 10000,
        size: 20,
        planets: {}
    }
    for(let i=0; i<2+Math.round(Math.random() * 10); i++) {
        const planet = createPlanet(sun.id)
        sun.planets[planet.id] = planet
    }
    suns[sun.id] = sun
    return sun
}

const planets = {}
const createPlanet = (sunId) => {
    const planet = {
        id: getUniqueID(),
        sunId,
        distance: 25+(Math.round(Math.random() * 10) * 15),
        angle: {
            value: Math.random() * 2 * Math.PI,
            time: 0,
            speed: 1/20
        },
        size: 10,
        owner: null,
        strength: { 
            value: 0, 
            time: 0, 
            max: 100, 
            speed: 2},
        moons: {}
    }
    for(let i=0; i<Math.round(Math.random() * 3); i++) {
        const moon = createMoon(planet.id)
        planet.moons[moon.id] = moon
    }
    planets[planet.id] = planet
    return planet
}

const moons = {}
const createMoon = (planetId) => {
    const moon = {
        id: getUniqueID(),
        planetId,
        size: 3,
        owner: null,
        strength: { value: 0, time: 0, max: 50, speed: 1},
        distance: 15+(Math.round(Math.random() * 3) * 6),
        angle: {
            value: Math.random() * 2 * Math.PI,
            time: 0,
            speed: 1/2
        },
    }
    moons[moon.id] = moon
    return moon;
}

const ships = {}
const connections = {}
const users = {}

for(let i=0; i<40; i++) {
    createSun()
}

// ws instance
const wss = new WebSocket.Server({ noServer: true });

// handle upgrade of the request
server.on("upgrade", function upgrade(request, socket, head) {
    try {
        // authentication and some other steps will come here
        // we can choose whether to upgrade or not
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit("connection", ws, request);
        });
    } catch (err) {
        console.log("upgrade exception", err);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
    }
});

// what to do after a connection is established
wss.on("connection", (socket) => {

    let connectionId = null
    let userId = null

    // handle message events
    // receive a message and echo it back
    socket.on("message", (message) => {
        console.log(`Received message => ${message}`);

        data = JSON.parse(message)
        if(data.type==='ping') {
            socket.send(JSON.stringify({time, type: 'ping' }));
        } else if(data.type==='auth') {
            if(data.user && data.secret && users[data.user] && users[data.user].secret === data.secret) {
                userId = data.user
                connectionId = getUniqueID()
                connections[connectionId] = {
                    socket: socket,
                    user: userId
                }

            } else {
                connectionId = getUniqueID()
                connections[connectionId] = {
                    socket: socket,
                    user: data.user
                }

                userId = getUniqueID()
                users[userId] = {
                    secret: getUniqueID()+"-"+getUniqueID()
                }

                const giftSun = Object.entries(suns)[Math.floor(Math.random()*Object.entries(suns).length)][1]
                const giftPlanet = Object.entries(giftSun.planets)[Math.floor(Math.random()*Object.entries(giftSun.planets).length)][1]
                giftPlanet.owner = userId
                giftPlanet.strength.value = 50
                giftPlanet.strength.time = time            

                socket.send(JSON.stringify({time, type: 'auth', user: userId, secret: users[userId].secret, gift:{giftSun, giftPlanet}}));

                Object.entries(connections).forEach(([connectionId, connection]) => {
                    connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId: giftSun.id, planet: giftPlanet }));
                })

            }

        } else if(data.type==='solarNavigation') {
            const sun = suns[data.sunId]

            if(sun.owner===userId) {
                Object.entries(ships).forEach(([shipId, ship]) => {
                    let shipX = ship.x + (8 * (time - ship.angle.time) * Math.cos(ship.angle.value))
                    let shipY = ship.y + (8 * (time - ship.angle.time) * Math.sin(ship.angle.value))
                                
                    const sunDistance = getDistance(shipX, shipY, sun.x, sun.y)

                    if(sunDistance<200) {
                        ship.x = shipX
                        ship.y = shipY
                        ship.angle.time=time
                        ship.angle.value=data.angle + (Math.random() * Math.PI/20) - Math.PI/40
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                        })
                    }
                })
            }
        

        } else if(data.type==='launchFighter') {

            if(data.sourceType==='moon') {
                const planet = planets[data.source.planetId]
                const moon = planet.moons[data.source.moonId]

                if(moon.owner === userId) {
                    const sun = suns[planet.sunId]
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                    const moonAngle = moon.angle.value + (time * Math.PI/moon.distance * moon.angle.speed);
                    const moonX = planetX + (moon.distance * Math.sin(moonAngle));
                    const moonY = planetY + (moon.distance * Math.cos(moonAngle));

                    const moonStrength = Math.min(moon.strength.max, moon.strength.value + ((time-moon.strength.time) * moon.strength.speed));
                    if(moonStrength > 5) {

                        moon.strength.value = -5 + moonStrength
                        moon.strength.time = time

                        const ship = {
                            id: getUniqueID(),
                            owner: connectionId, 
                            x: moonX + ((3+ (Math.random() * 2)) * Math.cos(data.angle)),
                            y: moonY + ((3+ (Math.random() * 2)) * Math.sin(data.angle)),
                            moonId: moon.id,
                            source: "moon",
                            angle: {
                                value: data.angle + (Math.random() * Math.PI/20) - Math.PI/40,
                                time: time
                            }
                        }
                        ships[ship.id] = ship
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                            connection.socket.send(JSON.stringify({time, type: 'moonUpdate', sunId: sun.id, planetId: planet.id, moon }));
                        })
                    }
                }
            }

            if(data.sourceType==='planet') {
                const planet = planets[data.source.planetId]
                if(planet.owner === userId) {
                    const sun = suns[data.source.sunId]
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle));
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle));

                    const planetStrength = Math.min(planet.strength.max, planet.strength.value + ((time-planet.strength.time) * planet.strength.speed));
                    if(planetStrength > 5) {

                        planet.strength.value = -5 + planetStrength
                        planet.strength.time = time                      
                        
                        const ship = {
                            id: getUniqueID(),
                            owner: userId, 
                            planetId: planet.id,
                            source: "planet",

                            // TODO add this to the location object
                            x: planetX + ((8+ (Math.random() * 5)) * Math.cos(data.angle)),
                            y: planetY + ((8+ (Math.random() * 5)) * Math.sin(data.angle)),

                            // TODO rename this location
                            angle: {
                                value: data.angle + (Math.random() * Math.PI/20) - Math.PI/40,
                                time: time
                            }
                        }
                        ships[ship.id] = ship
                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            console.log(connection)
                            connection.socket.send(JSON.stringify({time, type: 'shipUpdate', ship }));
                            connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId: sun.id, planet }));
                        })
                    }
                }
            }

        }

    });

    // handle close event
    socket.on("close", () => {
        console.log("closed", wss.clients.size);
    });

    // sent a message that we're good to proceed
    socket.send(JSON.stringify({time, type: 'update', suns, ships}));
});

var getDistance = (x1, y1, x2, y2) => {
    let dy = x2 - x1;
    let dx = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

setInterval(() => {
    Object.entries(ships).forEach(([shipId, ship]) => {
        let shipX = ship.x + (8 * (time - ship.angle.time) * Math.cos(ship.angle.value))
        let shipY = ship.y + (8 * (time - ship.angle.time) * Math.sin(ship.angle.value))

        Object.entries(suns).forEach(([sunId, sun]) => {
            const sunDistance = getDistance(shipX, shipY, sun.x, sun.y)
            if(sunDistance < sun.size) {
                Object.entries(connections).forEach(([connectionId, connection]) => {
                    connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'sun', sunId, ship }));
                    delete ships[shipId]
                })
            } else if (sunDistance < 1000) {
                Object.entries(sun.planets).forEach(([planetId, planet]) => {
                    const planetAngle = planet.angle.value + (time * Math.PI/planet.distance * planet.angle.speed);
                    const planetX = sun.x + (planet.distance * Math.sin(planetAngle))
                    const planetY = sun.y + (planet.distance * Math.cos(planetAngle))
                    const planetDistance = getDistance(shipX, shipY, planetX, planetY)
                    if(planetDistance < planet.size && ship.planetId !== planetId) {

                        const planetStrength = (planet.owner ? Math.min(planet.strength.max, planet.strength.value + ((time-planet.strength.time) * planet.strength.speed)) : 0)
                        if(!planet.owner || planet.owner === ship.owner) {
                            planet.strength.value = 5 + planetStrength
                            planet.strength.time = time
                            planet.owner = ship.owner
                            if(planet.owner !== sun.owner) {
                                sun.owner = ship.owner
                                Object.entries(connections).forEach(([connectionId, connection]) => {
                                    connection.socket.send(JSON.stringify({time, type: 'sunUpdate', sun }));
                                })
                            }

                        } else {
                            if(planetStrength < 5) {
                                planet.strength.value = 5
                                planet.strength.time = time
                                planet.owner = ship.owner

                                if(planet.owner !== sun.owner) {
                                    sun.owner = ship.owner
                                    Object.entries(connections).forEach(([connectionId, connection]) => {
                                        connection.socket.send(JSON.stringify({time, type: 'sunUpdate', sun }));
                                    })
                                }
        
                            } else {
                                planet.strength.value = -5 + planetStrength
                                planet.strength.time = time
                            }
                        }
                        delete ships[shipId]

                        Object.entries(connections).forEach(([connectionId, connection]) => {
                            connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'planet', sunId, planetId, ship }));
                            connection.socket.send(JSON.stringify({time, type: 'planetUpdate', sunId, planet }));
                        })

                    } else if (planetDistance < 500) {
                        Object.entries(planet.moons).forEach(([moonId, moon]) => {
                            const moonAngle = moon.angle.value + (time * Math.PI/moon.distance * moon.angle.speed);
                            const moonX = planetX + (moon.distance * Math.sin(moonAngle))
                            const moonY = planetY + (moon.distance * Math.cos(moonAngle))
                            const moonDistance = getDistance(shipX, shipY, moonX, moonY)
                            if(moonDistance < moon.size && ship.moonId !== planetId) {

                                const moonStrength = (moon.owner ? Math.min(moon.strength.max, moon.strength.value + ((time-moon.strength.time) * moon.strength.speed)) : 0)
                                if(!moon.owner || moon.owner === ship.owner) {
                                    moon.strength.value = 5 + moonStrength
                                    moon.strength.time = time
                                    moon.owner = ship.owner
                                    if(moon.owner !== sun.owner) {
                                        sun.owner = ship.owner
                                        Object.entries(connections).forEach(([connectionId, connection]) => {
                                            connection.socket.send(JSON.stringify({time, type: 'sunUpdate', sun }));
                                        })
                                    }                                            
                            } else {
                                    if(moonStrength<5) {
                                        moon.strength.value = 5
                                        moon.strength.time = time
                                        moon.owner = ship.owner

                                        if(moon.owner !== sun.owner) {
                                            sun.owner = ship.owner
                                            Object.entries(connections).forEach(([connectionId, connection]) => {
                                                connection.socket.send(JSON.stringify({time, type: 'sunUpdate', sun }));
                                            })
                                        }                                            
                                    } else {
                                        moon.strength.value = -5 + moonStrength
                                        moon.strength.time = time
                                    }
                                }
                                delete ships[shipId]

                                Object.entries(connections).forEach(([connectionId, connection]) => {
                                    connection.socket.send(JSON.stringify({time, type: 'shipDestroyed', cause:'moon', sunId, planetId, moonId, ship }));
                                    connection.socket.send(JSON.stringify({time, type: 'moonUpdate', sunId, planetId, moon }));
                                })
                            
                            }
                        })
                    }
                })
            }
        })

    })
}, 200);

server.listen(8080)