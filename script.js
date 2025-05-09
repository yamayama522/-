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

window.addEventListener("resize", () => {
  resizeCanvas();
  initGame();
});

function initGame() {
  resizeCanvas();
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
    ctx.strokeStyle = (x === 0 || x === canvas.width) ? '#555' : '#444';
    ctx.lineWidth = (x === 0 || x === canvas.width) ? 2 : 1;
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.strokeStyle = (y === 0 || y === canvas.height) ? '#555' : '#444';
    ctx.lineWidth = (y === 0 || y === canvas.height) ? 2 : 1;
    ctx.stroke();
  }
}

function drawRect(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, gridSize, gridSize);
}

function draw() {
  const now = Date.now();
  if (now - lastMoveTime < moveInterval) return;

  lastMoveTime = now;

  // ここでキューから次の方向を反映
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

        placeFruit();
        placeFruit(); // バナナで2個追加
      }

      fruits.splice(i, 1);
      placeFruit(); // 補充
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
  const cols = canvas.width / gridSize;
  const rows = canvas.height / gridSize;
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

// 入力キュー対応の方向変更処理
function changeDirection(event) {
  const key = event.keyCode;

  const last = directionQueue.length > 0
    ? directionQueue[directionQueue.length - 1]
    : { dx, dy };

  let newDir = null;
  const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;

  if (key === LEFT && last.dx !== gridSize) {
    newDir = { dx: -gridSize, dy: 0 };
  } else if (key === UP && last.dy !== gridSize) {
    newDir = { dx: 0, dy: -gridSize };
  } else if (key === RIGHT && last.dx !== -gridSize) {
    newDir = { dx: gridSize, dy: 0 };
  } else if (key === DOWN && last.dy !== -gridSize) {
    newDir = { dx: 0, dy: gridSize };
  }

  if (newDir && directionQueue.length < 2) {
    directionQueue.push(newDir);
  }
}

document.addEventListener("keydown", changeDirection);

document.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && gameOverDiv.style.display === "block") {
    initGame();
  }
});

initGame();
