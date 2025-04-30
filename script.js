const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverDiv = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const scoreDisplay = document.getElementById("scoreDisplay");

const gridSize = 20;
const baseMoveInterval = 100;

let moveInterval = baseMoveInterval;
let speedFactor = 1;
let speedTimeouts = [];
let fruits = [];
let nextDx = gridSize;
let nextDy = 0;
let snake, dx, dy, score, changingDirection, gameLoop, growSegments, lastMoveTime;

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
  changingDirection = false;

  speedFactor = 1;
  moveInterval = baseMoveInterval;
  lastMoveTime = Date.now();

  clearTimeouts();
  fruits = [];
  gameOverDiv.style.display = "none";
  scoreDisplay.textContent = "スコア: 0";

  clearInterval(gameLoop);
  placeFruit(); // 最初は1個
  gameLoop = setInterval(draw, 1000 / 60);
}

function clearTimeouts() {
  speedTimeouts.forEach(timeout => clearTimeout(timeout));
  speedTimeouts = [];
}

function drawGrid() {
  const gridSize = 20;
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    // 濃い線にしたい：左端と右端
    if (x === 0 || x === canvas.width) {
      ctx.strokeStyle = '#555'; // 濃い色
      ctx.lineWidth = 2;        // 太め
    } else {
      ctx.strokeStyle = '#444'; // 通常色
      ctx.lineWidth = 1;        // 通常の太さ
    }
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    // 濃い線にしたい：上端と下端
    if (y === 0 || y === canvas.height) {
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
    }
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

  // 移動前に次の方向を反映（ここがラグ解消のキモ！）
  dx = nextDx;
  dy = nextDy;

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

function changeDirection(event) {
  const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
  const goingUp = dy === -gridSize;
  const goingDown = dy === gridSize;
  const goingRight = dx === gridSize;
  const goingLeft = dx === -gridSize;

  switch (event.keyCode) {
    case LEFT:
      if (!goingRight) { nextDx = -gridSize; nextDy = 0; }
      break;
    case UP:
      if (!goingDown) { nextDx = 0; nextDy = -gridSize; }
      break;
    case RIGHT:
      if (!goingLeft) { nextDx = gridSize; nextDy = 0; }
      break;
    case DOWN:
      if (!goingUp) { nextDx = 0; nextDy = gridSize; }
      break;
  }
}


document.addEventListener("keydown", changeDirection);
document.addEventListener('keydown', function(e) {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (direction.y === 0) direction = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      if (direction.y === 0) direction = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (direction.x === 0) direction = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (direction.x === 0) direction = { x: 1, y: 0 };
      break;
  }
});

document.addEventListener("keydown", (e) => {
    // ゲームオーバー画面が表示されている状態で Shift キーが押されたら再スタート
    if (e.key === "Shift" && gameOverDiv.style.display === "block") {
      initGame();
    }
  });
  
initGame();

