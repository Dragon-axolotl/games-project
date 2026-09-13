/* =========================================================
   CODING MAGIC
========================================================= */

const USER_STORAGE_KEY = "coding-magic-user";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

/* ============ ДИНОЗАВР ============ */

class DinoPlayer {
  WALK_ANIMATION_TIMER = 200;
  walkAnimationTimer = this.WALK_ANIMATION_TIMER;
  dinoRunImages = [];
  jumpPressed = false; jumpInProgress = false; falling = false;
  JUMP_SPEED = 0.5; GRAVITY = 0.3;

  constructor(ctx, width, height, minJumpHeight, maxJumpHeight, scaleRatio) {
    this.ctx = ctx; this.canvas = ctx.canvas;
    this.width = width; this.height = height;
    this.minJumpHeight = minJumpHeight; this.maxJumpHeight = maxJumpHeight;
    this.scaleRatio = scaleRatio;
    this.x = 10 * scaleRatio;
    this.y = this.canvas.height - this.height - 1.5 * scaleRatio;
    this.yStandingPosition = this.y;
    this.standingStillImage = new Image();
    this.standingStillImage.src = "imgs/standing_still.png";
    this.image = this.standingStillImage;
    const dinoRunImage1 = new Image(); dinoRunImage1.src = "imgs/dino_run1.png";
    const dinoRunImage2 = new Image(); dinoRunImage2.src = "imgs/dino_run2.png";
    this.dinoRunImages.push(dinoRunImage1);
    this.dinoRunImages.push(dinoRunImage2);
    this.keydown = this.keydown.bind(this);
    this.touchstart = this.touchstart.bind(this);
    window.addEventListener("keydown", this.keydown);
    window.addEventListener("touchstart", this.touchstart);
  }
  destroy() {
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("touchstart", this.touchstart);
  }
  touchstart = () => { this.jumpPressed = true; };
  keydown = (event) => {
    if (event.code === "Space" && !event.repeat) {
      event.preventDefault();
      this.jumpPressed = true;
    }
  };
  update(gameSpeed, frameTimeDelta) {
    this.run(gameSpeed, frameTimeDelta);
    if (this.jumpInProgress) this.image = this.standingStillImage;
    this.jump(frameTimeDelta);
  }
  jump(frameTimeDelta) {
    if (this.jumpPressed) { this.jumpInProgress = true; this.jumpPressed = false; }
    if (this.jumpInProgress && !this.falling) {
      if (this.y > this.canvas.height - this.maxJumpHeight) {
        this.y -= this.JUMP_SPEED * frameTimeDelta * this.scaleRatio;
      } else this.falling = true;
    } else {
      if (this.y < this.yStandingPosition) {
        this.y += this.GRAVITY * frameTimeDelta * this.scaleRatio;
        if (this.y + this.height > this.canvas.height) {
          this.y = this.yStandingPosition;
          this.falling = false;
          this.jumpInProgress = this.jumpPressed;
          this.jumpPressed = false;
        }
      } else { this.falling = false; this.jumpInProgress = false; }
    }
  }
  run(gameSpeed, frameTimeDelta) {
    if (this.walkAnimationTimer <= 0) {
      this.image = this.image === this.dinoRunImages[0] ? this.dinoRunImages[1] : this.dinoRunImages[0];
      this.walkAnimationTimer = this.WALK_ANIMATION_TIMER;
    }
    this.walkAnimationTimer -= frameTimeDelta * gameSpeed;
  }
  draw() { this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
}

class DinoGround {
  constructor(ctx, width, height, speed, scaleRatio) {
    this.ctx = ctx; this.canvas = ctx.canvas;
    this.width = width; this.height = height;
    this.speed = speed; this.scaleRatio = scaleRatio;
    this.x = 0; this.y = this.canvas.height - this.height;
    this.groundImage = new Image();
    this.groundImage.src = "imgs/ground.png";
  }
  update(gameSpeed, frameTimeDelta) {
    this.x -= gameSpeed * frameTimeDelta * this.speed * this.scaleRatio;
  }
  draw() {
    this.ctx.drawImage(this.groundImage, this.x, this.y, this.width, this.height);
    this.ctx.drawImage(this.groundImage, this.x + this.width, this.y, this.width, this.height);
    if (this.x < -this.width) this.x = 0;
  }
  reset() { this.x = 0; }
}

class DinoCactus {
  constructor(ctx, x, y, width, height, image) {
    this.ctx = ctx; this.x = x; this.y = y;
    this.width = width; this.height = height; this.image = image;
  }
  update(speed, gameSpeed, frameTimeDelta, scaleRatio) {
    this.x -= speed * gameSpeed * frameTimeDelta * scaleRatio;
  }
  draw() { this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
  collideWith(sprite) {
    const adjustBy = 1.4;
    return (
      sprite.x < this.x + this.width / adjustBy &&
      sprite.x + sprite.width / adjustBy > this.x &&
      sprite.y < this.y + this.height / adjustBy &&
      sprite.y + sprite.height / adjustBy > this.y
    );
  }
}

class DinoCactiController {
  CACTUS_INTERVAL_MIN = 900;
  CACTUS_INTERVAL_MAX = 2800;
  nextCactusInterval = null;
  cacti = [];
  constructor(ctx, cactiImages, scaleRatio, speed) {
    this.ctx = ctx; this.canvas = ctx.canvas;
    this.cactiImages = cactiImages;
    this.scaleRatio = scaleRatio; this.speed = speed;
    this.setNextCactusTime();
  }
  setNextCactusTime() {
    this.nextCactusInterval = this.getRandomNumber(this.CACTUS_INTERVAL_MIN, this.CACTUS_INTERVAL_MAX);
  }
  getRandomNumber(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }
  createCactus() {
    const index = this.getRandomNumber(0, this.cactiImages.length - 1);
    const cactusImage = this.cactiImages[index];
    const x = this.canvas.width * 1.5;
    const y = this.canvas.height - cactusImage.height;
    this.cacti.push(new DinoCactus(this.ctx, x, y, cactusImage.width, cactusImage.height, cactusImage.image));
  }
  update(gameSpeed, frameTimeDelta) {
    if (this.nextCactusInterval <= 0) { this.createCactus(); this.setNextCactusTime(); }
    this.nextCactusInterval -= frameTimeDelta;
    this.cacti.forEach((c) => c.update(this.speed, gameSpeed, frameTimeDelta, this.scaleRatio));
    this.cacti = this.cacti.filter((c) => c.x > -c.width);
  }
  draw() { this.cacti.forEach((c) => c.draw()); }
  collideWith(sprite) { return this.cacti.some((c) => c.collideWith(sprite)); }
  reset() { this.cacti = []; }
}

class DinoScore {
  score = 0;
  HIGH_SCORE_KEY = "highScore";
  constructor(ctx, scaleRatio) {
    this.ctx = ctx; this.canvas = ctx.canvas; this.scaleRatio = scaleRatio;
  }
  update(frameTimeDelta) { this.score += frameTimeDelta * 0.01; }
  reset() { this.score = 0; }
  setHighScore() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    if (this.score > highScore) localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
  }
  draw() {
    const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
    const y = 20 * this.scaleRatio;
    this.ctx.font = `${20 * this.scaleRatio}px serif`;
    this.ctx.fillStyle = "#525250";
    const scoreX = this.canvas.width - 75 * this.scaleRatio;
    const highScoreX = scoreX - 125 * this.scaleRatio;
    this.ctx.fillText(Math.floor(this.score).toString().padStart(6, 0), scoreX, y);
    this.ctx.fillText(`HI ${highScore.toString().padStart(6, 0)}`, highScoreX, y);
  }
}

/* ============ ИГРЫ ============ */

function renderLeapYear() {
  return `<div style="width:100%">
    <form class="form-row" data-leap-form>
      <input class="form-row__input" data-leap-input type="number" min="1900" max="2100" placeholder="Введіть рік народження" required />
      <button class="form-row__btn" type="submit">🔍</button>
    </form>
    <p class="result" data-leap-result></p>
  </div>`;
}
function initLeapYear(section) {
  const form = $("[data-leap-form]", section);
  const input = $("[data-leap-input]", section);
  const result = $("[data-leap-result]", section);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const year = Number(input.value);
    const maxYear = new Date().getFullYear();
    if (year < 1900 || year > maxYear) { result.textContent = "Введіть коректний рік."; return; }
    const isLeap = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
    result.textContent = `${year} рік був ${isLeap ? "високосним" : "невисокосним"}.`;
  });
}

