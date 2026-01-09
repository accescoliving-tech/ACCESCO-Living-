// ACCESCO Card Match Game Logic - Vanilla JavaScript (Enhanced)

// =====================
// Constants
// =====================
const POINTS_PER_MATCH = 100;
const TIME_BONUS_MATCH = 5;
const TIME_PENALTY_WRONG = 5;
const INITIAL_TIME = 120;
const TOTAL_PAIRS = 6;

// =====================
// Card icons
// =====================
const CARD_ICONS = [
  { icon: '🍜', category: 'food' }, { icon: '🍱', category: 'food' },
  { icon: '🍕', category: 'food' }, { icon: '🍔', category: 'food' },
  { icon: '🥗', category: 'food' }, { icon: '☕', category: 'food' },
  { icon: '👗', category: 'fashion' }, { icon: '👠', category: 'fashion' },
  { icon: '🧥', category: 'fashion' }, { icon: '🕶️', category: 'fashion' },
  { icon: '👜', category: 'fashion' }, { icon: '🎩', category: 'fashion' },
  { icon: '🛍️', category: 'shopping' }, { icon: '💳', category: 'shopping' },
  { icon: '🏪', category: 'shopping' }, { icon: '📦', category: 'shopping' },
  { icon: '🎁', category: 'shopping' }, { icon: '💰', category: 'shopping' },
  { icon: '🏠', category: 'services' }, { icon: '🚗', category: 'services' },
  { icon: '💼', category: 'services' }, { icon: '📱', category: 'services' },
  { icon: '💡', category: 'services' }, { icon: '⭐', category: 'services' },
];

// =====================
// Game state
// =====================
let cards = [];
let flippedCards = [];
let wrongCards = [];
let comboStreak = 0;
let leaderboard = [];

let gameStarted = false;
let gameEnded = false;
let isProcessing = false;
let timerInterval = null;

let gameStats = {
  score: 0,
  matches: 0,
  attempts: 0,
  timeRemaining: INITIAL_TIME,
};

// =====================
// DOM
// =====================
const startScreen = document.getElementById('start-screen');
const gameBoard = document.getElementById('game-board');
const cardsGrid = document.getElementById('cards-grid');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const gameOverModal = document.getElementById('game-over-modal');
const timerEl = document.getElementById('timer');
const comboIndicator = document.getElementById('combo-indicator');
const leaderboardList = document.getElementById('leaderboard-list');
const bestScoreEl = document.getElementById('best-score');

// =====================
// Utilities
// =====================
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function createGameBoard() {
  const selected = shuffleArray([...CARD_ICONS]).slice(0, TOTAL_PAIRS);
  return shuffleArray(
    selected.flatMap((icon, i) => [
      { id: i * 2, ...icon, matched: false },
      { id: i * 2 + 1, ...icon, matched: false },
    ])
  );
}

// =====================
// Leaderboard
// =====================
function loadLeaderboard() {
  leaderboard = JSON.parse(localStorage.getItem('accescoLeaderboard')) || [];
  renderLeaderboard();
}

function saveScore(score) {
  leaderboard.push({
    score,
    date: new Date().toLocaleDateString()
  });

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5);

  localStorage.setItem('accescoLeaderboard', JSON.stringify(leaderboard));
  renderLeaderboard();
}

function renderLeaderboard() {
  if (!leaderboardList) return;

  leaderboardList.innerHTML = '';
  leaderboard.forEach((entry, i) => {
    const li = document.createElement('li');
    li.textContent = `#${i + 1} — ${entry.score} pts (${entry.date})`;
    leaderboardList.appendChild(li);
  });

  if (bestScoreEl && leaderboard.length) {
    bestScoreEl.textContent = leaderboard[0].score;
  }
}

