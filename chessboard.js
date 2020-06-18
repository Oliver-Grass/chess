const RUN_ASSERTS = true;
const COLUMNS = 'abcdefgh'.split('');
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const START_POSITION = fenToObj(START_FEN);
const CLICKMOVE = false;

const COLOR_SCHEMES = {
  black_and_white: ['#ffffff', '#333333'],
  brown: ['#f0d9b5', '#b58860'],
  blue: ['#eee8d7', '#4c719a'],
  green: ['#f0f0f0', '#507050'],
};

const pieceEntityCodes = {
  bP: '&#9823;',
  bR: '&#9820;',
  bN: '&#9822;',
  bB: '&#9821;',
  bQ: '&#9819;',
  bK: '&#9818;',
  wP: '&#9817;',
  wR: '&#9814;',
  wN: '&#9816;',
  wB: '&#9815;',
  wQ: '&#9813;',
  wK: '&#9812;',
};

/*
=========================
        VALIDATION
=========================
*/
function isString(s) {
  return typeof s === 'string';
}

function isFunction(f) {
  return typeof f === 'function';
}

function isInteger(n) {
  return typeof n === 'number' && isFinite(n) && Math.floor(n) === n;
}

function validMove(move) {
  if (!isString(move)) return false;
  if (move.length != 5) return false;

  // move should be in the form of "e2-e4", "f6-d5"
  const [source, target] = move.split('-');

  return validSquare(source) && validSquare(target);
}

if (RUN_ASSERTS) {
  console.assert(validMove('e2-e4'));
  console.assert(validMove('h8-f6'));
  console.assert(!validMove('E2-F4'));
  console.assert(!validMove('E2-F'));
  console.assert(!validMove('e2'));
}

function validSquare(square) {
  return isString(square) && square.search(/^[a-h][1-8]$/) !== -1;
}

if (RUN_ASSERTS) {
  console.assert(validSquare('a1'));
  console.assert(validSquare('e2'));
  console.assert(!validSquare('D2'));
  console.assert(!validSquare('g9'));
  console.assert(!validSquare('a'));
  console.assert(!validSquare(true));
  console.assert(!validSquare(null));
  console.assert(!validSquare({}));
}

function validPieceCode(code) {
  return isString(code) && code.search(/^[bw][KQRNBP]$/) !== -1;
}

if (RUN_ASSERTS) {
  console.assert(validPieceCode('bP'));
  console.assert(validPieceCode('bK'));
  console.assert(validPieceCode('wK'));
  console.assert(validPieceCode('wR'));
  console.assert(!validPieceCode('WR'));
  console.assert(!validPieceCode('Wr'));
  console.assert(!validPieceCode('a'));
  console.assert(!validPieceCode(true));
  console.assert(!validPieceCode(null));
  console.assert(!validPieceCode({}));
}

function validFEN(fen) {
  if (!isString(fen)) return false;

  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '');

  // expand the empty square numbers to just 1s
  fen = expandFenEmptySquares(fen);

  // FEN should be 8 sections separated by slashes
  const chunks = fen.split('/');
  if (chunks.length !== 8) return false;

  // check each section
  for (let i = 0; i < 8; i++) {
    if (chunks[i].length !== 8 || chunks[i].search(/[^kqrnbpKQRNBP1]/) !== -1) {
      return false;
    }
  }

  return true;
}

