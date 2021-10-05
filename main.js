var gBoard;
//constants
const BOMB = '💣';
const FLAG = '🚩';
const WIN = '😍';
const LOSE = '💀';
const STEPBOMB = '🤯';
const NORMAL = '🧐';

//global var
var gBoardRowsSize = 4;
var gBoardColsSize = 4;
var gNumOfBombs = 2;
var gFlagsCount = gNumOfBombs;
var gIsFirstClick = true;
var gEmptyCells;
var gSafeClickes;
var gFirstSafeClick = true;
var gIsGameOver = false;
var gIsWin = false;
var gClickedCellsCounter = gBoardRowsSize * gBoardColsSize;
var gIntervalTime;
var gTimer = 0;
var gLives = 3;
var gSafeClicksCount = 3;
var gIsUseHint = false;
var gIsManuallMode = false;
var gManuallBombsNum = gNumOfBombs;
var gIsLevelBeginner = true;
var gIsLevelMedium = false;
var gIsLevelExpert = false;

var gBestScores = {
  beginner: localStorage.bestScoreBeginner
    ? localStorage.bestScoreBeginner
    : 'first time',
  medium: localStorage.bestScoreMedium
    ? localStorage.bestScoreMedium
    : 'first time',
  expert: localStorage.bestScoreExpert
    ? localStorage.bestScoreExpert
    : 'first time',
};

var gUndoState = {
  moves: [],
  stateInfo: [],
};

function init() {
  gBoard = buildBoard(gBoardRowsSize, gBoardColsSize);
  setRandBombs(gNumOfBombs);
  setCellsNumOfBombsAround();
  renderBoard(gBoard, '.gameBoard');
  //display flags count to dom
  updateFlagsCounterDom(gFlagsCount);
  updateTimerDom(0);
  updateLivesDom(gLives);
  updateSafeClicksDom(gSafeClicksCount);
  gUndoState = {
    moves: [],
    stateInfo: [],
  };
}

function manuallMode() {
  gBoard = buildBoard(gBoardRowsSize, gBoardColsSize);
  gIsManuallMode = true;
  renderBoard(gBoard, '.gameBoard');
}

function restart(boardRowsSize = 4, boardColsSize = 4, numOfBombs = 2) {
  //TODO: fix bug when click in other level mode, reset the current board
  // set var
  gBoardRowsSize = boardRowsSize;
  gBoardColsSize = boardColsSize;
  gNumOfBombs = numOfBombs;
  gTimer = 0;
  gLives = 3;
  gSafeClicksCount = 3;
  gFlagsCount = numOfBombs;
  gIsFirstClick = true;
  gFirstSafeClick = true;
  gEmptyCells;
  gIsGameOver = false;
  gIsWin = false;
  gIsUseHint = false;
  gIsManuallMode = false;
  gManuallBombsNum = gNumOfBombs;
  changeSmileyDom(NORMAL);
  enableHintBtns();
  enableSafeBtn();
  gClickedCellsCounter = gBoardRowsSize * gBoardColsSize;
  clearInterval(gIntervalTime);
  init();
}
//making the restart button dynamic , adopet to the current level
updateRestartButtonDom();

//show best score on the start
updateBestScoreDom(gBestScores.beginner);

function changeLevel() {
  var selectedLevel = document.getElementById('level').value;
  switch (selectedLevel) {
    case 'beginner':
      restart();
      setAllLevelsFalse();
      gIsLevelBeginner = true;
      updateBestScoreDom(gBestScores.beginner);
      break;
    case 'medium':
      restart(8, 8, 12);
      setAllLevelsFalse();
      gIsLevelMedium = true;
      updateBestScoreDom(gBestScores.medium);
      break;
    case 'expert':
      restart(12, 12, 30);
      setAllLevelsFalse();
      gIsLevelExpert = true;
      updateBestScoreDom(gBestScores.expert);
      break;
  }
}

//build a board with object cells
function buildBoard(Rows, Cols) {
  var board = [];
  for (var i = 0; i < Rows; i++) {
    board[i] = [];
    for (var j = 0; j < Cols; j++) {
      board[i][j] = {
        isBomb: false,
        coord: {i, j},
        numOfBombsAround: 0,
        isShown: false,
        isFlaged: false,
        textContent: '',
      };
    }
  }
  console.table(board);
  return board;
}

