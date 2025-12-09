let selectedTile = null;
let solution = [];
let boardState = [];

// Globale Variablen
let currentDifficulty = "medium";
let currentMode = "instant";
let checksRemaining = 3;

// Übersetzungen
const diffNames = {
    "easy": "Leicht",
    "medium": "Mittel",
    "hard": "Schwer"
};

const baseBoard = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

function startGame() {
    const diffSelect = document.getElementById("difficulty-select");
    const modeSelect = document.getElementById("mode-select");
    currentDifficulty = diffSelect.value;
    currentMode = modeSelect.value;

    const checkBtn = document.getElementById("check-btn");
    const modeDisplay = document.getElementById("mode-display");

    let modeText = (currentMode === "classic") ? "Klassisch" : "Sofort-Hilfe";
    modeDisplay.innerText = diffNames[currentDifficulty] + " | " + modeText;

    if (currentMode === "classic") {
        checkBtn.style.display = "block";
    } else {
        checkBtn.style.display = "none";
    }

    newGame();

    const screen = document.getElementById('start-screen');
    screen.style.opacity = '0';
    setTimeout(() => { screen.style.display = 'none'; }, 500);
}

function backToMenu() {
    const screen = document.getElementById('start-screen');
    screen.style.display = 'flex';
    setTimeout(() => { screen.style.opacity = '1'; }, 10);
}

function newGame() {
    checksRemaining = 3;
    const checkBtn = document.getElementById("check-btn");
    checkBtn.innerText = "Prüfen (" + checksRemaining + ")";
    checkBtn.disabled = false;

    let board = JSON.parse(JSON.stringify(baseBoard));
    
    // Mischen
    if(Math.random() > 0.5) swapRows(board, 0, 2);
    if(Math.random() > 0.5) swapRows(board, 3, 5);
    if(Math.random() > 0.5) swapRows(board, 6, 8);
    if(Math.random() > 0.5) swapCols(board, 0, 2);
    if(Math.random() > 0.5) swapCols(board, 3, 5);
    if(Math.random() > 0.5) {
        board = board[0].map((val, index) => board.map(row => row[index]).reverse())
    }

    solution = JSON.parse(JSON.stringify(board));
    let puzzle = JSON.parse(JSON.stringify(board));
    
    let holes = 45;
    if (currentDifficulty === "easy") holes = 30;
    else if (currentDifficulty === "hard") holes = 56;
    
    let attempts = holes;
    while (attempts > 0) {
        let r = Math.floor(Math.random() * 9);
        let c = Math.floor(Math.random() * 9);
        if (puzzle[r][c] !== 0) {
            puzzle[r][c] = 0;
            attempts--;
        }
    }

    renderBoard(puzzle);
}

function swapRows(board, r1, r2) { let temp = board[r1]; board[r1] = board[r2]; board[r2] = temp; }
function swapCols(board, c1, c2) { for(let i=0; i<9; i++) { let temp = board[i][c1]; board[i][c1] = board[i][c2]; board[i][c2] = temp; } }

function renderBoard(puzzle) {
    const boardDiv = document.getElementById("game-board");
    boardDiv.innerHTML = "";
    boardState = puzzle; 

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let tile = document.createElement("div");
            tile.id = r + "-" + c;
            tile.classList.add("tile");
            if (puzzle[r][c] !== 0) {
                tile.innerText = puzzle[r][c];
                tile.classList.add("start-tile");
            } else {
                tile.addEventListener("click", selectTile);
            }
            boardDiv.appendChild(tile);
        }
    }
}

function selectTile() {
    if (selectedTile) selectedTile.classList.remove("selected");
    selectedTile = this;
    selectedTile.classList.add("selected");
}

function selectNumber(num) {
    if (selectedTile) {
        let coords = selectedTile.id.split("-");
        let r = parseInt(coords[0]);
        let c = parseInt(coords[1]);

        selectedTile.innerText = num;
        boardState[r][c] = num;
        selectedTile.classList.add("user-tile");
        selectedTile.classList.remove("error");

        if (currentMode === "instant") {
            if (num === solution[r][c]) {
                selectedTile.classList.remove("error");
            } else {
                selectedTile.classList.add("error");
                if (navigator.vibrate) navigator.vibrate(200);
            }
        }

        checkIfBoardFull();
    }
}

function deleteNumber() {
    if (selectedTile && !selectedTile.classList.contains("start-tile")) {
        selectedTile.innerText = "";
        selectedTile.classList.remove("user-tile");
        selectedTile.classList.remove("error");
        let coords = selectedTile.id.split("-");
        boardState[parseInt(coords[0])][parseInt(coords[1])] = 0;
    }
}

// --- BUTTON: PRÜFEN ---
function checkPuzzle() {
    if (checksRemaining > 0) {
        
        let errorFound = false;
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                let tile = document.getElementById(r + "-" + c);
                if (boardState[r][c] !== 0 && !tile.classList.contains("start-tile")) {
                    if (boardState[r][c] !== solution[r][c]) {
                        tile.classList.add("error");
                        errorFound = true;
                    }
                }
            }
        }

        if (errorFound) {
            checksRemaining--;
            const checkBtn = document.getElementById("check-btn");
            checkBtn.innerText = "Prüfen (" + checksRemaining + ")";
            
            if (navigator.vibrate) navigator.vibrate(200);

            if (checksRemaining === 0) {
                checkBtn.disabled = true;
                setTimeout(() => {
                    document.getElementById("gameover-modal").style.display = "flex";
                }, 500);
            }
        } else {
            // Kein Fehler -> Nettes Feedback
            // Erstmal gucken ob es voll ist, dann triggert eh die Win-Logik
            checkIfBoardFull(); 
            
            // Wenn nicht voll, aber richtig:
            let isFull = true;
            for(let r=0; r<9; r++) {
                for(let c=0; c<9; c++) {
                    if(boardState[r][c] === 0) isFull = false;
                }
            }
            if(!isFull) {
                showInfoModal("Alles super!", "Bisher hast du keine Fehler gemacht.");
            }
        }
    }
}

// --- AUTOMATISCHER CHECK WENN VOLL ---
function checkIfBoardFull() {
    let isFull = true;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (boardState[r][c] === 0) {
                isFull = false;
                break;
            }
        }
    }

    if (isFull) {
        let isCorrect = true;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (boardState[r][c] !== solution[r][c]) isCorrect = false;
            }
        }

        if (isCorrect) {
            document.getElementById("winner-modal").style.display = "flex";
        } else {
            if (currentMode === "instant") {
                showInfoModal("Fast geschafft...", "Das Spielfeld ist voll, aber irgendwo sind noch rote Fehler.");
            } else {
                showInfoModal("Spielfeld voll", "Bist du fertig? Wenn ja, drücke den grünen 'Prüfen' Knopf!");
            }
        }
    }
}

function showInfoModal(title, text) {
    document.getElementById("info-title").innerText = title;
    document.getElementById("info-text").innerText = text;
    document.getElementById("info-modal").style.display = "flex";
}

function closeInfoModal() {
    document.getElementById("info-modal").style.display = "none";
}

function restartGame() {
    document.getElementById("gameover-modal").style.display = "none";
    newGame();
}

function gameOverToMenu() {
    document.getElementById("gameover-modal").style.display = "none";
    backToMenu();
}

function closeWinnerModal() {
    document.getElementById("winner-modal").style.display = "none";
    newGame();
}