function renderGuessNumber() {
  return `<div style="width:100%">
    <form class="form-row" data-guess-form>
      <input class="form-row__input" data-guess-input type="number" min="1" max="10" placeholder="Число від 1 до 10" required />
      <button class="form-row__btn" type="submit">🔍</button>
    </form>
    <p class="result" data-guess-result></p>
  </div>`;
}
function initGuessNumber(section) {
  const form = $("[data-guess-form]", section);
  const input = $("[data-guess-input]", section);
  const result = $("[data-guess-result]", section);
  let secret = Math.floor(Math.random() * 10) + 1;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const guess = Number(input.value);
    if (guess === secret) {
      result.textContent = `Вітаю ви вгадали число ${secret}`;
      secret = Math.floor(Math.random() * 10) + 1;
    } else {
      result.textContent = `Ви програли, компютер загадав ${secret}`;
    }
  });
}

function renderRPS() {
  return `<div style="width:100%">
    <div class="rps">
      <button class="rps__btn" data-rps-choice="камінь" type="button">🪨</button>
      <button class="rps__btn" data-rps-choice="ножиці" type="button">✂️</button>
      <button class="rps__btn" data-rps-choice="папір" type="button">📄</button>
      <div class="rps__score">
        <div>Рахунок:</div>
        <div>Комп'ютер — <span data-rps-computer>0</span></div>
        <div>Ви — <span data-rps-player>0</span></div>
      </div>
    </div>
    <p class="result" data-rps-result></p>
    <button class="rps__computer-btn" data-rps-show type="button">Варіант комп'ютера</button>
  </div>`;
}
function initRPS(section) {
  const choices = ["камінь", "ножиці", "папір"];
  const result = $("[data-rps-result]", section);
  const playerEl = $("[data-rps-player]", section);
  const computerEl = $("[data-rps-computer]", section);
  const showBtn = $("[data-rps-show]", section);
  let playerScore = 0, computerScore = 0, lastComputerChoice = "";
  $$("[data-rps-choice]", section).forEach((btn) => {
    btn.addEventListener("click", () => {
      const player = btn.dataset.rpsChoice;
      const computer = choices[Math.floor(Math.random() * choices.length)];
      lastComputerChoice = computer;
      if (player === computer) result.textContent = "Нічия!";
      else if (
        (player === "камінь" && computer === "ножиці") ||
        (player === "ножиці" && computer === "папір") ||
        (player === "папір" && computer === "камінь")
      ) { playerScore++; result.textContent = "Ви перемогли!"; }
      else { computerScore++; result.textContent = "Переміг комп'ютер!"; }
      playerEl.textContent = playerScore;
      computerEl.textContent = computerScore;
    });
  });
  showBtn.addEventListener("click", () => {
    if (!lastComputerChoice) { result.textContent = "Спочатку зробіть свій вибір"; return; }
    result.textContent = `Комп'ютер обрав: ${lastComputerChoice}`;
  });
}

