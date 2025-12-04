const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');

// Responsive canvas size
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let gameRunning = true;
let score = 0;
let gameSpeed = 3;
let frameCount = 0;

// Player car
const player = {
    x: 0,
    y: 0,
    width: 50,
    height: 80,
    speed: 7,
    color: '#ff6b6b'
};

function resetPlayerPosition() {
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 120;
    player.width = Math.max(40, canvas.width * 0.06);
    player.height = Math.max(60, player.width * 1.6);
}

resetPlayerPosition();

// Update player position on resize
window.addEventListener('resize', () => {
    resetPlayerPosition();
});

// Enemy cars
let enemies = [];
const enemyColors = ['#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];

// Keyboard controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls
let touchStartX = 0;
let touchCurrentX = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    touchCurrentX = e.touches[0].clientX;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchStartX = 0;
    touchCurrentX = 0;
});

function drawCar(x, y, width, height, color) {
    // Car body
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // Car top (window)
    ctx.fillStyle = 'rgba(45, 52, 54, 0.7)';
    ctx.fillRect(x + width * 0.2, y + height * 0.2, width * 0.6, height * 0.3);
    
    // Wheels
    ctx.fillStyle = '#000';
    const wheelWidth = width * 0.2;
    const wheelHeight = height * 0.25;
    ctx.fillRect(x - wheelWidth * 0.3, y + height * 0.15, wheelWidth, wheelHeight);
    ctx.fillRect(x + width - wheelWidth * 0.7, y + height * 0.15, wheelWidth, wheelHeight);
    ctx.fillRect(x - wheelWidth * 0.3, y + height * 0.65, wheelWidth, wheelHeight);
    ctx.fillRect(x + width - wheelWidth * 0.7, y + height * 0.65, wheelWidth, wheelHeight);
    
    // Headlights/taillights
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + width * 0.2, y + height * 0.9, width * 0.25, height * 0.08);
    ctx.fillRect(x + width * 0.55, y + height * 0.9, width * 0.25, height * 0.08);
}

function drawRoad() {
    // Road
    ctx.fillStyle = '#636e72';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grass on sides
    const grassWidth = canvas.width * 0.125;
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, 0, grassWidth, canvas.height);
    ctx.fillRect(canvas.width - grassWidth, 0, grassWidth, canvas.height);
    
    // Road lines
    ctx.fillStyle = '#fff';
    ctx.fillRect(grassWidth - 5, 0, 10, canvas.height);
    ctx.fillRect(canvas.width - grassWidth - 5, 0, 10, canvas.height);
}

function createEnemy() {
    const roadStart = canvas.width * 0.125;
    const roadEnd = canvas.width * 0.875;
    const roadWidth = roadEnd - roadStart;
    const numLanes = 4;
    const laneWidth = roadWidth / numLanes;
    
    const enemyWidth = Math.max(40, canvas.width * 0.06);
    const enemyHeight = Math.max(60, enemyWidth * 1.6);
    
    const lane = Math.floor(Math.random() * numLanes);
    const x = roadStart + (lane * laneWidth) + (laneWidth / 2) - (enemyWidth / 2);
    
    enemies.push({
        x: x,
        y: -enemyHeight - 20,
        width: enemyWidth,
        height: enemyHeight,
        color: enemyColors[Math.floor(Math.random() * enemyColors.length)]
    });
}

function updateGame() {
    if (!gameRunning) return;

    frameCount++;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw road
    drawRoad();
    
    // Move player with keyboard
    const roadStart = canvas.width * 0.125;
    const roadEnd = canvas.width - (canvas.width * 0.125);
    
    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && player.x > roadStart + 10) {
        player.x -= player.speed;
    }
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && player.x < roadEnd - player.width - 10) {
        player.x += player.speed;
    }
    
    // Move player with touch
    if (touchStartX > 0) {
        const deltaX = touchCurrentX - touchStartX;
        const newX = player.x + deltaX * 0.5;
        
        if (newX > roadStart + 10 && newX < roadEnd - player.width - 10) {
            player.x = newX;
        }
        touchStartX = touchCurrentX;
    }
    
    // Draw player
    drawCar(player.x, player.y, player.width, player.height, player.color);
    
    // Create enemies
    if (frameCount % 90 === 0) {
        createEnemy();
    }
    
    // Update and draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += gameSpeed;
        
        drawCar(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color);
        
        // Check collision
        if (checkCollision(player, enemy)) {
            gameOver();
            return;
        }
        
        // Remove off-screen enemies and add score
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            score += 10;
            scoreDisplay.textContent = 'Score: ' + score;
            
            // Increase difficulty
            if (score % 100 === 0) {
                gameSpeed += 0.5;
            }
        }
    }
    
    requestAnimationFrame(updateGame);
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function gameOver() {
    gameRunning = false;
    finalScoreDisplay.textContent = 'Final Score: ' + score;
    gameOverScreen.classList.add('show');
    
    // Play the video WITH SOUND
    const video = document.getElementById('gameOverVideo');
    video.currentTime = 0;
    video.muted = false;
    video.volume = 0.7;
    video.play().catch(err => {
        console.log('Video autoplay prevented - user interaction may be needed');
        video.muted = true;
        video.play().then(() => {
            video.muted = false;
        }).catch(e => console.log('Video play failed:', e));
    });
}

function restartGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = 3;
    frameCount = 0;
    enemies = [];
    resetPlayerPosition();
    scoreDisplay.textContent = 'Score: 0';
    gameOverScreen.classList.remove('show');
    
    const video = document.getElementById('gameOverVideo');
    video.pause();
    video.currentTime = 0;
    
    updateGame();
}

// Start game
updateGame();
