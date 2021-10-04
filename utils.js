'use strict';

// function printMat(mat, selector) {
//   var strHTML = '<table border="0"><tbody>';
//   for (var i = 0; i < mat.length; i++) {
//     strHTML += '<tr>';
//     for (var j = 0; j < mat[0].length; j++) {
//       var cell = mat[i][j];
//       // you can change to class if you prefer
//       var idName = 'cell' + i + '-' + j;
//       strHTML += '<td id="' + idName + '"> ' + cell + ' </td>';
//     }
//     strHTML += '</tr>';
//   }
//   strHTML += '</tbody></table>';
//   var elContainer = document.querySelector(selector);
//   elContainer.innerHTML = strHTML;
// }

//bulid mat
// function buildMat(Rows, Cols) {
//   var board = [];
//   for (var i = 0; i < Rows; i++) {
//     board[i] = [];
//     for (var j = 0; j < Cols; j++) {
//       board[i][j] = '';
//     }
//   }
//   console.table(board);
//   return board;
// }

//not inclusive
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

// i can use it
// function drawRandNum(numbers) {
//   var idx = getRandomInt(0, numbers.length - 1);
//   var num = numbers[idx];
//   numbers.splice(idx, 1);
//   return num;
// }

//count cells around
function getNumOfCellsAround(cellPos, mat) {
  var cellsCount = 0;
  for (var i = cellPos.i - 1; i <= cellPos.i + 1; i++) {
    if (i < 0 || i > mat.length - 1) continue;
    for (var j = cellPos.j - 1; j <= cellPos.j + 1; j++) {
      if (i === cellPos.i && j === cellPos.j) continue;
      if (j < 0 || j > mat[0].length - 1) continue;
      cellsCount++;
    }
  }
  return cellsCount;
}

//create a coords i , j object array
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

//get coord of a cell and return a elCell , dom element of that cell
function getCellAsDomElement(coord) {
  // you can change # to . if you use class selector
  var elCell = document.querySelector(`#cell${coord.i}-${coord.j}`);
  return elCell;
}
