let coins = 0;
let energy = 500;            // Поточна енергія
const maxEnergy = 500;       // Максимальна енергія
const regenRate = 1;         // Відновлення енергії
const regenInterval = 2000;  // +1 енергія кожні 2 секунди

// 🔹 Елементи
const tapButton = document.getElementById('tapButton');
const coinsDisplay = document.getElementById('coins');
const profileCoins = document.getElementById('profileCoins');
const energyBar = document.getElementById('energy-bar');
const energyText = document.getElementById('energy-text');
const energyLabel = document.getElementById('energy-label'); // 🔸 текст поверх прогрес-бара

// 🔹 Оновлення прогрес-бару енергії
function updateEnergy(animated = false) {
  const percent = (energy / maxEnergy) * 100;
  energyBar.style.width = `${percent}%`;
  const text = `${energy}/${maxEnergy} ⚡`;

  // 🔸 оновлення тексту
  if (energyText) energyText.textContent = text;
  if (energyLabel) {
    energyLabel.textContent = text;
    if (animated) {
      energyLabel.style.transform = "translateY(-50%) scale(1.15)";
      setTimeout(() => (energyLabel.style.transform = "translateY(-50%) scale(1)"), 200);
    }
  }

  // 🔹 Зміна кольору енергії залежно від рівня
  if (percent > 70) {
    energyBar.style.background = "linear-gradient(90deg, #00f6ff, #00ff99)";
    energyBar.classList.remove("low-energy");
  } else if (percent > 30) {
    energyBar.style.background = "linear-gradient(90deg, #f6ff00, #ffaa00)";
    energyBar.classList.remove("low-energy");
  } else {
    energyBar.style.background = "linear-gradient(90deg, #ff5f5f, #ff0000)";
    if (percent < 10) {
      energyBar.classList.add("low-energy"); // 🩸 додаємо пульсацію
    } else {
      energyBar.classList.remove("low-energy");
    }
  }

  // 🔸 Якщо енергії немає — кнопка неактивна
  if (energy <= 0) {
    tapButton.disabled = true;
    tapButton.style.opacity = "0.5";
    tapButton.style.cursor = "not-allowed";
  } else {
    tapButton.disabled = false;
    tapButton.style.opacity = "1";
    tapButton.style.cursor = "pointer";
  }
}

// 🔹 Ефект появи монетки
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

// 🔹 Ефект блискавки при +енергії
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

// 🔸 Подія натискання TAP
tapButton.addEventListener('click', () => {
  if (energy <= 0) return;
  coins++;
  energy--;
  coinsDisplay.textContent = coins;
  if (profileCoins) profileCoins.textContent = coins;
  updateEnergy(true);
  spawnCoin();
});

// 🔹 Автоматичне відновлення енергії
setInterval(() => {
  if (energy < maxEnergy) {
    energy += regenRate;
    if (energy > maxEnergy) energy = maxEnergy;
    updateEnergy(true);
    spawnFlash();
  }
}, regenInterval);

// 🔸 Перемикання вкладок
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

// 🔹 Ініціалізація
updateEnergy();