function renderCalculator() {
  return `<div class="calculator">
    <input class="calculator__input" data-calc-a type="number" placeholder="Введіть число" />
    <div class="calculator__operations">
      <button class="calculator__operation" data-operation="add" type="button">+</button>
      <button class="calculator__operation" data-operation="subtract" type="button">−</button>
      <button class="calculator__operation" data-operation="multiply" type="button">×</button>
      <button class="calculator__operation" data-operation="divide" type="button">÷</button>
    </div>
    <input class="calculator__input" data-calc-b type="number" placeholder="Введіть число" />
    <button class="calculator__equals" data-calc-go type="button">=</button>
    <input class="calculator__result" data-calc-result placeholder="Результат" readonly />
  </div>`;
}
function initCalculator(section) {
  let selectedOperation = "";
  const result = $("[data-calc-result]", section);
  $$("[data-operation]", section).forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedOperation = btn.dataset.operation;
      $$("[data-operation]", section).forEach((b) => b.classList.toggle("calculator__operation--selected", b === btn));
    });
  });
  $("[data-calc-go]", section).addEventListener("click", () => {
    const first = $("[data-calc-a]", section).value;
    const second = $("[data-calc-b]", section).value;
    if (first === "" || second === "" || !selectedOperation) { result.value = "Заповніть поля"; return; }
    const a = Number(first), b = Number(second);
    const answers = {
      add: `Сумма чисел ${a} і ${b} = ${a + b}`,
      subtract: `Різниця чисел ${a} і ${b} = ${a - b}`,
      multiply: `Добуток чисел ${a} і ${b} = ${a * b}`,
      divide: b === 0 ? "На 0 ділити не можна" : `Частка чисел ${a} і ${b} = ${a / b}`
    };
    result.value = answers[selectedOperation];
  });
}

function renderTimeCalculator() {
  return `<div class="time-calc">
    <input class="time-calc__input" data-time-min type="number" placeholder="Введіть хвилини" />
    <button class="time-calc__btn" data-time-go type="button">🔍</button>
    <span class="time-calc__result" data-time-result>—</span>
  </div>`;
}
function initTimeCalculator(section) {
  const input = $("[data-time-min]", section);
  const btn = $("[data-time-go]", section);
  const result = $("[data-time-result]", section);
  btn.addEventListener("click", () => {
    if (input.value === "") { result.textContent = "Введіть число"; return; }
    const minutes = Number(input.value);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    result.textContent = `${h}:${String(m).padStart(2, "0")}`;
  });
}