//render the board to the DOM
function renderBoard(mat, selector) {
  var strHTML = '<table border="0"><tbody>';
  for (var i = 0; i < mat.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < mat[0].length; j++) {
      var cell = mat[i][j];
      //if cell is a bomb render it as BOMB
      var cellDisplay = cell.isBomb ? BOMB : cell.numOfBombsAround;
      //if cell have 0 bombs around render it as empty space
      if (cellDisplay === 0) cellDisplay = ' ';
      //update model
      cell.textContent = cellDisplay;
      var idName = 'cell' + i + '-' + j;
      strHTML += `<td id="${idName}" onclick="cellClicked(this, ${i}, ${j})" 
                                     oncontextmenu="putFlag(this, event, ${i}, ${j})" 
                                     title="${i}-${j}" >  ${cellDisplay} </td>`;
    }
    strHTML += '</tr>';
  }
  strHTML += '</tbody></table>';
  var elContainer = document.querySelector(selector);
  elContainer.innerHTML = strHTML;
}

//undo logic
function renderUndoMove(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      var cell = board[i][j];
      var elCell = document.querySelector(`#cell${i}-${j}`);
      elCell.innerText = cell.textContent;
      if (!cell.isShown) {
        var elCell = document.querySelector(`#cell${i}-${j}`);
        elCell.style.backgroundColor = 'blueviolet';

        addColorTranspernt(cell.coord);
      }
      if (cell.isFlaged) {
        var elCell = document.querySelector(`#cell${i}-${j}`);
        elCell.innerText = cell.textContent;
        console.log(cell);
        cell.isFlaged = false;
        gFlagsCount++;
        console.log(gFlagsCount);
        // if (cell.isBomb) gClickedCellsCounter++;
        // gClickedCellsCounter++;
        updateFlagsCounterDom(gFlagsCount);
        addColorTranspernt(cell.coord);
      }
    }
  }
}

function undo() {
  if (!gUndoState.moves.length) return;
  gBoard = gUndoState.moves.pop();

  //undo the info var
  var info = gUndoState.stateInfo.pop();
  gTimer = info.timer;
  updateTimerDom(gTimer);
  gLives = info.lives;
  updateLivesDom(gLives);
  //TODO: fix safe clickes state , no track of that
  //TODO: add hint track
  gSafeClicksCount = info.safeClicks;
  updateSafeClicksDom(gSafeClicksCount);
  gClickedCellsCounter = info.clickedCellsCounter;
  gFlagsCount = info.flagsCount;
  console.log(gFlagsCount);
  updateFlagsCounterDom(gFlagsCount);
  //rendr the previous move
  renderUndoMove(gBoard);
}

//put random bombs on the board
function setRandBombs(numOfBombs) {
  gEmptyCells = createCoordsArray();
  for (var i = 0; i < numOfBombs; i++) {
    var randCoord = drawRandCoord(gEmptyCells);
    //model
    var cell = gBoard[randCoord.i][randCoord.j];
    cell.isBomb = true;
  }
}

//create a coords i , j array
function createCoordsArray() {
  var coords = [];
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      var coord = {i, j};
      coords.push(coord);
    }
  }
  return coords;
}

//return the number of bombs around a cell
function getNumOfBombsAround(coord) {
  var bombsCount = 0;
  for (var i = coord.i - 1; i <= coord.i + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = coord.j - 1; j <= coord.j + 1; j++) {
      if (i === coord.i && j === coord.j) continue;
      if (j < 0 || j > gBoard[0].length - 1) continue;
      var cell = gBoard[i][j];
      if (cell.isBomb) bombsCount++;
    }
  }
  return bombsCount;
}

//set the property numOfBombsAround of every cell
function setCellsNumOfBombsAround() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      var cell = gBoard[i][j];
      cell.numOfBombsAround = getNumOfBombsAround(cell.coord);
    }
  }
}

