let score = 0;
const block = document.getElementById('block');
const scoreEl = document.getElementById('score');

block.addEventListener('click', () => {
  score++;
  scoreEl.textContent = score;
  block.style.transform = 'scale(0.9)';
  setTimeout(() => block.style.transform = 'scale(1)', 100);
});
