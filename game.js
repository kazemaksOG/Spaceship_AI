// Canvas and spaceship
const width = 400;
const height = 700;
const spaceShipWidth = 35;
const spaceShipHeight = 100;

// Obstacle props and steering
let obstacles = [];
let obstacleSpeed = 5;
let obstacleOftenness = 135;
let obstacleSize = 250;
let steer = 2.5;
let velocity = 0;
let velMod = 0.9;

// player config
let player;
let realPlayer;
let playerAlive = true;
let aiAlive = true;

// Wins
let playerWin;
let computerWin;

// game logic
let cycles = 1;
let countFrame = 0;

// score
let score = 0;
let start = true;

// Data
let brainsJSON;
let brainsBadJSON;
let brainsSmartJSON;

let ssAI;
let ss;
let obstacleIMG;
let startScreen;
let aiWin;
let humanWin;

// AI
let activeBrain;

// DOM
let difficulty;
let gameSpeed;

function preload() {
  brainsJSON = loadJSON("bestPlayer.json");
  brainsBadJSON = loadJSON("badPlayer.json");
  brainsSmartJSON = loadJSON("smartPlayer.json");

  ssAI = loadImage('assets/spaceship_ai.png');
  ss = loadImage('assets/spaceship.png');
  obstacleIMG = loadImage('assets/obstacle.png');

  startScreen = loadImage('assets/press_space.png');
  aiWin = loadImage('assets/ai_wins.png');
  humanWin = loadImage('assets/humanity_wins.png');
  activeBrain = brainsBadJSON;

  difficulty = document.getElementById("difficulty");
  gameSpeed = document.getElementById("speed");

}


function setup() {
  let canvas = createCanvas(width, height);
  canvas.parent('holder');

  score = 0;
  countFrame = 0;
  cycles = 1;
  
  playerAlive = true;
  aiAlive = true;

  start = true;
  computerWin = false;
  playerWin = false;
  
  obstacleSpeed = 5;
  obstacleOftenness = 135;
  obstacleSize = 250;

  let brains = NeuralNetwork.deserialize(activeBrain);
  player = new Player(brains);
  realPlayer = new RealPlayer();

  noLoop();


}

// Difficulty config

function rookie() {
  activeBrain = brainsBadJSON;
  let brains = NeuralNetwork.deserialize(activeBrain);
  player = new Player(brains);
  difficulty.innerHTML = "Rookie"

  if (!start) {
    obstacles = [];
    setup();
  }
}

function smart() {
  activeBrain = brainsSmartJSON;
  let brains = NeuralNetwork.deserialize(activeBrain);
  player = new Player(brains);
  difficulty.innerHTML = "Smart"

  if (!start) {
    obstacles = [];
    setup();
  }
}

function unbeatable() {
  activeBrain = brainsJSON;
  let brains = NeuralNetwork.deserialize(activeBrain);
  player = new Player(brains);
  difficulty.innerHTML = "Unbeatable"

  if (!start) {
    obstacles = [];
    setup();
  }
}

// Key functions
function keyPressed() {
  if (key == ' ') {
    loop();
    start = false;
  }
}

function keyTyped() {
  if (key == 'r' && !start) {
    obstacles = [];
    gameSpeed.innerHTML = '1x';
    setup();
  }
}

// Main game function
function draw() {
  // If both are dead, restart
  if(!aiAlive && !playerAlive) {
    obstacles = [];
    setup();
  }

  // Speed loop
  for (let n = 0; n < cycles; n++) {
    if(start) {
      n = cycles;
    }
  
    // How often do the obstacles spawn
    if (countFrame % obstacleOftenness == 0) {
      obstacles.push(new Obstacle());
    }
    countFrame++;

    // Ai thinks
    player.think(obstacles);

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {

      // check if hit
      if (obstacles[i].hits(player)) {
        player.y += obstacleSpeed;
        aiAlive = false;
        
        playerWin = true;
      }
      if (obstacles[i].hits(realPlayer)) {
        realPlayer.y += obstacleSpeed;
        playerAlive = false;

        computerWin = true;
      }
      obstacles[i].update();

      if (obstacles[i].offscreen()) {
        obstacles.splice(i, 1);
        score += 1;
        // Speed controller
        switch (score) {
          case 10:
            obstacleSpeed = 10;
            obstacleOftenness = 80;
            obstacles[0].speed = obstacleSpeed;
            break;
          case 20:
            obstacleSpeed = 15;
            obstacleOftenness = 55;
            obstacles[0].speed = obstacleSpeed;
        }
      }
    }
    player.update();
    realPlayer.update();
  }

  // Drawing stuff
  background('rgb(0, 0, 25)');
  player.show();
  realPlayer.show();

  for (let obstacle of obstacles) {
    obstacle.show();
  }

  start ? image(startScreen, width / 3 - 30, height / 2 + 50, 0, 0) : null;
  computerWin && !playerWin ? image(aiWin, width / 3 + 10, 150, 0, 0) : null;
  playerWin && !computerWin ? image(humanWin, width / 4 - 10, 150, 0, 0) : null;
  


}