//when cell clicked
function cellClicked(elCell, i, j) {
  if (gIsGameOver || gIsWin) return;

  var cell = gBoard[i][j];
  if (!cell.isShown && !gIsUseHint) {
    //keeping the state of the current move, using deep copy
    gUndoState.moves.push(copyMat(gBoard));
    var info = {
      lives: gLives,
      timer: gTimer,
      safeClicks: gSafeClicksCount,
      clickedCellsCounter: gClickedCellsCounter,
      flagsCount: gFlagsCount,
    };
    gUndoState.stateInfo.push(info);
  }
  if (gIsManuallMode) {
    //model
    cell.isBomb = true;
    elCell.style.backgroundColor = 'white';
    elCell.innerText = BOMB;
    elCell.style.color = 'black';
    gManuallBombsNum--;
    //can add time out soo it will wait a bit before start
    if (!gManuallBombsNum) {
      setCellsNumOfBombsAround();
      renderBoard(gBoard, '.gameBoard');
      gIsManuallMode = false;
      return;
    }
    return;
  }

  if (gIsUseHint) {
    showHint(cell.coord);
    gIsUseHint = false;
    return;
  }

  //start time on first click
  if (gIsFirstClick) {
    gIntervalTime = setInterval(() => {
      gTimer++;
      updateTimerDom(gTimer);
    }, 1000);
  }

  //if cell is flaged can`t click it
  if (cell.isFlaged) return;

  //if the first click is a bomb transfer it to a new place
  if (cell.isBomb && gIsFirstClick) {
    //transfer the bomb to new place
    transferBomb(cell);
    //set new numbers in the cells, to show the new state
    setCellsNumOfBombsAround();
    //render the new state of the board to the DOM
    renderBoard(gBoard, '.gameBoard');
    colorCell(i, j, 'white');
    gIsFirstClick = false;
    if (cell.numOfBombsAround === 0 && !cell.isBomb) {
      showAllEmptys(cell.coord);
    }
    return;
  }

  //clicked on a bomb lose life
  if (cell.isBomb && !cell.isShown) {
    gLives--;
    updateLivesDom(gLives);
    changeSmileyDom(STEPBOMB);
    setTimeout(() => {
      changeSmileyDom(NORMAL);
    }, 300);
  }

  //if you clicked on a bomb , and no more lives
  if (!gIsFirstClick && cell.isBomb && !cell.isShown && gLives === 0) {
    gameOver();
    return;
  }

  colorCell(i, j, 'white');
  gIsFirstClick = false;

  // if clicked on empty cell show all the emptys and around them
  if (cell.numOfBombsAround === 0 && !cell.isBomb) {
    showAllEmptys(cell.coord);
  }
  checkIsWin();
}

//color the cells, show them
function colorCell(i, j, strColor) {
  //model
  var cell = gBoard[i][j];

  //if clicked on a cell decrement the counter
  if (strColor !== 'red' && !cell.isShown) gClickedCellsCounter--;
  cell.isShown = true;

  //DOM
  //in undo need to put background color perpul and add transpernt
  var elCell = document.querySelector(`#cell${i}-${j}`);
  elCell.style.backgroundColor = strColor;

  removeColorTranspernt(cell.coord);
}

function gameOver() {
  showAllBombs();
  gIsGameOver = true;
  clearInterval(gIntervalTime);
  changeSmileyDom(LOSE);
  //quick fix for the change when step on bomb change back to lose smile
  setTimeout(() => {
    changeSmileyDom(LOSE);
  }, 300);
  console.log('you lost..');
}

function checkIsWin() {
  //check for victory
  if (gClickedCellsCounter === 0 && gFlagsCount >= 0 && gLives > 0) {
    winGame();
  }
}

function winGame() {
  gIsWin = true;
  clearInterval(gIntervalTime);
  changeSmileyDom(WIN);
  //quick fix for the change when step on bomb change back to win smile
  setTimeout(() => {
    changeSmileyDom(WIN);
  }, 300);
  checkUpdateBestScore();
  console.log('you win!');
}

//color all the bombs in red
function showAllBombs() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      var cell = gBoard[i][j];
      if (cell.isBomb) {
        colorCell(i, j, 'red');
      }
    }
  }
}

//show all the cells that are empty and there friends around
function showAllEmptys(coord) {
  for (var i = coord.i - 1; i <= coord.i + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = coord.j - 1; j <= coord.j + 1; j++) {
      if (i === coord.i && j === coord.j) continue;
      if (j < 0 || j > gBoard[0].length - 1) continue;
      var cell = gBoard[i][j];

      if (cell.isFlaged) removeFlag(cell);

      if (!cell.isShown) {
        // !cell.isShown prevent from max call stack
        colorCell(i, j, 'white');
        //recurisve call
        if (cell.numOfBombsAround === 0) {
          showAllEmptys(cell.coord);
        }
      }
    }
  }
}

