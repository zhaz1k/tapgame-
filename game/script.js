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

// 🔹 Оновлення прогрес-бару енергії
function updateEnergy() {
  const percent = (energy / maxEnergy) * 100;
  energyBar.style.width = `${percent}%`;
  energyText.textContent = `${energy}/${maxEnergy} ⚡`;
}

// 🔹 Автоматичне відновлення енергії
setInterval(() => {
  if (energy < maxEnergy) {
    energy += regenRate;
    if (energy > maxEnergy) energy = maxEnergy;
    updateEnergy();
  }
}, regenInterval);

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

// 🔸 Подія натискання TAP
tapButton.addEventListener('click', () => {
  if (energy <= 0) return; // якщо енергії нема — не працює
  coins++;
  energy--;
  coinsDisplay.textContent = coins;
  if (profileCoins) profileCoins.textContent = coins;
  updateEnergy();
  spawnCoin();
});

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