function renderDino() {
  return `<div class="dino-stage"><canvas data-dino-canvas></canvas></div>`;
}
function initDino(section) {
  const canvas = $("[data-dino-canvas]", section);
  const ctx = canvas.getContext("2d");
  const GAME_SPEED_START = 1;
  const GAME_SPEED_INCREMENT = 0.00001;
  const GAME_WIDTH = 800, GAME_HEIGHT = 200;
  const PLAYER_WIDTH = 88 / 1.5, PLAYER_HEIGHT = 94 / 1.5;
  const MAX_JUMP_HEIGHT = GAME_HEIGHT, MIN_JUMP_HEIGHT = 150;
  const GROUND_WIDTH = 2400, GROUND_HEIGHT = 24;
  const GROUND_AND_CACTUS_SPEED = 0.5;
  const CACTI_CONFIG = [
    { width: 48 / 1.5, height: 100 / 1.5, image: "imgs/cactus_1.png" },
    { width: 98 / 1.5, height: 100 / 1.5, image: "imgs/cactus_2.png" },
    { width: 68 / 1.5, height: 70 / 1.5, image: "imgs/cactus_3.png" },
  ];
  let player = null, ground = null, cactiController = null, score = null;
  let scaleRatio = 1, previousTime = null, gameSpeed = GAME_SPEED_START;
  let gameOver = false, hasAddedEventListenersForRestart = false, waitingToStart = true;
  let rafId = null, destroyed = false;

  function getScaleRatio() {
    const sh = Math.min(window.innerHeight, document.documentElement.clientHeight);
    const sw = Math.min(window.innerWidth, document.documentElement.clientWidth);
    if (sw / sh < GAME_WIDTH / GAME_HEIGHT) return sw / GAME_WIDTH;
    return sh / GAME_HEIGHT;
  }
  function createSprites() {
    player = new DinoPlayer(ctx, PLAYER_WIDTH * scaleRatio, PLAYER_HEIGHT * scaleRatio, MIN_JUMP_HEIGHT * scaleRatio, MAX_JUMP_HEIGHT * scaleRatio, scaleRatio);
    ground = new DinoGround(ctx, GROUND_WIDTH * scaleRatio, GROUND_HEIGHT * scaleRatio, GROUND_AND_CACTUS_SPEED, scaleRatio);
    const cactiImages = CACTI_CONFIG.map((c) => {
      const image = new Image(); image.src = c.image;
      return { image, width: c.width * scaleRatio, height: c.height * scaleRatio };
    });
    cactiController = new DinoCactiController(ctx, cactiImages, scaleRatio, GROUND_AND_CACTUS_SPEED);
    score = new DinoScore(ctx, scaleRatio);
  }
  function setScreen() {
    scaleRatio = getScaleRatio();
    canvas.width = GAME_WIDTH * scaleRatio;
    canvas.height = GAME_HEIGHT * scaleRatio;
    createSprites();
  }
  setScreen();
  const onResize = () => setTimeout(() => !destroyed && setScreen(), 500);
  window.addEventListener("resize", onResize);
  function showGameOver() {
    ctx.font = `${70 * scaleRatio}px Verdana`;
    ctx.fillStyle = "grey";
    ctx.fillText("ГРУ ЗАКІНЧЕНО", canvas.width / 4.5, canvas.height / 2);
  }
  function showStartGameText() {
    ctx.font = `${40 * scaleRatio}px Verdana`;
    ctx.fillStyle = "grey";
    ctx.fillText("Торкніться екрана або натисніть пробіл", canvas.width / 14, canvas.height / 2);
  }
  function setupGameReset() {
    if (!hasAddedEventListenersForRestart) {
      hasAddedEventListenersForRestart = true;
      setTimeout(() => {
        const restartOnSpace = (event) => {
          if (event.code !== "Space") return;
          event.preventDefault();
          reset();
          window.removeEventListener("keydown", restartOnSpace);
        };
        window.addEventListener("keydown", restartOnSpace);
        window.addEventListener("touchstart", reset, { once: true });
      }, 1000);
    }
  }
  function reset() {
    hasAddedEventListenersForRestart = false;
    gameOver = false; waitingToStart = false;
    ground.reset(); cactiController.reset(); score.reset();
    gameSpeed = GAME_SPEED_START;
  }
  function clearScreen() { ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  function gameLoop(currentTime) {
    if (destroyed) return;
    if (previousTime === null) { previousTime = currentTime; rafId = requestAnimationFrame(gameLoop); return; }
    const d = Math.min(currentTime - previousTime, 100);
    previousTime = currentTime;
    clearScreen();
    if (!gameOver && !waitingToStart) {
      ground.update(gameSpeed, d);
      cactiController.update(gameSpeed, d);
      player.update(gameSpeed, d);
      score.update(d);
      gameSpeed += d * GAME_SPEED_INCREMENT;
    }
    if (!gameOver && cactiController.collideWith(player)) {
      gameOver = true; setupGameReset(); score.setHighScore();
    }
    ground.draw(); cactiController.draw(); player.draw(); score.draw();
    if (gameOver) showGameOver();
    if (waitingToStart) showStartGameText();
    rafId = requestAnimationFrame(gameLoop);
  }
  rafId = requestAnimationFrame(gameLoop);
  const onKeyStart = (e) => {
    if (waitingToStart && e.code === "Space") { e.preventDefault(); waitingToStart = false; }
  };
  const onTouchStart = () => { if (waitingToStart) waitingToStart = false; };
  window.addEventListener("keydown", onKeyStart);
  window.addEventListener("touchstart", onTouchStart);
  section._dinoCleanup = () => {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("keydown", onKeyStart);
    window.removeEventListener("touchstart", onTouchStart);
    if (player && typeof player.destroy === "function") player.destroy();
  };
}

function renderFootball() {
  return `<div class="football-field" data-football-field tabindex="0">
    <div class="football-field__ball" data-football-ball>⚽</div>
  </div>`;
}
function initFootball(section) {
  const field = $("[data-football-field]", section);
  const ball = $("[data-football-ball]", section);
  field.addEventListener("click", (event) => {
    const rect = field.getBoundingClientRect();
    const ballRect = ball.getBoundingClientRect();
    const halfW = ballRect.width / 2, halfH = ballRect.height / 2;
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    x = Math.max(halfW, Math.min(rect.width - halfW, x));
    y = Math.max(halfH, Math.min(rect.height - halfH, y));
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;
    ball.style.transform = "translate(-50%, -50%)";
  });
}

function renderThreeNumbers() {
  return `<div class="three-numbers">
    <input class="three-numbers__input" data-num="1" type="text" placeholder="Введіть число" />
    <input class="three-numbers__input" data-num="2" type="text" placeholder="Введіть число" />
    <input class="three-numbers__input" data-num="3" type="text" placeholder="Введіть число" />
  </div>
  <p class="three-numbers__result">
    Найбільше число, яке ви ввели — <span data-three-result>число</span>
  </p>`;
}
function initThreeNumbers(section) {
  const inputs = $$("[data-num]", section);
  const result = $("[data-three-result]", section);
  function findMax() {
    const values = [];
    for (const i of inputs) {
      if (i.value === "") return;
      const num = Number(i.value);
      if (isNaN(num)) { result.textContent = "Введіть коректні числа"; return; }
      values.push(num);
    }
    result.textContent = Math.max(...values);
  }
  inputs.forEach((input) => input.addEventListener("input", findMax));
}

/* ============ ВЧЕНІ ============ */

const scientists = [
  { name: "Albert", surname: "Einstein", born: 1879, dead: 1955, id: 1 },
  { name: "Isaac", surname: "Newton", born: 1643, dead: 1727, id: 2 },
  { name: "Galileo", surname: "Galilei", born: 1564, dead: 1642, id: 3 },
  { name: "Marie", surname: "Curie", born: 1867, dead: 1934, id: 4 },
  { name: "Johannes", surname: "Kepler", born: 1571, dead: 1630, id: 5 },
  { name: "Nicolaus", surname: "Copernicus", born: 1473, dead: 1543, id: 6 },
  { name: "Max", surname: "Planck", born: 1858, dead: 1947, id: 7 },
  { name: "Katherine", surname: "Blodgett", born: 1898, dead: 1979, id: 8 },
  { name: "Ada", surname: "Lovelace", born: 1815, dead: 1852, id: 9 },
  { name: "Sarah E.", surname: "Goode", born: 1855, dead: 1905, id: 10 },
  { name: "Lise", surname: "Meitner", born: 1878, dead: 1968, id: 11 },
  { name: "Hanna", surname: "Hammarström", born: 1829, dead: 1909, id: 12 },
];

let workingScientists = [...scientists];

function renderScientists() {
  return `<div class="scientists">
    <div class="scientists__grid" data-scientist-grid></div>
    <div class="scientists__row">
      <button class="scientists__btn" data-sci="born19" type="button">Вчені, що народилися в 19 ст.</button>
      <button class="scientists__btn" data-sci="totalYears" type="button">Сума років усіх вчених</button>
    </div>
    <div class="scientists__row">
      <button class="scientists__btn" data-sci="alphabet" type="button">Сортувати за алфавітом</button>
      <button class="scientists__btn" data-sci="age" type="button">Сортувати за кількістю прожитих років</button>
    </div>
    <div class="scientists__row">
      <button class="scientists__btn" data-sci="removeOld" type="button">Видалити тих, хто народився в 15/16/17 ст.</button>
      <button class="scientists__btn" data-sci="latest" type="button">Хто народився найпізніше</button>
    </div>
    <div class="scientists__row">
      <button class="scientists__btn" data-sci="einstein" type="button">Рік народження Einstein</button>
      <button class="scientists__btn" data-sci="c" type="button">Прізвище на літеру "C"</button>
    </div>
    <div class="scientists__row">
      <button class="scientists__btn" data-sci="removeA" type="button">Видалити імена на "A"</button>
      <button class="scientists__btn" data-sci="longest" type="button">Найдовше і найменше прожив</button>
    </div>
    <div class="scientists__row">
      <button class="scientists__btn" data-sci="same" type="button">Однакові перші літери імені та прізвища</button>
      <button class="scientists__btn" data-sci="allWorked19" type="button">Чи всі працювали в 19 ст.</button>
    </div>
    <button class="scientists__btn scientists__btn--last" data-sci="reset" type="button">
      Показати всіх
    </button>
  </div>`;
}

function initScientists(section) {
  const grid = $("[data-scientist-grid]", section);

  function show(list) {
    grid.innerHTML = list.map((s) =>
      `<div class="scientists__card">${s.name} ${s.surname}<br>${s.born}–${s.dead}</div>`
    ).join("");
  }

  const actions = {
    born19: () => workingScientists.filter((s) => s.born >= 1800 && s.born < 1900),
    totalYears: () => {
      const total = workingScientists.reduce((sum, s) => sum + (s.dead - s.born), 0);
      grid.innerHTML = `<div class="scientists__card" style="width:auto;padding:10px 20px;">Сума прожитих років: ${total}</div>`;
      return null;
    },
    alphabet: () => [...workingScientists].sort((a, b) => a.surname.localeCompare(b.surname)),
    age: () => [...workingScientists].sort((a, b) => (a.dead - a.born) - (b.dead - b.born)),
    removeOld: () => {
      workingScientists = workingScientists.filter((s) => s.born >= 1700);
      return workingScientists;
    },
    latest: () => [workingScientists.reduce((a, b) => (a.born > b.born ? a : b))],
    einstein: () => workingScientists.filter((s) => s.surname === "Einstein"),
    c: () => workingScientists.filter((s) => s.surname.startsWith("C")),
    removeA: () => {
      workingScientists = workingScientists.filter((s) => !s.name.startsWith("A"));
      return workingScientists;
    },
    longest: () => {
      const sorted = [...workingScientists].sort((a, b) => (a.dead - a.born) - (b.dead - b.born));
      return [sorted[0], sorted[sorted.length - 1]];
    },
    same: () => workingScientists.filter((s) => s.name[0].toLowerCase() === s.surname[0].toLowerCase()),
    allWorked19: () => {
      const allWorked19 = workingScientists.every((s) => s.born < 1900 && s.dead >= 1800);
      grid.innerHTML = `<div class="scientists__card" style="width:auto;padding:10px 20px;">${allWorked19 ? "Так, всі працювали в 19 ст." : "Ні, не всі працювали в 19 ст."}</div>`;
      return null;
    },
    reset: () => {
      workingScientists = [...scientists];
      return workingScientists;
    },
  };

  show(workingScientists);

  $$("[data-sci]", section).forEach((btn) => {
    btn.addEventListener("click", () => {
      const fn = actions[btn.dataset.sci];
      if (!fn) return;
      const res = fn();
      if (res) show(res);
    });
  });
}

/* ============ КОМАНДА ============ */
const teamMembers = [
  { name: "Кіра Круль",       description: "Всім привіт! Мене звати Кіра. Я зробила калькулятор, футбол та цю секцію.", image: "./imgs/goose.jpg" },
  { name: "Євгенія Ворона",   description: "Привіт всім. Мене звати Женя. Я зробила гру камінь-ножиці-папір та калькулятор часу.", image: "./imgs/cat.jpg" },
  { name: "Діана Островська", description: "Привіт! Я Діана, і я відповідала за «Введіть 3 числа» та «Обери вченого/их».", image: "./imgs/rabbit.jpg" },
  { name: "Петро Шалапа",     description: "Привіт 🙋. Мене звати Петро. Мені 15 років. Я робив перші 2 гри та динозаврика.", image: "./imgs/bobuin.jpg" },
];

function renderTeamSlider() {
  return `<div class="team-slider">
    <button class="team-slider__arrow" data-team-prev type="button">‹</button>
    <div class="team-slider__card">
      <div class="team-slider__photo" data-team-photo><span class="team-slider__photo-placeholder">Фото</span></div>
      <h3 class="team-slider__name" data-team-name></h3>
      <p class="team-slider__description" data-team-desc></p>
      <div class="team-slider__dots" data-team-dots></div>
    </div>
    <button class="team-slider__arrow" data-team-next type="button">›</button>
  </div>`;
}
function initTeamSlider(section) {
  let current = 0;
  const prevBtn = $("[data-team-prev]", section);
  const nextBtn = $("[data-team-next]", section);
  const photo = $("[data-team-photo]", section);
  const nameEl = $("[data-team-name]", section);
  const descEl = $("[data-team-desc]", section);
  const dotsEl = $("[data-team-dots]", section);

  function render() {
    const m = teamMembers[current];
    photo.innerHTML = m.image
      ? `<img class="team-slider__photo-image" src="${m.image}" alt="${m.name}" />`
      : `<span class="team-slider__photo-placeholder">Фото</span>`;
    nameEl.textContent = m.name;
    descEl.textContent = m.description;

    dotsEl.innerHTML = teamMembers.map((_, i) =>
      `<button class="team-slider__dot ${i === current ? "team-slider__dot--active" : ""}" data-team-dot="${i}" type="button"></button>`
    ).join("");
    $$("[data-team-dot]", dotsEl).forEach((dot) => {
      dot.addEventListener("click", () => { current = Number(dot.dataset.teamDot); render(); });
    });

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === teamMembers.length - 1;
  }

  prevBtn.addEventListener("click", () => { if (current > 0) { current--; render(); } });
  nextBtn.addEventListener("click", () => { if (current < teamMembers.length - 1) { current++; render(); } });

  render();
}

/* ============ МАССИВ ИГР ============ */

const games = [
  { id: 1,  name: "Високосний калькулятор", category: "numerical",    render: renderLeapYear,       init: initLeapYear },
  { id: 2,  name: "Вгадай число",           category: "numerical",    render: renderGuessNumber,    init: initGuessNumber },
  { id: 3,  name: "Камінь-Ножиці-Папір",    category: "game",         render: renderRPS,            init: initRPS },
  { id: 4,  name: "Калькулятор",            category: "numerical",    render: renderCalculator,     init: initCalculator },
  { id: 5,  name: "Калькулятор часу",       category: "numerical",    render: renderTimeCalculator, init: initTimeCalculator },
  { id: 6,  name: "Google динозаврик",      category: "game",         render: renderDino,           init: initDino },
  { id: 7,  name: "Футбол",                 category: "game",         render: renderFootball,       init: initFootball },
  { id: 8,  name: "Найбільше число",        category: "numerical",    render: renderThreeNumbers,   init: initThreeNumbers },
  { id: 9,  name: "Наша команда",           category: "acquaintance", render: renderTeamSlider,     init: initTeamSlider },
  { id: 10, name: "Вчений",                 category: "acquaintance", render: renderScientists,     init: initScientists },
];

/* ============ МОДАЛКИ ============ */
const openModal = (modal) => { modal.hidden = false; document.body.classList.add("page--modal-open"); };
const closeModal = (modal) => {
  modal.hidden = true;
  if (!document.querySelector(".modal:not([hidden])")) document.body.classList.remove("page--modal-open");
};

/* ============ HTML ============ */
document.body.innerHTML = `
  <header class="site-header">
    <div class="site-header__container">
      <a class="site-logo" href="#">
        <span class="site-logo__code">&lt;/&gt;</span>
        <span class="site-logo__text">Coding<small>Magic</small></span>
      </a>
      <nav class="site-nav">
        <div class="site-nav__dropdown" id="games-dropdown">
          <button class="site-nav__toggle" id="games-menu-toggle" type="button" aria-expanded="false">
            Інтерактив <span class="site-nav__arrow">⌄</span>
          </button>
          <div class="site-nav__menu" id="games-menu"></div>
        </div>
        <button class="site-nav__link" id="goto-team-btn" type="button">Наша команда</button>
        <a class="site-nav__link" href="#contacts">Контакти</a>
      </nav>
      <label class="theme-switch">
        <input class="theme-switch__input" id="theme-toggle" type="checkbox" />
        <span class="theme-switch__slider"></span>
      </label>
      <span class="site-header__user" id="user-name">Вітаємо, User!</span>
    </div>
  </header>

  <main class="site-main">
    <div class="site-main__content">
      <section class="games" id="games">
        <h1 class="games__title">Популярні інтерактивні ігри</h1>
        <div class="games__list" id="games-list"></div>
      </section>
    </div>
  </main>

  <footer class="site-footer" id="contacts">
    <div class="site-footer__container">
      <div class="site-footer__logo site-logo">
        <span class="site-logo__code">&lt;/&gt;</span>
        <span class="site-logo__text">Coding<small>Magic</small></span>
      </div>
      <div class="site-footer__info">
        <p>Тел: +38 (123) 456 78 90</p>
        <p>E-mail: codingmagic@gmail.com</p>
        <p>Facebook: CodingMagic</p>
        <p>Twitter: CodingMagic</p>
        <p>Instagram: CodingMagic</p>
      </div>
      <form class="subscribe-form" id="subscribe-form">
        <div class="subscribe-form__content">
          <input class="subscribe-form__input" type="email" placeholder="Ваша ел. адреса..." required />
          <button class="subscribe-form__button" type="submit">Підписатись</button>
        </div>
        <small class="subscribe-form__hint">Підписавшись, Ви дозволяєте отримувати інформацію про новинки на сайті.</small>
      </form>
    </div>
  </footer>

  <div class="modal" id="welcome-modal" hidden>
    <div class="modal__card">
      <button type="button" class="modal__close">×</button>
      <div class="modal__decor modal__decor--sword">⚔</div>
      <div class="modal__decor modal__decor--puzzle">♧</div>
      <div class="modal__decor modal__decor--code">&lt;/&gt;</div>
      <div class="modal__decor modal__decor--game">⊞</div>
      <h2 class="modal__title">Привіт!</h2>
      <p class="modal__text">Ви потрапили на сайт інтерактивних ігор та завдань. Надіємось, що вам сподобається!</p>
      <form id="welcome-form" class="welcome-form">
        <label class="welcome-form__label" for="visitor-name">Введіть своє ім'я:</label>
        <input class="welcome-form__input" id="visitor-name" placeholder="Ваше ім'я..." required />
        <button class="welcome-form__button" type="submit">Зберегти</button>
      </form>
    </div>
  </div>

  <div class="modal" id="subscription-modal" hidden>
    <div class="modal__card">
      <button type="button" class="modal__close">×</button>
      <div class="modal__decor modal__decor--sword">⚔</div>
      <div class="modal__decor modal__decor--puzzle">♧</div>
      <div class="modal__decor modal__decor--code">&lt;/&gt;</div>
      <div class="modal__decor modal__decor--game">⊞</div>
      <h2 class="modal__title">Дякую за підписку!</h2>
    </div>
  </div>
`;

/* ============ МОДАЛКИ ============ */
$$(".modal__close").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.closest(".modal")));
});
$$(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $$(".modal:not([hidden])").forEach(closeModal);
});