if (RUN_ASSERTS) {
  console.assert(validFEN(START_FEN));
  console.assert(validFEN('8/8/8/8/8/8/8/8'));
  console.assert(validFEN('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R'));
  console.assert(validFEN('3r3r/1p4pp/2nb1k2/pP3p2/8/PB2PN2/p4PPP/R4RK1 b - - 0 1'));
  console.assert(!validFEN('3r3z/1p4pp/2nb1k2/pP3p2/8/PB2PN2/p4PPP/R4RK1 b - - 0 1'));
  console.assert(!validFEN('anbqkbnr/8/8/8/8/8/PPPPPPPP/8'));
  console.assert(!validFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/'));
  console.assert(!validFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN'));
  console.assert(!validFEN('888888/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'));
  console.assert(!validFEN('888888/pppppppp/74/8/8/8/PPPPPPPP/RNBQKBNR'));
  console.assert(!validFEN({}));
}

function validPositionObject(pos) {
  for (const i in pos) {
    if (!pos.hasOwnProperty(i)) continue;

    if (!validSquare(i) || !validPieceCode(pos[i])) {
      return false;
    }
  }

  return true;
}

if (RUN_ASSERTS) {
  console.assert(validPositionObject(START_POSITION));
  console.assert(validPositionObject({}));
  console.assert(validPositionObject({ e2: 'wP' }));
  console.assert(validPositionObject({ e2: 'wP', d2: 'wP' }));
  console.assert(!validPositionObject({ e2: 'BP' }));
  console.assert(!validPositionObject({ y2: 'wP' }));
  console.assert(!validPositionObject('start'));
  console.assert(!validPositionObject(START_FEN));
}

/*
=========================
        HELPERS
=========================
*/
function highlightSquare(square) {
  document.getElementById(square).classList.add('highlight');
}

function removeHighlight() {
  const squares = document.getElementsByClassName('highlight');
  while (squares.length) {
    squares[0].classList.remove('highlight');
  }
}

function deepCopy(x) {
  return JSON.parse(JSON.stringify(x));
}

function getPiece(square, position) {
  return position[square] || null;
}

function getPieceColor(piece) {
  if (piece === null) {
    return null;
  }

  if (piece[0] === 'w') {
    return 'w';
  } else if (piece[0] === 'b') {
    return 'b';
  } else {
    return null;
  }
}

// convert P, k to bP, wK, etc
function fenToPieceCode(piece) {
  if (piece.toLowerCase() === piece) {
    return 'b' + piece.toUpperCase();
  }

  return 'w' + piece.toUpperCase();
}

// convert bP, wK, etc code to FEN structure
function pieceCodeToFen(piece) {
  var pieceCodeLetters = piece.split('');

  if (pieceCodeLetters[0] === 'w') {
    return pieceCodeLetters[1].toUpperCase();
  }
  return pieceCodeLetters[1].toLowerCase();
}

// convert FEN string to position object
function fenToObj(fen) {
  if (!validFEN(fen)) return false;

  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '');

  const rows = fen.split('/');
  const position = {};

  let currentRow = 8;
  for (let i = 0; i < 8; i++) {
    const row = rows[i].split('');
    let colIdx = 0;

    // loop through each character in the FEN section
    for (let j = 0; j < row.length; j++) {
      // number / empty squares
      if (row[j].search(/[1-8]/) !== -1) {
        const numEmptySquares = parseInt(row[j], 10);
        colIdx = colIdx + numEmptySquares;
      } else {
        // piece
        const square = COLUMNS[colIdx] + currentRow;
        position[square] = fenToPieceCode(row[j]);
        colIdx = colIdx + 1;
      }
    }

    currentRow = currentRow - 1;
  }

  return position;
}

// position object to FEN string
// returns false if the obj is not a valid position object
function objToFen(obj) {
  if (!validPositionObject(obj)) return false;

  let fen = '';

  let currentRow = 8;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = COLUMNS[j] + currentRow;

      // piece exists
      if (obj.hasOwnProperty(square)) {
        fen = fen + pieceCodeToFen(obj[square]);
      } else {
        // empty space
        fen = fen + '1';
      }
    }

    if (i !== 7) {
      fen = fen + '/';
    }

    currentRow = currentRow - 1;
  }

  // squeeze the empty numbers together
  fen = squeezeFenEmptySquares(fen);

  return fen;
}

