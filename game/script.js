for (let i = 0; i < 25; i++) {
  const p = document.createElement('div');
  p.classList.add('particle');
  p.style.left = Math.random() * 100 + 'vw';
  p.style.animationDelay = Math.random() * 5 + 's';
  document.body.appendChild(p);
}


let score = 0;
const playBtn = document.getElementById('playBtn');
const game = document.getElementById('game');
const menu = document.getElementById('menu');
const block = document.getElementById('block');
const scoreDisplay = document.getElementById('score');

// 🎮 Почати гру
playBtn.addEventListener('click', () => {
  menu.style.display = 'none';
  game.style.display = 'block';
});

// ⛏️ Клік по блоку
block.addEventListener('click', () => {
  score++;
  scoreDisplay.textContent = score;

  // ефект натискання
  block.style.transform = 'scale(0.9)';
  setTimeout(() => block.style.transform = 'translate(-50%, -50%) scale(1)', 100);

  // рухаємо блок у випадкове місце
  moveBlock();

  // рівні
  if (score % 10 === 0) {
    alert(`🎉 Новий рівень! Твої очки: ${score}`);
  }
});

// 📦 Функція для руху блоку
function moveBlock() {
  const maxX = window.innerWidth - 120;
  const maxY = window.innerHeight - 120;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  block.style.left = `${x}px`;
  block.style.top = `${y}px`;
}
