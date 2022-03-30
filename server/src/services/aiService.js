const { galaxyService } = require('./galaxyService');
const { userService } = require('./userService');

const getDistance = (x1, y1, x2, y2) => {
  const dy = x2 - x1;
  const dx = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

class AiPlayer {
  tasks = [];

  constructor() {
    const aiUser = userService.newUser();
    aiUser.alliance = userService.newAlliance();
    aiUser.alliance.addUser(aiUser);

    const suns = Object.values(galaxyService.getSuns());
    const randomSun = suns[Math.floor(Math.random() * suns.length)];
    const randomPlanet = randomSun.getPlanets()[Math.floor(Math.random() * randomSun.getPlanets().length)];
    randomPlanet.setOwner(aiUser);

    const executeTask = () => {
      const task = this.tasks.shift();
      if (task) task();
      setTimeout(executeTask, 10000 / (this.tasks.length || 5));
    };
    executeTask();

    setInterval(() => {
      Object.values(galaxyService.getShips()).forEach((ship) => {
        if (ship.getOwner().getId() === aiUser.getId()) {
          if (ship.getType() === 'carrier') {
            // launch from our carrier to a planet
            Object.values(galaxyService.getSuns()).forEach((sun) => {
              const sunDistance = getDistance(sun.getX(), sun.getY(), ship.getX(), ship.getY());
              if (sunDistance < 250) {
                Object.values(sun.getPlanets()).forEach((planet2) => {
                  if ((!planet2.getOwner() || ship.getOwner().getId() != planet2.getOwner().getId())) {
                    this.tasks.push(() => {
                        const interceptAngle = Math.atan2(planet2.getY() - ship.getY(), planet2.getX() - ship.getX());
                        for (let i = 0; i < 3; i += 1) {
                        if (ship.getStrength() > 5) {
                          ship.launch('fighter', interceptAngle);
                        }
                      }
                    });
                  }
                });
              }
            });
          }
        } else {
          // enemy ship
          Object.values(galaxyService.getSuns()).filter((sun) => getDistance(sun.x, sun.y, ship.getX(), ship.getY()) < 200).forEach((sun) => {
            Object.values(sun.getPlanets()).filter((planet) => planet.getOwner() && planet.getOwner().getId() === aiUser.getId()).forEach((planet) => {
              // fire a missile at it from the planet
              if (planet.getStrength() > 50 && Math.random() > 0.75) {
                const planetDistance = getDistance(planet.getX(), planet.getY(), ship.getX(), ship.getY());
                if (planetDistance < 100) {
                  this.tasks.push(() => {
                    const interceptAngle = Math.atan2(ship.getY() - planet.getY(), ship.getX() - planet.getX());
                    planet.launch('missile', interceptAngle);
                  })
                }
              }

              Object.values(planet.getMoons()).filter((moon) => moon.getOwner() && moon.getOwner().getId() === aiUser.getId()).forEach((moon) => {
                // fire a missile at it from the moon
                if (moon.getStrength() > 25 && Math.random() > 0.75) {
                  const moonDistance = getDistance(moon.getX(), moon.getY(), ship.getX(), ship.getY());
                  if (moonDistance < 100) {
                    this.tasks.push(() => {
                        const interceptAngle = Math.atan2(ship.getY() - moon.getY(), ship.getX() - moon.getX());
                        moon.launch('missile', interceptAngle);
                    })
                  }
                }
              });
            });
          });
        }
      });

      Object.values(galaxyService.getSuns()).forEach((sun) => {
        Object.values(sun.getPlanets()).forEach((planet) => {
          if (planet.getOwner() && planet.getStrength() > 50 && planet.getOwner().getId() == aiUser.getId()) {
            Object.values(planet.getMoons()).forEach((moon) => {
              // launch from our planet to our moon
              if ((!moon.getOwner() || planet.getOwner().getId() != moon.getOwner().getId() || moon.getStrength() < 10)) {
                this.tasks.push(() => {
                    const interceptAngle = Math.atan2(moon.getY() - planet.getY(), moon.getX() - planet.getX());
                    for (let i = 0; i < 3; i += 1) {
                        if (planet.getStrength() > 50) {
                            planet.launch('fighter', interceptAngle + (i * Math.PI / 50));
                        }
                    }
                })
              }

              // launch from our moon to our planet
              if (!planet.getOwner() || (moon.getOwner() && planet.getOwner().getId() === moon.getOwner().getId() && moon.getStrength() > 35 && planet.getStrength() < 100)) {
                this.tasks.push(() => {
                    const interceptAngle = Math.atan2(planet.getY() - moon.getY(), planet.getX() - moon.getX());
                    moon.launch('fighter', interceptAngle);
                })
              }
            });

            // launch from our planet to another planet in this system
            if (planet.getStrength() > 50) {
              Object.values(sun.getPlanets()).forEach((planet2) => {
                if (planet.getId() != planet2.getId() && (!planet2.getOwner() || planet.getOwner().getId() != planet2.getOwner().getId())) {
                  this.tasks.push(() => {
                    const interceptAngle = Math.atan2(planet2.getY() - planet.getY(), planet2.getX() - planet.getX());
                    for (let i = 0; i < 3; i += 1) {
                      if (planet.getStrength() > 50) {
                        planet.launch('fighter', interceptAngle + (i * Math.PI / 50));
                      }
                    }
                  });
                }
              });
            }

            // launch from our planet to another planet in another system
            if (planet.getStrength() > 75 && Math.random() > 0.80) {
              Object.values(galaxyService.getSuns()).filter((sun2) => getDistance(sun.x, sun.y, sun2.x, sun2.y) < 2000).forEach((sun2) => {
                if (sun2.getId() !== sun.getId()) {
                  // to make this harder, look at more than just the first match using .find
                  const planet2 = Object.values(sun2.getPlanets()).find((planet2) => !planet2.getOwner() || planet.getOwner().getId() != planet2.getOwner().getId());
                  if (planet2) {
                    this.tasks.push(() => {
                        const interceptAngle = Math.atan2(planet2.getY() - planet.getY(), planet2.getX() - planet.getX());
                        if (Math.random() > 0.50) {
                            // launch fighter
                            for (let i = 0; i < 3; i += 1) {
                                if (planet.getStrength() > 50) {
                                    planet.launch('fighter', interceptAngle);
                                }
                            }
                        } else if (Math.random() > 0.50) {
                            // launch carrier
                            if (planet.getStrength() > 75) {
                            planet.launch('carrier', interceptAngle);
                            }
                        } else if (Math.random() > 0.75) {
                            // launch commander
                            if (planet.getStrength() > 50) {
                            planet.launch('commander', interceptAngle);
                            }
                        }
                    });
                  }
                }
              });
            }
            if (planet.getStrength() > 90 && Math.random() > 0.75) {
              this.tasks.push(() => planet.upgradeShield());
            }
          }
        });
      });
    }, 10000);
  }
}

module.exports = AiPlayer;