if (RUN_ASSERTS) {
  console.assert(objToFen(START_POSITION) === START_FEN);
  console.assert(objToFen({}) === '8/8/8/8/8/8/8/8');
  console.assert(objToFen({ a2: 'wP', b2: 'bP' }) === '8/8/8/8/8/8/Pp6/8');
}

function squeezeFenEmptySquares(fen) {
  return fen
    .replace(/11111111/g, '8')
    .replace(/1111111/g, '7')
    .replace(/111111/g, '6')
    .replace(/11111/g, '5')
    .replace(/1111/g, '4')
    .replace(/111/g, '3')
    .replace(/11/g, '2');
}

function expandFenEmptySquares(fen) {
  return fen
    .replace(/8/g, '11111111')
    .replace(/7/g, '1111111')
    .replace(/6/g, '111111')
    .replace(/5/g, '11111')
    .replace(/4/g, '1111')
    .replace(/3/g, '111')
    .replace(/2/g, '11');
}

function calculatePositionFromMoves(position, moves) {
  let newPosition = deepCopy(position);

  for (const move of moves) {
    const [source, target] = move.split('-');

    // skip the move if the position doesn't have a piece on the source square
    if (!newPosition.hasOwnProperty(source)) continue;

    const piece = newPosition[source];
    delete newPosition[source];
    newPosition[target] = piece;
  }

  return newPosition;
}

/*
=========================
        STATE
=========================
*/

let currentOrientation = 'white';
let currentPosition = {};
let squareSize = 50;
let useSVG = true;

/*
=========================
        GAME LOGIC
=========================
*/

currentPosition = deepCopy(START_POSITION);