function transferBomb(cellClicked) {
  var randCoord = drawRandCoord(gEmptyCells);
  var newCell = gBoard[randCoord.i][randCoord.j];
  //put in the new cell a bomb
  newCell.isBomb = true;
  //remove the bomb from the clickedCell
  cellClicked.isBomb = false;
}

//put flag when right click
function putFlag(elCell, event, i, j) {
  event.preventDefault();
  if (gIsGameOver || gIsWin) return;
  var cell = gBoard[i][j];
  if (cell.isShown) return;

  if (cell.isFlaged) {
    removeFlag(cell);
    addColorTranspernt(cell.coord);
    return;
  }
  cell.isFlaged = true;
  elCell.innerText = FLAG;
  gFlagsCount--;
  // if (gUndoState.moves.length) {
  //   //if flag a cell update the state of the flags in he undo
  //   gUndoState.stateInfo[gUndoState.stateInfo.length - 1].flagsCount =
  //     gFlagsCount;
  // }

  if (cell.isBomb) gClickedCellsCounter--;
  updateFlagsCounterDom(gFlagsCount);
  removeColorTranspernt(cell.coord);
  //check win
  // if (gClickedCellsCounter === 0 && gFlagsCount === 0) {
  //   winGame();
  // }
  checkIsWin();
}

function removeFlag(cell) {
  //put back the real cell content
  var elCell = document.querySelector(`#cell${cell.coord.i}-${cell.coord.j}`);
  elCell.innerText = cell.textContent;
  cell.isFlaged = false;
  gFlagsCount++;
  if (cell.isBomb) gClickedCellsCounter++;
  // gClickedCellsCounter++;
  updateFlagsCounterDom(gFlagsCount);
  addColorTranspernt(cell.coord);
}

function updateFlagsCounterDom(num) {
  var elFlagsCount = document.querySelector('.flags-count');
  elFlagsCount.innerText = num;
}

function updateTimerDom(time) {
  var elTimer = document.querySelector('.timer');
  elTimer.innerText = time;
}

function updateLivesDom(lives) {
  var elLives = document.querySelector('.lives');
  elLives.innerText = lives;
}

function updateBestScoreDom(score) {
  var elBestScore = document.querySelector('.best-score');
  elBestScore.innerText = score;
}

function updateSafeClicksDom(num) {
  var elSafeNumber = document.querySelector('.safe-number');
  elSafeNumber.innerText = num;
}

function changeSmileyDom(icon) {
  var elButton = document.querySelector('.btn-restart');
  elButton.innerText = icon;
}

//remove the css property transparent soo we could see the cell
function removeColorTranspernt(coord) {
  var elCell = document.querySelector(`#cell${coord.i}-${coord.j}`);
  elCell.style.color = 'black';
}

function addColorTranspernt(coord) {
  var elCell = document.querySelector(`#cell${coord.i}-${coord.j}`);
  elCell.style.color = 'transparent';
  elCell.style.backgroundColor = 'blueviolet';
}

function updateRestartButtonDom() {
  var elBtnRestart = document.querySelector('.btn-restart');
  elBtnRestart.addEventListener('click', () => {
    restart(gBoardRowsSize, gBoardColsSize, gNumOfBombs);
  });
}

function useHint(elButton) {
  elButton.disabled = true;
  gIsUseHint = true;
}

function enableHintBtns() {
  var elHintButtons = document.querySelectorAll('.btn-hint');
  for (var i = 0; i < elHintButtons.length; i++) {
    elHintButtons[i].disabled = false;
  }
}

function showHint(coord) {
  for (var i = coord.i - 1; i <= coord.i + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = coord.j - 1; j <= coord.j + 1; j++) {
      if (j < 0 || j > gBoard[0].length - 1) continue;
      var cell = gBoard[i][j];
      if (!cell.isShown && !cell.isFlaged) {
        toggleHintClass(cell.coord);
        removeColorTranspernt(coord);
      }
    }
  }
  setTimeout(() => {
    removeHint(coord);
  }, 1000);
}

