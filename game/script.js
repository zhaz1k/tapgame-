let coins = 0;

// Tap функціонал
const tapButton = document.getElementById('tapButton');
const coinsDisplay = document.getElementById('coins');
const profileCoins = document.getElementById('profileCoins');

tapButton.addEventListener('click', () => {
  coins++;
  coinsDisplay.textContent = coins;
  profileCoins.textContent = coins;
});

// Перемикання вкладок
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