/* ============ ТЕМА (без localStorage) ============ */
const themeToggle = $("#theme-toggle");
themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("page--dark", themeToggle.checked);
});

/* ============ ДРОПДАУН ============ */
const dropdown = $("#games-dropdown");
const menuToggle = $("#games-menu-toggle");
menuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = dropdown.classList.toggle("site-nav__dropdown--open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove("site-nav__dropdown--open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

/* ============ ФИЛЬТР ============ */
let activeCategory = null;

function renderGameMenu() {
  const menu = $("#games-menu");
  menu.innerHTML = `
    <button class="site-nav__menu-link" data-category="all" type="button">Всі ігри</button>
    <button class="site-nav__menu-link" data-category="numerical" type="button">Числовий</button>
    <button class="site-nav__menu-link" data-category="game" type="button">Ігровий</button>
    <button class="site-nav__menu-link" data-category="acquaintance" type="button">Ознайомчий</button>
  `;

  $$("[data-category]", menu).forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.category;
      if (cat === "all") activeCategory = null;
      else activeCategory = activeCategory === cat ? null : cat;
      renderGames();
      updateMenuHighlight();
      dropdown.classList.remove("site-nav__dropdown--open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
  updateMenuHighlight();
}

function updateMenuHighlight() {
  $$("[data-category]").forEach((btn) => {
    const isActive =
      (btn.dataset.category === "all" && activeCategory === null) ||
      (btn.dataset.category === activeCategory);
    btn.classList.toggle("site-nav__menu-link--active", isActive);
  });
}

/* ============ РЕНДЕР ============ */
function renderGameCard(game) {
  const section = document.createElement("section");
  section.className = "game-section game-section--dynamic";
  section.id = `game-${game.id}`;
  section.dataset.gameId = game.id;
  section.innerHTML = `<h2 class="game-section__title">${game.name}</h2><div class="game-section__body"></div>`;
  section.querySelector(".game-section__body").innerHTML = game.render();
  game.init(section);
  return section;
}

function renderGames() {
  const list = $("#games-list");
  list.innerHTML = "";
  const filtered = activeCategory
    ? games.filter((g) => g.category === activeCategory)
    : games;
  filtered.forEach((game) => list.append(renderGameCard(game)));
}

/* ============ ФОРМЫ ============ */
const savedUser = localStorage.getItem(USER_STORAGE_KEY);
if (savedUser) $("#user-name").textContent = `Вітаємо, ${savedUser}!`;

$("#welcome-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#visitor-name").value.trim();
  if (!name) return;
  localStorage.setItem(USER_STORAGE_KEY, name);
  $("#user-name").textContent = `Вітаємо, ${name}!`;
  closeModal($("#welcome-modal"));
});

$("#subscribe-form").addEventListener("submit", (e) => {
  e.preventDefault();
  e.currentTarget.reset();
  openModal($("#subscription-modal"));
});

/* ============ КНОПКА "НАША КОМАНДА" ============ */
$("#goto-team-btn").addEventListener("click", () => {
  activeCategory = "acquaintance";
  renderGames();
  updateMenuHighlight();
  setTimeout(() => {
    const el = document.getElementById("game-9");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, 100);
});

/* ============ ЗАПУСК ============ */
renderGames();
renderGameMenu();
openModal($("#welcome-modal"));