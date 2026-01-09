// ACCESCO Card Match Game Logic - 10 Level System
// =====================
// Constants
// =====================
const POINTS_PER_MATCH = 100;
const INITIAL_TIME = 120;
const MAX_LEVEL = 10;

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
let currentLevel = 1;

let gameStarted = false;
let gameEnded = false;
let isProcessing = false;
let timerInterval = null;

let gameStats = {
  score: 0,
  matches: 0,
  timeRemaining: INITIAL_TIME,
};

// =====================
// DOM Elements
// =====================
const startScreen = document.getElementById('start-screen');
const gameBoard = document.getElementById('game-board');
const cardsGrid = document.getElementById('cards-grid');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const gameOverModal = document.getElementById('game-over-modal');
const timerEl = document.getElementById('timer');
const comboIndicator = document.getElementById('combo-indicator');
const leaderboardContent = document.getElementById('leaderboard-content');

// =====================
// Dynamic Difficulty & Grid Scaling
// =====================
function getLevelSettings(level) {
  const totalCards = level * 4; // L1=4, L2=8, L3=12, L4=16...
  const pairs = totalCards / 2;
  
  return {
    pairs: pairs,
    cols: level === 1 ? 2 : 4, // 2 columns for 4 cards, 4 columns for everything else
    timeLimit: Math.max(30, 130 - (level * 10)), // Starts 120s, drops 10s per level
    bonus: Math.max(1, 6 - Math.floor(level / 2)), // Matches give less time as levels go up
    penalty: Math.min(12, 4 + level) // Mistakes cost more time as levels go up
  };
}

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

function createGameBoard(numPairs) {
  const selected = shuffleArray([...CARD_ICONS]).slice(0, numPairs);
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
  leaderboard.push({ score, date: new Date().toLocaleDateString(), level: currentLevel });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5);
  localStorage.setItem('accescoLeaderboard', JSON.stringify(leaderboard));
  renderLeaderboard();
}

function renderLeaderboard() {
  if (!leaderboardContent) return;
  leaderboardContent.innerHTML = leaderboard.map((entry, i) => `
    <div class="leaderboard-item">
      <span class="leaderboard-rank">#${i + 1}</span>
      <span>Lvl ${entry.level}</span>
      <span class="leaderboard-points">${entry.score} pts</span>
    </div>
  `).join('');
}

// =====================
// UI & Effects
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

function updateUI() {
  const settings = getLevelSettings(currentLevel);
  document.getElementById('score').textContent = gameStats.score;
  document.getElementById('time').textContent = formatTime(gameStats.timeRemaining);
  document.getElementById('matches').textContent = `${gameStats.matches}/${settings.pairs}`;
  
  document.querySelector('.game-title').textContent = `ACCESCO Level ${currentLevel}`;

  timerEl.classList.toggle('timer-warning', gameStats.timeRemaining < 15 && gameStarted);
}

function renderCards() {
  cardsGrid.innerHTML = ''; 
  cards.forEach(card => {
    const el = document.createElement('div');
    el.className = `card ${ (flippedCards.includes(card.id) || card.matched) ? 'flipped' : ''} ${card.matched ? 'matched' : ''} ${wrongCards.includes(card.id) ? 'wrong' : ''}`;
    el.onclick = () => handleCardClick(card.id);
    el.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back"><div class="card-back-pattern"></div></div>
        <div class="card-face card-front"><span class="card-icon">${card.icon}</span></div>
      </div>`;
    cardsGrid.appendChild(el);
  });
}

// =====================
// Gameplay Logic
// =====================
function initializeGame(isNewLevel = false) {
  const settings = getLevelSettings(currentLevel);

  if (!isNewLevel) {
    currentLevel = 1;
    gameStats.score = 0;
  }

  gameStats.timeRemaining = settings.timeLimit;
  cardsGrid.style.gridTemplateColumns = `repeat(${settings.cols}, 1fr)`;
  
  cards = createGameBoard(settings.pairs);
  flippedCards = [];
  wrongCards = [];
  comboStreak = 0;
  gameStats.matches = 0;
  
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
      if (!timerInterval) startTimer();
    }
  }, 1000);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    gameStats.timeRemaining--;
    updateUI();
    if (gameStats.timeRemaining <= 0) handleGameEnd(false);
  }, 1000);
}

function handleGameEnd(victory = false) {
  gameStarted = false;
  
  if (victory && currentLevel < MAX_LEVEL) {
    currentLevel++;
    initializeGame(true);
  } else {
    clearInterval(timerInterval);
    timerInterval = null;
    gameEnded = true;
    saveScore(gameStats.score);
    
    document.querySelector('.game-over-title').textContent = (victory && currentLevel === MAX_LEVEL) ? "Ultimate Champion!" : "Game Over";
    document.getElementById('game-over-score').textContent = `Final Score: ${gameStats.score} (Lvl ${currentLevel})`;
    gameOverModal.style.display = 'flex';
  }
}

function handleCardClick(id) {
  if (!gameStarted || gameEnded || isProcessing || flippedCards.includes(id)) return;

  const settings = getLevelSettings(currentLevel);
  flippedCards.push(id);
  renderCards();

  if (flippedCards.length === 2) {
    isProcessing = true;
    const [a, b] = flippedCards;
    const ca = cards.find(c => c.id === a);
    const cb = cards.find(c => c.id === b);

    setTimeout(() => {
      if (ca.icon === cb.icon) {
        cards = cards.map(c => c.id === a || c.id === b ? { ...c, matched: true } : c);
        comboStreak++;
        if (comboStreak > 1) showCombo();
        
        showTimePopup(settings.bonus, true); 
        gameStats.matches++;
        gameStats.score += (POINTS_PER_MATCH * currentLevel) + (comboStreak * 20);
        gameStats.timeRemaining += settings.bonus; 
      } else {
        comboStreak = 0;
        wrongCards = [a, b];
        showTimePopup(settings.penalty, false); 
        gameStats.timeRemaining = Math.max(0, gameStats.timeRemaining - settings.penalty); 
      }

      flippedCards = [];
      renderCards();
      wrongCards = [];
      isProcessing = false;
      updateUI();

      if (cards.every(c => c.matched)) {
        handleGameEnd(true);
      }
    }, 700);
  }
}

function restartGame() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  initializeGame(false);
}

function exitGame() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  startScreen.style.display = 'flex';
  gameBoard.style.display = 'none';
  gameOverModal.style.display = 'none';
  countdownOverlay.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard();
});