// Configurations
const CUBE_SIZE = 100;
const OFFSET = 50;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
let timerInterval;
let startTime;
let moves = 0;
let score = 0;
let bestScore = 0;
let difficulty = 'beginner';
let cube;
let ctx = document.getElementById('cubeCanvas').getContext('2d');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBestScore();
    resetGame();
});

// Save Best Score
function saveBestScore() {
    localStorage.setItem('bestScore', bestScore);
}

function loadBestScore() {
    const savedBest = localStorage.getItem('bestScore');
    if (savedBest) bestScore = parseInt(savedBest);
    document.getElementById('bestScore').textContent = bestScore;
}

// Timer Management
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = ((elapsed % 60000) / 1000).toFixed(0);
        document.getElementById('timer').textContent = 
            `Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// Score Management
function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
    if (score > bestScore) {
        bestScore = score;
        saveBestScore();
    }
}

// Game Over Handling
function showGameOver() {
    document.getElementById('gameOverModal').style.display = 'flex';
    document.getElementById('finalScore').textContent = score;
}

// Cube Logic
class Cube {
    constructor() {
        this.faces = {
            front: [['white', 'white', 'white'], ['white', 'white', 'white'], ['white', 'white', 'white']],
            back: [['yellow', 'yellow', 'yellow'], ['yellow', 'yellow', 'yellow'], ['yellow', 'yellow', 'yellow']],
            left: [['blue', 'blue', 'blue'], ['blue', 'blue', 'blue'], ['blue', 'blue', 'blue']],
            right: [['green', 'green', 'green'], ['green', 'green', 'green'], ['green', 'green', 'green']],
            top: [['red', 'red', 'red'], ['red', 'red', 'red'], ['red', 'red', 'red']],
            bottom: [['orange', 'orange', 'orange'], ['orange', 'orange', 'orange'], ['orange', 'orange', 'orange']]
        };
        this.shuffle();
    }

    shuffle() {
        const moves = [
            'F', 'F\'', 'F2',
            'B', 'B\'', 'B2',
            'L', 'L\'', 'L2',
            'R', 'R\'', 'R2',
            'U', 'U\'', 'U2',
            'D', 'D\'', 'D2'
        ];
        const numberOfShuffles = 20;

        for (let i = 0; i < numberOfShuffles; i++) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            this.performMove(randomMove);
        }
    }

    performMove(move) {
        switch (move) {
            case 'F': this.rotateFrontClockwise(); break;
            case 'F\'': this.rotateFrontCounterClockwise(); break;
            case 'F2': this.rotateFrontClockwise(); this.rotateFrontClockwise(); break;
            case 'B': this.rotateBackClockwise(); break;
            case 'B\'': this.rotateBackCounterClockwise(); break;
            case 'B2': this.rotateBackClockwise(); this.rotateBackClockwise(); break;
            case 'L': this.rotateLeftClockwise(); break;
            case 'L\'': this.rotateLeftCounterClockwise(); break;
            case 'L2': this.rotateLeftClockwise(); this.rotateLeftClockwise(); break;
            case 'R': this.rotateRightClockwise(); break;
            case 'R\'': this.rotateRightCounterClockwise(); break;
            case 'R2': this.rotateRightClockwise(); this.rotateRightClockwise(); break;
            case 'U': this.rotateTopClockwise(); break;
            case 'U\'': this.rotateTopCounterClockwise(); break;
            case 'U2': this.rotateTopClockwise(); this.rotateTopClockwise(); break;
            case 'D': this.rotateBottomClockwise(); break;
            case 'D\'': this.rotateBottomCounterClockwise(); break;
            case 'D2': this.rotateBottomClockwise(); this.rotateBottomClockwise(); break;
        }
    }

    isSolved() {
        const colors = {
            front: 'white',
            back: 'yellow',
            left: 'blue',
            right: 'green',
            top: 'red',
            bottom: 'orange'
        };

        return Object.entries(this.faces).every(([faceName, face]) => {
            const targetColor = colors[faceName];
            return face.every(row => row.every(color => color === targetColor));
        });
    }

    draw(ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const drawFace = (face, xOffset, yOffset) => {
            face.forEach((row, rowIndex) => {
                row.forEach((color, colIndex) => {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        (colIndex * CUBE_SIZE) + OFFSET + xOffset,
                        (rowIndex * CUBE_SIZE) + OFFSET + yOffset,
                        CUBE_SIZE,
                        CUBE_SIZE
                    );
                });
            });
        };

        // Front Face
        drawFace(this.faces.front, 0, 0);
        // Left Face
        drawFace(this.faces.left, -CUBE_SIZE, 0);
        // Right Face
        drawFace(this.faces.right, CUBE_SIZE, 0);
        // Top Face
        drawFace(this.faces.top, 0, -CUBE_SIZE);
        // Bottom Face
        drawFace(this.faces.bottom, 0, CUBE_SIZE);
    }

    // Rotation Methods
    rotateFrontClockwise() {
        const newFront = [
            [this.faces.front[2][0], this.faces.front[1][0], this.faces.front[0][0]],
            [this.faces.front[2][1], this.faces.front[1][1], this.faces.front[0][1]],
            [this.faces.front[2][2], this.faces.front[1][2], this.faces.front[0][2]]
        ];
        this.faces.front = newFront;

        const topRow = this.faces.top[2].slice();
        this.faces.top[2] = this.faces.left.map(row => row[2]).reverse();
        this.faces.left = this.faces.left.map((row, i) => {
            row[2] = this.faces.bottom[0][i];
            return row;
        });
        this.faces.bottom[0] = this.faces.right.map(row => row[0]);
        this.faces.right = this.faces.right.map((row, i) => {
            row[0] = topRow[i];
            return row;
        });
        this.draw(ctx);
    }

    rotateFrontCounterClockwise() {
        this.rotateFrontClockwise();
        this.rotateFrontClockwise();
        this.rotateFrontClockwise();
    }

    rotateTopClockwise() {
        const newTop = [
            [this.faces.top[2][0], this.faces.top[1][0], this.faces.top[0][0]],
            [this.faces.top[2][1], this.faces.top[1][1], this.faces.top[0][1]],
            [this.faces.top[2][2], this.faces.top[1][2], this.faces.top[0][2]]
        ];
        this.faces.top = newTop;

        const leftTop = this.faces.left[0].slice();
        this.faces.left[0] = this.faces.back[0].slice().reverse();
        this.faces.back[0] = this.faces.right[0].slice().reverse();
        this.faces.right[0] = this.faces.front[0].slice().reverse();
        this.faces.front[0] = leftTop.slice().reverse();
        this.draw(ctx);
    }

    // Add other rotation methods (L, R, B, D) similarly
}

// Reset Game
function resetGame() {
    score = 0;
    document.getElementById('score').textContent = 0;
    document.getElementById('gameOverModal').style.display = 'none';

    cube = new Cube();
    cube.shuffle();
    cube.draw(ctx);

    moves = 0;
    document.getElementById('moveCounter').textContent = 'Moves: 0';
    clearInterval(timerInterval);
    startTimer();
}

// Canvas Events
document.getElementById('cubeCanvas').addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Example: Front face clicked
    if (x > 100 && x < 200 && y > 100 && y < 200) {
        cube.rotateFrontClockwise();
        incrementMoves();
    }

    if (cube.isSolved()) {
        showGameOver();
        clearInterval(timerInterval);
        updateScore(100); // Add points for solving the cube
    }
});

function incrementMoves() {
    moves++;
    document.getElementById('moveCounter').textContent = `Moves: ${moves}`;
}