function removeHint(coord) {
  for (var i = coord.i - 1; i <= coord.i + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = coord.j - 1; j <= coord.j + 1; j++) {
      if (j < 0 || j > gBoard[0].length - 1) continue;
      var cell = gBoard[i][j];
      if (!cell.isShown && !cell.isFlaged) {
        toggleHintClass(cell.coord);
        addColorTranspernt(cell.coord);
      }
    }
  }
}

function toggleHintClass(coord) {
  var elCell = document.querySelector(`#cell${coord.i}-${coord.j}`);
  elCell.classList.toggle('hint');
  elCell.style.color = 'black';
}

function setAllLevelsFalse() {
  gIsLevelBeginner = false;
  gIsLevelMedium = false;
  gIsLevelExpert = false;
}

function checkUpdateBestScore() {
  if (gIsLevelBeginner) {
    if (localStorage.bestScoreBeginner === undefined) {
      localStorage.setItem('bestScoreBeginner', gTimer);
      updateBestScoreDom(gTimer);
      gBestScores.beginner = gTimer;
    } else if (
      localStorage.bestScoreBeginner !== undefined &&
      parseInt(localStorage.bestScoreBeginner) > gTimer
    ) {
      localStorage.bestScoreBeginner = gTimer;
      updateBestScoreDom(gTimer);
      gBestScores.beginner = gTimer;
    }
    return;
  }

  if (gIsLevelMedium) {
    if (localStorage.bestScoreMedium === undefined) {
      localStorage.setItem('bestScoreMedium', gTimer);
      updateBestScoreDom(gTimer);
      gBestScores.medium = gTimer;
    } else if (
      localStorage.bestScoreMedium !== undefined &&
      parseInt(localStorage.bestScoreMedium) > gTimer
    ) {
      localStorage.bestScoreMedium = gTimer;
      updateBestScoreDom(gTimer);
      gBestScores.medium = gTimer;
    }
    return;
  }

  if (gIsLevelExpert) {
    if (localStorage.bestScoreExpert === undefined) {
      localStorage.setItem('bestScoreExpert', gTimer);
      updateBestScoreDom(gTimer);
      gBestScores.expert = gTimer;
    } else if (
      localStorage.bestScoreExpert !== undefined &&
      parseInt(localStorage.bestScoreExpert) > gTimer
    ) {
      localStorage.bestScoreExpert = gTimer;
      updateBestScoreDom(gTimer);
      gBestScores.expert = gTimer;
    }
  }
}

function showSafeClick() {
  if (!gSafeClicksCount) {
    var elBtnSafe = document.querySelector('.btn-safe');
    elBtnSafe.disabled = true;
    return;
  }
  if (gClickedCellsCounter - gNumOfBombs === 0) {
    var elBtnSafe = document.querySelector('.btn-safe');
    elBtnSafe.disabled = true;
    return;
  }
  if (gFirstSafeClick) {
    gSafeClickes = gEmptyCells.slice();
    gFirstSafeClick = false;
  }
  var randCoord = drawRandCoord(gSafeClickes);
  var cell = gBoard[randCoord.i][randCoord.j];
  while (cell.isShown) {
    var randCoord = drawRandCoord(gSafeClickes);
    if (randCoord === undefined) {
      var elBtnSafe = document.querySelector('.btn-safe');
      elBtnSafe.disabled = true;
      return;
    }
    var cell = gBoard[randCoord.i][randCoord.j];
  }
  var elCell = document.querySelector(`#cell${randCoord.i}-${randCoord.j}`);
  elCell.classList.add('safe');
  gSafeClicksCount--;
  updateSafeClicksDom(gSafeClicksCount);
  setTimeout(() => {
    elCell.classList.remove('safe');
  }, 1000);
}

function enableSafeBtn() {
  var elBtnSafe = document.querySelector('.btn-safe');
  elBtnSafe.disabled = false;
}

//return a rand coord from an array of coords
function drawRandCoord(coords) {
  var idx = getRandomInt(0, coords.length);
  var coord = coords[idx];
  coords.splice(idx, 1);
  return coord;
}

//get coord of a cell and return a elCell , dom element of that cell
function getCellAsDomElement(coord) {
  var elCell = document.querySelector(`#cell${coord.i}-${coord.j}`);
  return elCell;
}