const generateBoardHTML = (orientation) => {
  const boardDiv = document.getElementById('board');
  boardDiv.innerHTML = '';

  if (orientation !== 'black') orientation = 'white';

  let columns = deepCopy(COLUMNS);
  let row = 8;
  if (orientation === 'black') {
    columns.reverse();
    row = 1;
  }

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  for (let i = 0; i < 8; i++) {
    const tr = document.createElement('tr');
    appendRowNumbersHTML(tr, row);

    for (let j = 0; j < 8; j++) {
      const td = document.createElement('td');
      td.id = `${columns[j]}${row}`;

      if (i % 2 === j % 2) {
        td.className = 'square light-square';
      } else {
        td.className = 'square dark-square';
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);

    if (orientation === 'white') {
      row = row - 1;
    } else {
      row = row + 1;
    }
  }
  boardDiv.appendChild(table);
  table.appendChild(tbody);
  appendColumnLettersHTML(table, columns);
};

const appendRowNumbersHTML = (table_row, row_number) => {
  const th = document.createElement('th');
  th.innerHTML = row_number;
  table_row.appendChild(th);
};

const appendColumnLettersHTML = (table, columns) => {
  const tfoot = document.createElement('tfoot');
  tfoot.innerHTML = `<tr><th>${columns.map((x) => `<th>${x}`).join('')}`;
  table.appendChild(tfoot);
};

const putPiecesOnBoard = (position) => {
  for (const [square, piece] of Object.entries(position)) {
    const td = document.getElementById(square);
    if (useSVG) {
      td.innerHTML = `
      <div class="piece">
        <img src="./img/${piece}.svg" height="100%" width="100%"></img>
      </div>`;
    } else {
      td.innerHTML = `
      <div class="piece">
        ${pieceEntityCodes[piece]}
      </div>`;
    }
  }
};

const setPosition = (position) => {
  currentPosition = position;
};

const drawBoard = (position = currentPosition, orientation = currentOrientation) => {
  let pos = deepCopy(position);
  setPosition(pos);

  if (validFEN(pos)) {
    pos = fenToObj(pos);
  } else if (!validPositionObject(pos)) {
    console.error('Invalid Position!');
    return false;
  }

  generateBoardHTML(orientation);
  putPiecesOnBoard(pos);
  addEventListeners();
  return true;
};

const setColorScheme = (colorScheme) => {
  document.body.style.setProperty('--light-square', COLOR_SCHEMES[colorScheme][0]);
  document.body.style.setProperty('--dark-square', COLOR_SCHEMES[colorScheme][1]);
};

const setBoardSize = (boardSize) => {
  squareSize = boardSize / 8;
  document.body.style.setProperty('--square-size', `${squareSize}px`);
};

const flipBoard = () => {
  currentOrientation = currentOrientation === 'white' ? 'black' : 'white';
  drawBoard();
  return currentOrientation;
};

function makeMove(source, target) {
  const move = `${source}-${target}`;
  if (!validMove(move)) return;

  const moves = [move];
  const newPosition = calculatePositionFromMoves(currentPosition, moves);
  currentPosition = deepCopy(newPosition);
  drawBoard();
}

/*
=========================
        EVENTS
=========================
*/

function drag(e) {
  const position = deepCopy(currentPosition);
  const source = e.target.id;
  const piece = getPiece(source, position);

  let img = new Image(squareSize, squareSize);
  img.src = `./img/${piece}.svg`;

  e.dataTransfer.setData('square', e.target.id);
  e.dataTransfer.setDragImage(img, 20, 20);

  if (isFunction(config.onDrag)) {
    config.onDrag(source, piece, deepCopy(currentPosition), currentOrientation);
  }
}

function drop(e) {
  e.preventDefault();

  const source = e.dataTransfer.getData('square');
  const target = e.target.id;

  if (isFunction(config.onDrop)) {
    const onDrop = config.onDrop(source, target, deepCopy(currentPosition), currentOrientation);

    if (onDrop) {
      makeMove(source, target);
    } else {
      //dont
    }
  } else {
    makeMove(source, target);
  }
}

function allowDrop(e) {
  e.preventDefault();
}

if (CLICKMOVE) {
  let selectedPiece = '';

  function boardClick(e) {
    const square = e.target.id.toString();
    removeHighlight();

    const targetColor = getPieceColor(getPiece(square, currentPosition));
    const sourceColor = getPieceColor(getPiece(selectedPiece, currentPosition));

    if (targetColor !== sourceColor && selectedPiece !== '') {
      makeMove(selectedPiece, square);
      selectedPiece = '';
    } else {
      //highlightSquare(square);
      selectedPiece = square;
    }
  }
} else {
  function boardClick(e) {
    const square = e.target.id.toString();
    //removeHighlight();

    if (currentPosition.hasOwnProperty(square)) {
      //highlightSquare(square);
    }
  }
}

/*
CUSTOM FUNCTIONS
*/

function mouseenterSquare(e) {
  const square = e.currentTarget.id;
  const piece = getPiece(square, currentPosition);

  if (isFunction(config.onMouseoverSquare)) {
    config.onMouseoverSquare(square, piece, deepCopy(currentPosition), currentOrientation);
  }
}

function mouseleaveSquare(e) {
  const square = e.currentTarget.id;
  const piece = getPiece(square, currentPosition);

  if (isFunction(config.onMouseoutSquare)) {
    config.onMouseoutSquare(square, piece, deepCopy(currentPosition), currentOrientation);
  }
}

function addEventListeners() {
  const table = document.getElementsByTagName('table')[0];
  table.addEventListener('click', boardClick);

  const tds = document.getElementsByTagName('td');
  for (td of tds) {
    td.draggable = true;
    td.addEventListener('dragstart', drag);
    td.addEventListener('drop', drop);
    td.addEventListener('dragover', allowDrop);
    td.addEventListener('mouseenter', mouseenterSquare);
    td.addEventListener('mouseleave', mouseleaveSquare);
  }
}

/*
==============
==============
==============
*/

/*
drawBoard();
makeMove();
flipBoard();
*/

if (typeof exports !== 'undefined') {
  exports.Chessboard = window.Chessboard();
}
