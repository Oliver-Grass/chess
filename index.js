const moveSound = new Audio('./sound/Move.mp3');

const game = new Chess();

let config = {
  playerside: 'w',
  onMouseoutSquare,
  onMouseoverSquare,
  onDrop,
  onDrag,
};

drawBoard();
populateGUI();
setSize();

window.onresize = setSize;

function setSize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (w > h) {
    setBoardSize((h * 2) / 3);
  } else {
    setBoardSize((w * 2) / 3);
  }
}

function populateGUI() {
  drawBoard(fenToObj(game.fen()));
  moveSound.play();

  const fen = document.getElementById('fen');
  fen.value = game.fen();

  const pgnMovePattern = /([RNBQK][a-h]?[\S]?[a-h][1-8][+#]?)|([a-h]?[\S]?[a-h][1-8](=[RNBQ])?)|([O-O-O])/g;
  const pgn = document.getElementById('pgn');

  let index = 0;
  pgn.innerHTML = game
    .pgn({ max_width: 5, newline_char: '<br />' })
    .replace(
      pgnMovePattern,
      (x) => `<span id="pgn-${index++}" onclick="setPositionPGN(this.id)">${x}</span>`
    );

  if (game.game_over()) {
    alert('Game over');
  }
}

function setFEN(fen) {
  if (game.validate_fen(fen).valid) {
    game.load(fen);
    game.delete_comments();
    populateGUI();
  }
  return false;
}

function setPositionPGN(node) {
  const [prefix, index] = node.split('-');
  const pgnArray = [];

  for (let i = index; i >= 0; i--) {
    const node = document.getElementById(`pgn-${i}`);
    pgnArray.push(node.innerHTML);
  }

  const pgn = pgnArray.reverse().join(' ');
  game.load_pgn(pgn);
  populateGUI();
}

function onDrag(source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over()) {
    alert('Game over');
  }

  // or if it's not that side's turn
  if (
    (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (game.turn() === 'b' && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

// should return true for valid move
function onDrop(source, target) {
  removeHighlight();

  const move = `${source}-${target}`;

  if (!issueMove(move)) return false;

  return true;
}

function onClick(source, target) {
  console.log('index');
}

function onMouseoverSquare(square, piece) {
  const moves = game.moves({
    square: square,
    verbose: true,
  });

  if (moves.length === 0) return;

  highlightSquare(square);

  for (move of moves) {
    highlightSquare(move.to);
  }
}

function onMouseoutSquare(square, piece) {
  removeHighlight();
}

// e2-e4
function issueMove(move) {
  const [source, target] = move.split('-');

  const tempMove = game.move({
    from: source,
    to: target,
    promotion: 'q',
  });

  if (tempMove === null) return false;

  populateGUI();
  highlightMove(move);

  if (game.turn() !== config.playerside) {
    const engine = document.getElementById('engines').value;
    switch (engine) {
      case 'stockfish':
        makeStockfishMove(game);
        break;
      case 'homebrew':
        makeHomebrewMove(game);
        break;
      default:
        makeHomebrewMove(game);
        break;
    }
  }
}

function makeHomebrewMove(game) {
  game.move(getBestMove(game));
  populateGUI();
}

function makeStockfishMove(game) {
  sf.postMessage(`position fen ${game.fen()}`);
  sf.postMessage('go depth ' + 5);
}

/*
====================
INITIALISE STOCKFISH
====================
*/
const wasmSupported =
  typeof WebAssembly === 'object' &&
  WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

const sf = new Worker(wasmSupported ? 'stockfish.wasm.js' : 'stockfish.js');

sf.addEventListener('message', function (e) {
  if (e.data.startsWith('bestmove')) {
    const [, best, , ponder] = e.data.split(' ');

    const bestFrom = best.slice(0, 2);
    const bestTo = best.slice(2, 4);
    const bestMove = `${bestFrom}-${bestTo}`;

    const ponderFrom = ponder.slice(0, 2);
    const ponderTo = ponder.slice(2, 4);
    const ponderMove = `${ponderFrom}-${ponderTo}`;

    window.setTimeout(() => issueMove(bestMove), 500);
    console.log(e.data);
  }
});

sf.postMessage('uci');
sf.postMessage('setoption name UCI_AnalyseMode value false');
//sf.postMessage('setoption name Analysis Contempt value false');
setTimeout(() => {
  console.log('============ START ============');
  sf.postMessage('setoption name Threads value 16');
  sf.postMessage('setoption name Hash value 1024');
}, 3000);
