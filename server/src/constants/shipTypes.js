const shipTypes = {
  fighter: {
    strength: 5,
    cost: 5,
    shipDamage: 5,
    planetDamage: 5,
    people: 5,
    speed: 8,
    width: 5,
    lifespan: 60 * 10, // 10 minutes
  },
  missile: {
    strength: 1,
    cost: 3,
    shipDamage: 7,
    planetDamage: 7,
    people: 0,
    speed: 12,
    width: 2,
    lifespan: 60 * 2, // 2 minutes
  },
  missile4: {
    strength: 1,
    cost: 10,
    shipDamage: 7,
    planetDamage: 7,
    people: 0,
    speed: 13,
    width: 2,
    lifespan: 60 * 2, // 2 minutes
  },
  missile2: {
    splashDamage: true,
    splashDamageDistance: 15,
    spreads: false,
    strength: 1,
    cost: 25,
    shipDamage: 7,
    planetDamage: 7,
    people: 0,
    speed: 12,
    width: 2,
    lifespan: 60 * 2, // 2 minutes
  },
  missile3: {
    splashDamage: true,
    splashDamageDistance: 30,
    spreads: true,
    strength: 1,
    cost: 110,
    shipDamage: 15,
    planetDamage: 15,
    people: 0,
    speed: 12,
    width: 2,
    lifespan: 60 * 2, // 2 minutes
  },
  carrier: {
    strength: 75,
    cost: 75,
    shipDamage: 75,
    planetDamage: 5,
    people: 0,
    speed: 6,
    width: 8,
    lifespan: 60 * 20, // 20 minutes
  },
  carrier2: {
    strength: 100,
    cost: 100,
    shipDamage: 75,
    planetDamage: 5,
    people: 0,
    speed: 6,
    width: 8,
    lifespan: 60 * 20, // 20 minutes
  },
  carrier3: {
    strength: 125,
    cost: 125,
    shipDamage: 75,
    planetDamage: 5,
    people: 0,
    speed: 6,
    width: 8,
    lifespan: 60 * 20, // 20 minutes
  },
  commander: {
    strength: 15,
    cost: 25,
    shipDamage: 5,
    planetDamage: 5,
    people: 2,
    speed: 6,
    width: 8,
    lifespan: 60 * 20, // 20 minutes
  },
};

module.exports = shipTypes;
