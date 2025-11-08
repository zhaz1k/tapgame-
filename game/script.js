let coins = 0;

// 🔹 Tap функціонал
const tapButton = document.getElementById('tapButton');
const coinsDisplay = document.getElementById('coins');
const profileCoins = document.getElementById('profileCoins');

// Функція появи монетки при кліку
function spawnCoin() {
  const coin = document.createElement('div');
  coin.classList.add('coin');
  document.body.appendChild(coin);

  const x = window.innerWidth / 2 + (Math.random() * 60 - 30);
  const y = window.innerHeight / 2;

  coin.style.left = `${x}px`;
  coin.style.top = `${y}px`;

  // Видаляємо монетку після анімації
  setTimeout(() => coin.remove(), 1200);
}

// Подія кліку по кнопці TAP
tapButton.addEventListener('click', () => {
  coins++;
  coinsDisplay.textContent = coins;
  if (profileCoins) profileCoins.textContent = coins;
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
