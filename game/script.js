// ------------------------------
// 🔹 Основні змінні гри
// ------------------------------
let coins = 0;
let energy = 500;
const maxEnergy = 500;
const regenRate = 1;
const regenInterval = 2000; // +1 енергія кожні 2 секунди

let xp = 0;
let level = 1;

// ------------------------------
// 🔹 Елементи DOM
// ------------------------------
const tapButton = document.getElementById('tapButton');
const coinsDisplay = document.getElementById('coins');
const profileCoins = document.getElementById('profileCoins');
const energyBar = document.getElementById('energy-bar');
const energyLabel = document.getElementById('energy-label');
const xpDisplay = document.getElementById('xp');
const levelDisplay = document.getElementById('level');

// ------------------------------
// 🧩 Telegram WebApp інтеграція
// ------------------------------
const tg = window.Telegram?.WebApp;
if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
  const user = tg.initDataUnsafe.user;
  const usernameEl = document.getElementById("username");
  const photoEl = document.getElementById("userPhoto");

  // Ім'я користувача
  if (user.username) {
    usernameEl.textContent = `@${user.username}`;
  } else {
    usernameEl.textContent = user.first_name || "Користувач";
  }

  // Аватар
  if (user.photo_url) {
    photoEl.src = user.photo_url;
  }
}

// ------------------------------
// 💾 Збереження / Завантаження
// ------------------------------
function saveGame() {
  const data = { coins, xp, level, energy };
  localStorage.setItem("tapgame_save", JSON.stringify(data));
}

function loadGame() {
  const saved = localStorage.getItem("tapgame_save");
  if (saved) {
    const data = JSON.parse(saved);
    coins = data.coins || 0;
    xp = data.xp || 0;
    level = data.level || 1;
    energy = data.energy || maxEnergy;
  }
}

// ------------------------------
// 🔹 Оновлення енергії
// ------------------------------
function updateEnergy(animated = false) {
  const percent = (energy / maxEnergy) * 100;
  energyBar.style.width = `${percent}%`;
  const text = `${energy}/${maxEnergy} ⚡`;

  if (energyLabel) {
    energyLabel.textContent = text;
    if (animated) {
      energyLabel.style.transform = "translateY(-50%) scale(1.15)";
      setTimeout(() => (energyLabel.style.transform = "translateY(-50%) scale(1)"), 200);
    }
  }

  // Колір енергії
  if (percent > 70) {
    energyBar.style.background = "linear-gradient(90deg, #00f6ff, #00ff99)";
    energyBar.classList.remove("low-energy");
  } else if (percent > 30) {
    energyBar.style.background = "linear-gradient(90deg, #f6ff00, #ffaa00)";
    energyBar.classList.remove("low-energy");
  } else {
    energyBar.style.background = "linear-gradient(90deg, #ff5f5f, #ff0000)";
    if (percent < 10) {
      energyBar.classList.add("low-energy");
    } else {
      energyBar.classList.remove("low-energy");
    }
  }

  // Кнопка активна лише якщо є енергія
  tapButton.disabled = energy <= 0;
  tapButton.style.opacity = energy <= 0 ? "0.5" : "1";
  tapButton.style.cursor = energy <= 0 ? "not-allowed" : "pointer";
}

// ------------------------------
// 🔹 Оновлення XP і рівня
// ------------------------------
function updateXP(amount = 1) {
  xp += amount;
  if (xp >= 100) {
    xp -= 100;
    level++;
  }

  xpDisplay.textContent = `${xp}`;
  levelDisplay.textContent = `${level}`;
  saveGame();
}

// ------------------------------
// 🔹 Ефект монетки
// ------------------------------
function spawnCoin() {
  const coin = document.createElement('div');
  coin.classList.add('coin');
  document.body.appendChild(coin);

  const x = window.innerWidth / 2 + (Math.random() * 60 - 30);
  const y = window.innerHeight / 2;
  coin.style.left = `${x}px`;
  coin.style.top = `${y}px`;

  setTimeout(() => coin.remove(), 1200);
}

// ------------------------------
// ⚡ Блискавка при +енергії
// ------------------------------
function spawnFlash() {
  const flash = document.createElement('div');
  flash.classList.add('energy-flash');
  flash.textContent = '⚡ +1';
  const offsetX = 40 + Math.random() * 20;
  const offsetY = 100 + Math.random() * 10;
  flash.style.left = `${offsetX}px`;
  flash.style.bottom = `${offsetY}px`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1200);
}

// ------------------------------
// 🔸 TAP натискання
// ------------------------------
tapButton.addEventListener('click', () => {
  if (energy <= 0) return;
  coins++;
  energy--;
  updateXP(1);
  coinsDisplay.textContent = coins;
  if (profileCoins) profileCoins.textContent = coins;
  updateEnergy(true);
  spawnCoin();
  saveGame();
});

// ------------------------------
// 🔹 Відновлення енергії
// ------------------------------
setInterval(() => {
  if (energy < maxEnergy) {
    energy += regenRate;
    if (energy > maxEnergy) energy = maxEnergy;
    updateEnergy(true);
    spawnFlash();
    saveGame();
  }
}, regenInterval);

// ------------------------------
// 🔸 Перемикання вкладок
// ------------------------------
const buttons = document.querySelectorAll('.bottom-nav button');
const screens = document.querySelectorAll('.screen');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(btn.dataset.screen).classList.add('active');
  });
});

// ------------------------------
// 🔹 Ініціалізація
// ------------------------------
loadGame();
updateEnergy();
updateXP(0);
coinsDisplay.textContent = coins;
if (profileCoins) profileCoins.textContent = coins;
