const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverDiv = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const scoreDisplay = document.getElementById("scoreDisplay");

const gridSize = 20;
const baseMoveInterval = 100;

let moveInterval = baseMoveInterval;
let speedFactor = 1;
let snake, dx, dy, score, gameLoop, growSegments, lastMoveTime;
let speedTimeouts = [];
let fruits = [];
let directionQueue = [];

function resizeCanvas() {
  canvas.width = Math.floor(window.innerWidth / gridSize) * gridSize;
  canvas.height = Math.floor(window.innerHeight / gridSize) * gridSize;
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  initGame();
});

function initGame() {
  snake = [{ x: gridSize * 5, y: gridSize * 5 }];
  dx = gridSize;
  dy = 0;
  score = 0;
  growSegments = 0;

  speedFactor = 1;
  moveInterval = baseMoveInterval;
  lastMoveTime = Date.now();
  directionQueue = [];

  clearTimeouts();
  fruits = [];
  gameOverDiv.style.display = "none";
  scoreDisplay.textContent = "スコア: 0";

  clearInterval(gameLoop);
  placeFruit();
  gameLoop = setInterval(draw, 1000 / 30);
}

function clearTimeouts() {
  speedTimeouts.forEach(timeout => clearTimeout(timeout));
  speedTimeouts = [];
}

function drawGrid() {
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    if (x === 0 || x === canvas.width) {
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 5;
    } else {
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
    }
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    if (y === 0 || y === canvas.height) {
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 5;
    } else {
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
    }
    ctx.stroke();
  }

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawRect(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, gridSize, gridSize);
}

function draw() {
  const now = Date.now();
  if (now - lastMoveTime < moveInterval) return;

  lastMoveTime = now;

  if (directionQueue.length > 0) {
    const next = directionQueue.shift();
    dx = next.dx;
    dy = next.dy;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  fruits.forEach(fruit => drawRect(fruit.x, fruit.y, fruit.color));
  snake.forEach(segment => drawRect(segment.x, segment.y, "lime"));
  moveSnake();

  if (didGameEnd()) {
    finalScore.textContent = `スコア: ${score}`;
    gameOverDiv.style.display = "block";
    clearInterval(gameLoop);
  }
}

function moveSnake() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);

  let ateFruit = false;
  for (let i = 0; i < fruits.length; i++) {
    const fruit = fruits[i];
    if (head.x === fruit.x && head.y === fruit.y) {
      ateFruit = true;

      if (fruit.type === "apple") {
        score += 5;
        growSegments += 5;
      } else if (fruit.type === "banana") {
        score++;
        growSegments += 1;

        speedFactor *= 2;
        moveInterval = baseMoveInterval / speedFactor;

        const timeout = setTimeout(() => {
          speedFactor /= 2;
          moveInterval = baseMoveInterval / speedFactor;
        }, 3000);
        speedTimeouts.push(timeout);
      }

      fruits.splice(i, 1);

      const additionalFruits = fruit.type === "banana" ? 2 : 1;
      for (let j = 0; j < additionalFruits; j++) {
        placeFruit();
      }

      scoreDisplay.textContent = `スコア: ${score}`;
      break;
    }
  }

  if (!ateFruit) {
    if (growSegments > 0) {
      growSegments--;
    } else {
      snake.pop();
    }
  }
}

function placeFruit() {
  const cols = Math.floor(canvas.width / gridSize);
  const rows = Math.floor(canvas.height / gridSize);
  let x, y, isApple, isValidPosition;

  do {
    x = Math.floor(Math.random() * cols) * gridSize;
    y = Math.floor(Math.random() * rows) * gridSize;

    isValidPosition =
      !snake.some(segment => segment.x === x && segment.y === y) &&
      !fruits.some(fruit => fruit.x === x && fruit.y === y);
  } while (!isValidPosition);

  isApple = Math.random() < 0.5;

  fruits.push({
    x: x,
    y: y,
    type: isApple ? "apple" : "banana",
    color: isApple ? "red" : "yellow"
  });
}

function didGameEnd() {
  const head = snake[0];
  return (
    head.x < 0 || head.x >= canvas.width ||
    head.y < 0 || head.y >= canvas.height ||
    snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
  );
}

function changeDirection(event) {
  const key = event.key;

  const last = directionQueue.length > 0
    ? directionQueue[directionQueue.length - 1]
    : { dx, dy };

  let newDir = null;

  if (key === "ArrowLeft" && last.dx !== gridSize) {
    newDir = { dx: -gridSize, dy: 0 };
  } else if (key === "ArrowUp" && last.dy !== gridSize) {
    newDir = { dx: 0, dy: -gridSize };
  } else if (key === "ArrowRight" && last.dx !== -gridSize) {
    newDir = { dx: gridSize, dy: 0 };
  } else if (key === "ArrowDown" && last.dy !== -gridSize) {
    newDir = { dx: 0, dy: gridSize };
  }

  if (newDir && directionQueue.length < 2) {
    directionQueue.push(newDir);
  }
}

document.addEventListener("keydown", changeDirection);

document.addEventListener("keydown", (e) => {
  if ((e.key === "Shift" || e.key === "r" || e.key === " ") && gameOverDiv.style.display === "block") {
    initGame();
  }
});
