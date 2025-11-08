let coins = 0;
let energy = 500;          // Початкова енергія
const maxEnergy = 500;     // Максимальна енергія
const regenRate = 1;       // Скільки енергії відновлюється
const regenInterval = 2000; // 1 енергія кожні 2 секунди

// 🔹 Елементи
const tapButton = document.getElementById('tapButton');
const coinsDisplay = document.getElementById('coins');
const profileCoins = document.getElementById('profileCoins');
const energyBar = document.getElementById('energy-bar');
const energyText = document.getElementById('energy-text');
const timerDisplay = document.getElementById('timer');

// 🔹 Функція оновлення енергії
function updateEnergy() {
  const percent = (energy / maxEnergy) * 100;
  energyBar.style.width = `${percent}%`;
  energyText.textContent = `${energy}/${maxEnergy}`;
}

// 🔹 Відновлення енергії з таймером
setInterval(() => {
  if (energy < maxEnergy) {
    energy += regenRate;
    updateEnergy();
  }
}, regenInterval);

// 🔹 Форматований таймер
function startTimer() {
  let seconds = regenInterval / 1000;
  setInterval(() => {
    seconds--;
    if (seconds <= 0) seconds = regenInterval / 1000;
    timerDisplay.textContent = `⚡ +${regenRate} через ${seconds}s`;
  }, 1000);
}
startTimer();

// 🔹 Функція появи монетки при кліку
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

// 🔸 Натискання TAP
tapButton.addEventListener('click', () => {
  if (energy <= 0) return; // якщо енергія закінчилась — не рахує кліки
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
