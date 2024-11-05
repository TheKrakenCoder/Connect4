const NUM_ROWS = 6;
const NUM_COLS = 7;
const SIZE = 100;
const NONE = 0;  // black
const HUMAN = 1;    // red human
const AI = 2;    // yellow AI
let m_turn = HUMAN;
let m_board = [];  // 0,0 is top left of the board
let COLORS = [];
let m_winner = 0;
let m_totalMinimax = 0;

function setup() {
  createCanvas(NUM_COLS*SIZE, NUM_ROWS*SIZE+SIZE);
  COLORS[NONE] = color(0);
  COLORS[HUMAN] = color(255, 0, 0);;
  COLORS[AI] = color(255, 255, 0);

  reset();
}

function reset() {
  for (let i = 0; i < NUM_COLS; i++) {
    m_board[i] = [];
    for (let j = 0; j < NUM_ROWS; j++) {
      m_board[i][j] = NONE;
    }
  }

  if (random() < 0.5)  {
    m_turn = AI;
    // play the piece in a random column
    let col = floor(random(NUM_COLS));
    m_board[col][NUM_ROWS-1] = AI;
  } 

  m_turn = HUMAN;
}

function draw() {
  background(0);

  let col = COLORS[m_turn];
  fill(col);
  stroke(col);
  // draw the piece corresponding to the next turn at the top of the screen
  if (m_winner == 0) {
    let xpos = floor(mouseX / SIZE);
    ellipse(xpos * SIZE + SIZE / 2, SIZE / 2, SIZE * 0.9);
  } else {
    textSize(SIZE*0.8);
    text("Player " + m_winner + " WINS!", SIZE, SIZE*0.8);
  }

  // draw game background (there is an extra row on top for the 'next piece')
  fill(0, 0, 255);
  stroke(0, 0, 255);
  rect(0, SIZE, width, height-SIZE);

  // draw each board position: either empty (black), red, or yellow
  for (let i = 0; i < NUM_COLS; i++) {
    for (let j = 0; j < NUM_ROWS; j++) {
      let col = COLORS[m_board[i][j]]; //color(0);
      // if (m_board[i][j] == 0) col = color(255, 0, 0);
      // else if (m_board[i][j] == 1) col = color(255, 255, 0);
      fill(col);
      stroke(col);

      xloc = i*SIZE + SIZE/2;
      yloc = j*SIZE + SIZE + SIZE/2;
      ellipse(xloc, yloc, SIZE*0.9)
    }
  }
  
}

function mousePressed() {
  if (m_turn != HUMAN) return;

  let xpos = floor(mouseX / SIZE);
  // let ypos = floor(mouseY / SIZE) - 1;

  let foundSpot = false;
  // find the lowest unfilled y location in the xpos column
  for (let y = NUM_ROWS-1; y >= 0; y--) {
    if (m_board[xpos][y] == 0) {
      m_board[xpos][y] = m_turn;
      foundSpot = true;
      break;
    }
  }

  if (!foundSpot) return;

  m_winner = checkForWinner(m_board, HUMAN);
  
  if (m_winner == 0) {
    m_turn = AI;
    aiTurn();
  }
  
}

// return an array of column numbers that have an open spot
function findOpenColumns(board) {
  let openCols = [];
  for (let i = 0; i < NUM_COLS; i++) {
    if (board[i][0] == 0) openCols.push(i);
  }

  return openCols;
}

// return how many times the value appears in the array
function countOccurrences(array, value) {
  let occur = array.filter((v) => (v === value)).length;
  // if (occur != 0) console.log('countOccurrences ' + occur);
  return occur;
}

// Evaluate a window for either player.
// Return the score.
// We only ever evaluate based on the AI
function evaluate_window(window, piece) {
	let score = 0;
 	let opp_piece = HUMAN;
	if (piece == HUMAN) opp_piece = AI;

	if (countOccurrences(window, piece) == 4) score += 100;
	else if (countOccurrences(window, piece) == 3 && countOccurrences(window, NONE) == 1)	score += 5;
	else if (countOccurrences(window, piece) == 2 && countOccurrences(window, NONE) == 2)	score += 2;

	// Since we only call this method on the AI's turn, it means the opponent
	// already has 3 in a row, and we definitely need to block it
	if (countOccurrences(window, opp_piece) == 3 && countOccurrences(window, NONE) == 1) score -= 100;

  // if (score != 0) console.log('evaluate_window ' + score);
	return score;
}