class RealPlayer {
  constructor() {
    this.x = width / 2 + spaceShipWidth;
    this.y = height - 120;
    this.velocity = velocity;


    // Draw bird
    this.show = () => {
      rectMode(CORNER);
      // fill(255);
      // rect(this.x, this.y, spaceShipWidth, spaceShipHeight);
      image(ss, this.x, this.y, spaceShipWidth, spaceShipHeight);

    }

    // Updates sketch
    this.update = () => {

      // Velocity config
      if (playerAlive) {
        if (keyIsPressed && key == ' ') {
          this.velocity -= steer;
        } else {
          this.velocity += steer;
        }
      } else {
        this.velocity = 0;
      }
      this.velocity *= velMod;


      // X Location config
      this.x += this.velocity;

      if (this.x >= width - spaceShipWidth - 10) {
        this.x = width - spaceShipWidth - 10;
        this.velocity = 0;
      }
      if (this.x <= 10) {
        this.x = 10;
        this.velocity = 0;
      }

    }

  }


}








class Player {
  constructor(brain) {
    this.x = width / 2 - spaceShipWidth - spaceShipWidth;
    this.y = height - 120;
    this.velocity = velocity;


    this.skill = 0;
    this.fitness = 0;
    if (brain) {
      this.brain = brain.copy();
    } else {
      this.brain = new NeuralNetwork(5, 5, 1);
    }
    this.brainSteer = false;

    // Draw bird
    this.show = () => {
      rectMode(CORNER);
      fill('red');

      image(ssAI, this.x, this.y, spaceShipWidth, spaceShipHeight);
    }


    // AI
    this.think = (obst) => {

      let inputs = [];
      inputs[0] = this.x / width;

      if (obst.length >= 1) {
        inputs[1] = obst[0].x / width;
        inputs[2] = obst[0].y > 0 ? obst[0].y / (height + obst[0].size / 2) : 0;
        inputs[4] = obst[0].size / width;
      } else {
        inputs[1] = 0
        inputs[2] = 0
        inputs[4] = 0;
      }
      if (obst.length >= 2) {
        inputs[3] = obst[1].y > 0 ? obst[1].y / height : 0;
      } else {
        inputs[3] = 0;
      }

      let output = this.brain.predict(inputs);

      if (output[0] > 0.5) {
        this.brainSteer = true;
      } else {
        this.brainSteer = false;
      }
    }

    this.mutate = () => {
      this.brain.mutate(0.1);
    }


    // Updates sketch
    this.update = () => {
      this.skill++;

      // Velocity config
      if(aiAlive) {
        if (this.brainSteer) {
          this.velocity += steer;
        } else {
          this.velocity -= steer;
        }
      } else {
        this.velocity = 0;
      }
      this.velocity *= velMod;


      // X Location config
      this.x += this.velocity;

      if (this.x >= width - spaceShipWidth - 10) {
        this.x = width - spaceShipWidth - 10;
        this.velocity = 0;
      }
      if (this.x <= 10) {
        this.x = 10;
        this.velocity = 0;
      }

    }

  }


}









class Obstacle {
  constructor() {
    this.y = -width / 2 - 200;
    this.size = obstacleSize;
    this.x = random(width - this.size / 2) + this.size / 4;
    this.speed = obstacleSpeed;



    // HitBox variables
    this.circleRad = this.size / 2;

    this.firstBoxX = (this.circleRad) / 2;
    this.firstBoxY = (this.circleRad * sqrt(3)) / 2;

    this.secondBoxX = (this.circleRad * sqrt(3)) / 2;
    this.secondBoxY = (this.circleRad) / 2;


    this.show = () => {
      image(obstacleIMG, this.x - this.circleRad, this.y - this.circleRad, obstacleSize, obstacleSize);
    };
    this.hitBoxShow = () => {
      fill('red');
      line(this.x + this.circleRad, this.y, this.x - this.circleRad, this.y);
      rect(this.x - this.firstBoxX, this.y - this.firstBoxY, 2 * this.firstBoxX, 2 * this.firstBoxY);
      rect(this.x - this.secondBoxX, this.y - this.secondBoxY, 2 * this.secondBoxX, 2 * this.secondBoxY);
    }

    this.update = () => {
      this.y += this.speed;
    };

    this.offscreen = () => {
      if (this.y >= height + this.size / 2) {
        return true;
      }
      return false;
    };



    this.hits = (param) => {

      // Top part of the ship
      // Check X hitBox 1
      if (param.x <= this.x + this.firstBoxX && param.x + spaceShipWidth >= this.x - this.firstBoxX) {

        // Check Y hitBox 1
        if (param.y <= this.y + this.firstBoxY - 1 && param.y + spaceShipHeight >= this.y - this.firstBoxY + 1) {
          return true;

        }

      }
      // Check X hitBox 2
      if (param.x <= this.x + this.secondBoxX && param.x + spaceShipWidth >= this.x - this.secondBoxX) {

        // Check Y hitBox 1
        if (param.y <= this.y + this.secondBoxY && param.y + spaceShipHeight >= this.y - this.secondBoxY) {
          return true;
        }

      }
      // Check X hitBox 3
      if (param.x <= this.x + this.circleRad && param.x + spaceShipWidth >= this.x - this.circleRad) {
        // Check Y hitBox 1
        if (param.y <= this.y && param.y + spaceShipHeight >= this.y) {
          return true;

        }

      }


      return false;
    }


  }

}