// =====================
// Effects
// =====================
function showTimePopup(val, positive) {
  const el = document.createElement('div');
  el.className = `time-popup ${positive ? 'time-plus' : 'time-minus'}`;
  el.textContent = `${positive ? '+' : '−'}${val}s`;

  const r = timerEl.getBoundingClientRect();
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top}px`;

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function showCombo() {
  if (!comboIndicator) return;
  comboIndicator.textContent = `🔥 COMBO x${comboStreak}!`;
  comboIndicator.style.opacity = 1;
  setTimeout(() => comboIndicator.style.opacity = 0, 900);
}

// =====================
// UI
// =====================
function updateUI() {
  document.getElementById('score').textContent = gameStats.score;
  document.getElementById('time').textContent = formatTime(gameStats.timeRemaining);
  document.getElementById('matches').textContent =
    `${gameStats.matches}/${TOTAL_PAIRS}`;

  timerEl.classList.toggle(
    'timer-warning',
    gameStats.timeRemaining < 20 && gameStarted
  );
}

function renderCards() {
  if (!cardsGrid.children.length) {
    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'card';
      el.onclick = () => handleCardClick(card.id);
      el.innerHTML = `
        <div class="card-inner">
          <div class="card-face card-back">
            <div class="card-back-pattern"></div>
          </div>
          <div class="card-face card-front">
            <span class="card-icon">${card.icon}</span>
          </div>
        </div>`;
      cardsGrid.appendChild(el);
    });
  }

  cards.forEach((card, i) => {
    cardsGrid.children[i].className = `
      card
      ${(flippedCards.includes(card.id) || card.matched) ? 'flipped' : ''}
      ${card.matched ? 'matched' : ''}
      ${wrongCards.includes(card.id) ? 'wrong' : ''}
    `;
  });
}

// =====================
// Gameplay
// =====================
function initializeGame() {
  cards = createGameBoard();
  flippedCards = [];
  wrongCards = [];
  comboStreak = 0;

  gameStats = {
    score: 0,
    matches: 0,
    attempts: 0,
    timeRemaining: INITIAL_TIME,
  };

  gameStarted = false;
  gameEnded = false;

  startScreen.style.display = 'none';
  gameBoard.style.display = 'block';
  gameOverModal.style.display = 'none';

  renderCards();
  updateUI();

  let c = 3;
  countdownOverlay.style.display = 'flex';
  countdownNumber.textContent = c;

  const cd = setInterval(() => {
    c--;
    countdownNumber.textContent = c > 0 ? c : 'GO!';
    if (c < 0) {
      clearInterval(cd);
      countdownOverlay.style.display = 'none';
      gameStarted = true;
      startTimer();
    }
  }, 1000);
}

function startTimer() {
  timerInterval = setInterval(() => {
    gameStats.timeRemaining--;
    updateUI();
    if (gameStats.timeRemaining <= 0) handleGameEnd();
  }, 1000);
}

function handleGameEnd() {
  clearInterval(timerInterval);
  gameStarted = false;
  gameEnded = true;

  saveScore(gameStats.score);

  document.getElementById('game-over-score').textContent =
    `Final Score: ${gameStats.score}`;
  gameOverModal.style.display = 'flex';
}

function handleCardClick(id) {
  if (!gameStarted || gameEnded || isProcessing || flippedCards.includes(id)) return;

  flippedCards.push(id);
  renderCards();

  if (flippedCards.length === 2) {
    isProcessing = true;
    const [a, b] = flippedCards;
    const ca = cards.find(c => c.id === a);
    const cb = cards.find(c => c.id === b);

    setTimeout(() => {
      if (ca.icon === cb.icon) {
        cards = cards.map(c =>
          c.id === a || c.id === b ? { ...c, matched: true } : c
        );
        comboStreak++;
        showCombo();
        showTimePopup(TIME_BONUS_MATCH, true);
        gameStats.matches++;
        gameStats.score = gameStats.matches * POINTS_PER_MATCH;
        gameStats.timeRemaining += TIME_BONUS_MATCH;
      } else {
        comboStreak = 0;
        wrongCards = [a, b];
        showTimePopup(TIME_PENALTY_WRONG, false);
        gameStats.timeRemaining = Math.max(
          0,
          gameStats.timeRemaining - TIME_PENALTY_WRONG
        );
      }

      flippedCards = [];
      wrongCards = [];
      isProcessing = false;
      renderCards();
      updateUI();

      if (cards.every(c => c.matched)) handleGameEnd();
    }, 700);
  }
}

// =====================
// Controls
// =====================
function restartGame() {
  clearInterval(timerInterval);
  initializeGame();
}

function exitGame() {
  clearInterval(timerInterval);
  startScreen.style.display = 'flex';
  gameBoard.style.display = 'none';
  gameOverModal.style.display = 'none';
  countdownOverlay.style.display = 'none';
}

// =====================
// Init
// =====================
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  loadLeaderboard();
});