// Evaluate a board for either player.
// Return the score.
// We only ever evaluate based on the AI 
function evaluateBoard(board, piece) {
  let score = 0;
  let windows = createWindows(board);

  for (let window of windows) {
    score += evaluate_window(window, piece);
  }

  // console.log('evaluateBoard ' + score);
  return score;
}

function aiTurn() {
  // let openColumns = findOpenColumns(m_board);

  // call minimax here
  m_totalMinimax = 0;
  [col, score] = minimax(m_board, 7, -Infinity, Infinity, true);
  console.log(m_totalMinimax);

  // play the piece in the column
  for (let i = NUM_ROWS - 1; i >= 0; i--) {
    if (m_board[col][i] == 0) {
      m_board[col][i] = AI;
      row = i;
      break;
    }
  }

  m_winner = checkForWinner(m_board, AI);

  if (m_winner == 0) {
    m_turn = HUMAN;
  }
}

// // Pseudo code for minimax algorithm with alpha-beta pruning(from wikipedia)
// function alphabeta(node, depth, α, β, maximizingPlayer) is
//     if depth == 0 or node is terminal then
//         return the heuristic value of node
//     if maximizingPlayer then
//         value := −∞
//         for each child of node do
//             value := max(value, alphabeta(child, depth − 1, α, β, FALSE))
//             if value > β then
//                 break (* β cutoff *)
//             α := max(α, value)
//         return value
//     else
//         value := +∞
//         for each child of node do
//             value := min(value, alphabeta(child, depth − 1, α, β, TRUE))
//             if value < α then
//                 break (* α cutoff *)
//             β := min(β, value)
//         return value

// (* Initial call *)
// alphabeta(origin, depth, −∞, +∞, TRUE)

// Note the AI is the maximizing player
// return an array with the column and it's score.  Column can be null of the board is terminal
function minimax(board, depth, alpha, beta, isMaximizingPlayer) {
  m_totalMinimax++;
  let openColumns = findOpenColumns(board);

  // if depth = 0 or node is a terminal node then
  //     return the heuristic value of node
  if (depth == 0) {
    let score = evaluateBoard(board, AI);
    return [null, score];
  }
  if (checkForWinner(board, AI) == AI) return [null, 1000000];
  if (checkForWinner(board, HUMAN) == HUMAN) return [null, -1000000];
  if (openColumns.length == 0) return [null, 0];  // board is full

  if (isMaximizingPlayer) {
    let bestScore = -Infinity;
    let bestCol = 0;
    for (let col of openColumns) {
      let cpy = board.map((suba) => [...suba]);

      // play the piece in the column
      for (let i = NUM_ROWS-1; i >= 0; i--) {
        if (cpy[col][i] == 0) {
          cpy[col][i] = AI;
          row = i;
          break;
        }
      }

      let [dummy,score] = minimax(cpy, depth-1, alpha, beta, false);
      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }
      alpha = max(alpha, score);
      if (beta <= alpha) break;
    }
    return [bestCol, bestScore]
  } else {
    let bestScore = Infinity;
    let bestCol = 0;
    for (let col of openColumns) {
      let cpy = board.map((suba) => [...suba]);

      // play the piece in the column
      for (let i = NUM_ROWS-1; i >= 0; i--) {
        if (cpy[col][i] == 0) {
          cpy[col][i] = HUMAN;
          row = i;
          break;
        }
      }

      let [dummy,score] = minimax(cpy, depth-1, alpha, beta, true);
      if (score < bestScore) {
        bestScore = score;
        bestCol = col;
      }
      beta = min(beta, score);
      if (beta <= alpha) break;
    }
    return [bestCol, bestScore]
  }

}

