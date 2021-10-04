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
var gIsGameOver = false;
var gIsWin = false;
var gClickedCellsCounter = gBoardRowsSize * gBoardColsSize;
var gIntervalTime;
var gTimer = 0;
var gLives = 3;
var gIsUseHint = false;

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

function init() {
  gBoard = buildBoard(gBoardRowsSize, gBoardColsSize);
  setRandBombs(gNumOfBombs);
  setCellsNumOfBombsAround();
  renderBoard(gBoard, '.gameBoard');
  //display flags count to dom
  updateFlagsCounterDom();
  updateTimerDom(0);
  updateLivesDom();
}

function restart(boardRowsSize = 4, boardColsSize = 4, numOfBombs = 2) {
  //TODO: fix bug when click in other level mode, reset the current board
  // set var
  gBoardRowsSize = boardRowsSize;
  gBoardColsSize = boardColsSize;
  gNumOfBombs = numOfBombs;
  gTimer = 0;
  gLives = 3;
  gFlagsCount = numOfBombs;
  gIsFirstClick = true;
  gEmptyCells;
  gIsGameOver = false;
  gIsWin = false;
  gIsUseHint = false;
  changeSmileyDom(NORMAL);
  enableHintBtns();
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
    updateLivesDom();
    changeSmileyDom(STEPBOMB);
    setTimeout(() => {
      changeSmileyDom(NORMAL);
    }, 300);
  }

  //if you clicked on a bomb , not on the first click game over
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
}

//color the cells, show them , and check win on the way
function colorCell(i, j, strColor) {
  //model
  var cell = gBoard[i][j];

  //if clicked on a cell not a bomb increment the counter
  if (strColor !== 'red' && !cell.isShown) gClickedCellsCounter--;

  //check for victory
  if (gClickedCellsCounter === 0 && gFlagsCount >= 0 && gLives > 0) {
    winGame();
  }

  cell.isShown = true;

  //DOM
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

function winGame() {
  // fix when there are 2 flags on empty cells and all the bomb show,
  //prevent from win , and allow only when all the cells show with no flag on them
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
  gClickedCellsCounter--;
  updateFlagsCounterDom();
  removeColorTranspernt(cell.coord);
  //check win
  if (gClickedCellsCounter === 0 && gFlagsCount === 0) {
    winGame();
  }
}

function removeFlag(cell) {
  //put back the real cell content
  var elCell = document.querySelector(`#cell${cell.coord.i}-${cell.coord.j}`);
  elCell.innerText = cell.textContent;
  cell.isFlaged = false;
  gFlagsCount++;
  gClickedCellsCounter++;
  updateFlagsCounterDom();
}

function updateFlagsCounterDom() {
  var elFlagsCount = document.querySelector('.flags-count');
  elFlagsCount.innerText = gFlagsCount;
}

function updateTimerDom(time) {
  var elTimer = document.querySelector('.timer');
  elTimer.innerText = time;
}

function updateLivesDom() {
  var elLives = document.querySelector('.lives');
  elLives.innerText = gLives;
}

function updateBestScoreDom(score) {
  var elBestScore = document.querySelector('.best-score');
  elBestScore.innerText = score;
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
      toggleHintClass(cell.coord);
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
      toggleHintClass(cell.coord);
    }
  }
}

function toggleHintClass(coord) {
  var elCell = document.querySelector(`#cell${coord.i}-${coord.j}`);
  elCell.classList.toggle('hint');
}

function setAllLevelsFalse() {
  gIsLevelBeginner = false;
  gIsLevelMedium = false;
  gIsLevelExpert = false;
}

function checkUpdateBestScore() {
  if (gIsLevelBeginner) {
    console.log('here');
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
