const boardContainer = document.getElementById('board');
const promotionDialog = document.getElementById('promotion-dialog');
const gameSetup = document.getElementById('game-setup');
const pieceSymbols = {
    1: '♙', 2: '♘', 3: '♗', 4: '♖', 5: '♕', 6: '♔',
    '-1': '♟', '-2': '♞', '-3': '♝', '-4': '♜', '-5': '♛', '-6': '♚',
};
const sideButtons = ['white', 'random', 'black'];

let currentMoves = [];
let data = null;
let pendingFromSq = null;
let pendingToSq = null;
let playerSide = null;
let botThinking = false;

function fileOf(index) { return index % 8; }
function rankOf(index) { return Math.floor(index / 8); }

function setBoard() {
    for (let i = 0; i < 64; i++) {
        const square = document.querySelector(`[data-square="${i}"]`);
        if (data.board[i] == 0) {
            square.textContent = ' ';
        } else {
            square.textContent = pieceSymbols[data.board[i]];
        }
    }
}

function clearHighlights() {
    for (let i = 0; i < 64; i++) {
        const square = document.querySelector(`[data-square="${i}"]`);
        square.classList.remove('highlighted');
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
}

function updateStatusMessage() {
    const title = document.getElementById('status-title');
    const subtitle = document.getElementById('status-subtitle');
    const winner = data.side === 1 ? 'Black' : 'White';
    const currentSide = data.side === 1 ? 'White' : 'Black';
    if (data.status === 'checkmate') {
        title.textContent = 'Checkmate';
        subtitle.textContent = `${winner} wins!`;
    }
    if (data.status === 'stalemate') {
        title.textContent = 'Stalemate';
        subtitle.textContent = 'No legal moves left';
    }
    if (data.status === 'draw_repetition') {
        title.textContent = 'Draw';
        subtitle.textContent = 'By threefold repetition';
    }
    if (data.status === 'draw_insufficient') {
        title.textContent = 'Draw';
        subtitle.textContent = 'By insufficient material';
    }
    if (data.status === 'draw_fifty_move') {
        title.textContent = 'Draw';
        subtitle.textContent = 'By fifty-move rule';
    }
    if (data.status === 'ongoing') {
        title.textContent = 'Ongoing';
        subtitle.textContent = `${currentSide} to play`;
    }
    else {
        setupGame();
    }
}

function updateCaptures() {
    const whitePieces = data.captures.filter(piece => piece > 0);
    const blackPieces = data.captures.filter(piece => piece < 0);

    whitePieces.sort((a, b) => a - b);
    blackPieces.sort((a, b) => b - a);

    const capturedBlack = document.getElementById("captured-black");
    const capturedWhite = document.getElementById("captured-white");

    capturedBlack.innerHTML = '';
    capturedWhite.innerHTML = '';

    for (const piece of blackPieces) {
        const span = document.createElement('span');
        span.textContent = pieceSymbols[piece];
        capturedBlack.appendChild(span);
    }
    for (const piece of whitePieces) {
        const span = document.createElement('span');
        span.textContent = pieceSymbols[piece];
        capturedWhite.appendChild(span);
    }
}

function selectOption(selectedId, groupIds) {
    for (const id of groupIds) {
        document.getElementById(id).classList.remove('selected');
    }
    document.getElementById(selectedId).classList.add('selected');
    document.getElementById('confirm').disabled = !playerSide;
}

async function startGame() {
    const response = await fetch('/api/start-game/');
    data = await response.json();
    setBoard();
    updateStatusMessage();
}

async function makeBotMove() {
    const response = await fetch('/api/bot-move/');
    data = await response.json();

    if (!response.ok) {
        console.error(data.error);
        botThinking = false;
        return;
    }

    setBoard();
    updateCaptures();
    botThinking = false;
    updateStatusMessage();

}

async function makeMove(move) {
    const response = await fetch('/api/make-move/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            from_sq: move.from_sq,
            to_sq: move.to_sq,
            flag: move.flag,
        }),
    });
    data = await response.json();
    clearHighlights();
    setBoard();
    updateCaptures();
    updateStatusMessage();

    if (data.status === 'ongoing') {
        botThinking = true;
        await makeBotMove();
    }
}

function onSquareClick(squareIndex) {
    if (botThinking) return;
    if (currentMoves.some(move => move.to_sq === squareIndex)) {
        const matchedMove = currentMoves.find(move => move.to_sq === squareIndex);
        if ([6, 7, 8, 9].includes(matchedMove.flag)) {
            pendingFromSq = matchedMove.from_sq;
            pendingToSq = matchedMove.to_sq;
            promotionDialog.classList.remove('hidden');
        } else {
            makeMove(matchedMove);
        }
        currentMoves = [];
        return;
    }
    clearHighlights();
    currentMoves = data.legal_moves.filter(move => move.from_sq === squareIndex);
    for (const move of currentMoves) {
        const square = document.querySelector(`[data-square="${move.to_sq}"]`);
        square.classList.add('highlighted');
    }
}

function handlePromotion(flag) {
    makeMove({ from_sq: pendingFromSq, to_sq: pendingToSq, flag: flag });
    promotionDialog.classList.add('hidden');
}

async function setupGame() {
    // Reset side selection UI
    playerSide = null;
    for (const id of sideButtons) {
        document.getElementById(id).classList.remove('selected');
    }
    document.getElementById('confirm').disabled = true;

    // Reset board flip
    boardContainer.classList.remove('flipped');

    // Show setup dialog
    gameSetup.style.display = '';
}

// Build board squares
for (let i = 7; i >= 0; i--) {
    for (let j = 0; j < 8; j++) {
        const square = document.createElement('div');
        const id = i * 8 + j;
        square.dataset.square = id;
        square.addEventListener('click', () => onSquareClick(id));
        if ((i + j) % 2 == 0) {
            square.className = 'square dark';
        } else {
            square.className = 'square light';
        }
        boardContainer.appendChild(square);
    }
}

// Promotion buttons
document.getElementById('promo-queen').addEventListener('click', () => handlePromotion(6));
document.getElementById('promo-rook').addEventListener('click', () => handlePromotion(7));
document.getElementById('promo-bishop').addEventListener('click', () => handlePromotion(8));
document.getElementById('promo-knight').addEventListener('click', () => handlePromotion(9));

// Side selection buttons
document.getElementById('white').addEventListener('click', () => {
    playerSide = 'white';
    selectOption('white', sideButtons);
});
document.getElementById('random').addEventListener('click', () => {
    playerSide = 'random';
    selectOption('random', sideButtons);
});
document.getElementById('black').addEventListener('click', () => {
    playerSide = 'black';
    selectOption('black', sideButtons);
});

// Confirm button
document.getElementById('confirm').disabled = true;
document.getElementById('confirm').addEventListener('click', async () => {
    if (playerSide === 'random') {
        playerSide = Math.random() < 0.5 ? 'white' : 'black';
    }

    gameSetup.style.display = 'none';
    await startGame();

    if (playerSide === 'black') {
        boardContainer.classList.add('flipped');
        botThinking = true;
        await makeBotMove();
    }
});

// Show setup on load
setupGame();