// Collect all the windows of 4 consecutive places on the board and put each window into an array.
// Returns an array of arrays-of-4-places
function createWindows(board) {
  let windows = [];
	// Check all horizontal possibilities
	for (let c = 0; c < NUM_COLS-3; c++) {
		for (let r = 0; r < NUM_ROWS; r++) {
      windows.push([board[c+0][r], board[c+1][r], board[c+2][r], board[c+3][r]]);
			// if (board[c+0][r] == piece && board[c+1][r] == piece && board[c+2][r] == piece && board[c+3][r] == piece)	return piece
    }
  }

	// Check all vertical possibilities
	for (let c = 0; c < NUM_COLS; c++) {
		for (let r = 0; r < NUM_ROWS-3; r++) { 
      windows.push([board[c][r+0], board[c][r+1], board[c][r+2], board[c][r+3]]);
			// if (board[c][r+0] == piece && board[c][r+1] == piece && board[c][r+2] == piece && board[c][r+3] == piece)	return piece
    }
  }

	// Check for negatively sloped diagonal (lower left to upper right).  Start in left,lower quadrant
  // and go to the right and up
  for (let c = 0; c < NUM_COLS-3; c++) {
    for (let r = 3; r < NUM_ROWS; r++) { 
      windows.push([board[c+0][r+0], board[c+1][r-1], board[c+2][r-2], board[c+3][r-3]]);
      // if (board[c+0][r+0] == piece && board[c+1][r-1] == piece && board[c+2][r-2] == piece && board[c+3][r-3] == piece)	return piece
    }
  }

	// Check for positively sloped diagonal (upper left to lower right).  Start in the left,upper quadrant
  // and go to the right and down
  for (let c = 0; c < NUM_COLS-3; c++) {
    for (let r = 0; r < NUM_ROWS-3; r++) { 
      windows.push([board[c+0][r+0], board[c+1][r+1], board[c+2][r+2], board[c+3][r+3]]);
      // if (board[c+0][r+0] == piece && board[c+1][r+1] == piece && board[c+2][r+2] == piece && board[c+3][r+3] == piece)	return piece
    }
  }

  // console.table(windows);
  return windows;

}

// return piece if the player has won, 0 otherwise
function checkForWinner(board, piece) {
  let windows = createWindows(board);
  for (let window of windows) {
    if (window[0] == piece && window[1] == piece && window[2] == piece && window[3] == piece) return piece;
  }

  return 0;
}


function aiTurnRandom_UNUSED() {
  let openColumns = findOpenColumns();
  let column = random(openColumns);

  // find the lowest unfilled y location in the chosen column
  for (let y = NUM_ROWS - 1; y >= 0; y--) {
    if (m_board[column][y] == 0) {
      m_board[column][y] = AI;
      break;
    }
  }

  m_winner = checkForWinner(m_board, AI);
  
  if (m_winner == 0) {
    m_turn = HUMAN;
  }
}

function aiTurnPickBestColumn_UNUSED() {
  let openColumns = findOpenColumns(m_board);
  console.table(openColumns);
  // let column = random(openColumns);

  // call minimax here
  // columnAndScore= minimax(m_board, 3, True)

  let bestScore = -Infinity;
  let bestCol = -1;
  // let bestScore = 0;
  // let bestCol = random(openColumns);
  let bestRow = -1;
  for (let col of openColumns) {
    let row = -1;
    // play the piece in the column
    for (let i = NUM_ROWS-1; i >= 0; i--) {
      if (m_board[col][i] == 0) {
        m_board[col][i] = AI;
        row = i;
        break;
      }
    }

    //evaluate the board
    let score = evaluateBoard(m_board, AI);
    console.log(score, bestScore);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
      bestRow = row;
    }

    // undo playing the piece
    // console.log(col, row);
    m_board[col][row] = NONE;
  }

  // now permanently play the piece in the best column
  console.log(bestCol, bestRow);
  m_board[bestCol][bestRow] = AI;
  // for (let i = NUM_ROWS-1; i >= 0; i--) {
  //   if (m_board[bestCol][i] == 0)  m_board[bestCol][i] == AI;
  // }

  m_winner = checkForWinner(m_board, AI);
  
  if (m_winner == 0) {
    m_turn = HUMAN;
  }
}
