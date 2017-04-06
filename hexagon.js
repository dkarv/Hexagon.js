// Hex math defined here: http://blog.ruslans.com/2011/02/hexagonal-grid-math.html

function HexagonGrid(canvasId, radius) {
    this.radius = radius;

    this.height = Math.sqrt(3) * radius;
    this.width = 2 * radius;
    this.side = (3 / 2) * radius;

    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext('2d');

    this.canvasOriginX = 0;
    this.canvasOriginY = 0;

    this.tiles = [];
    this.soldiers = [];
    this.players = [];

    this.canvas.addEventListener('mousedown', this.clickEvent.bind(this), false);
    this.canvas.addEventListener('contextmenu', this.clickEvent.bind(this), false);
    this.last = [0, 0];
    this.canvas.addEventListener('mousemove', this.clickEvent.bind(this), false);
    document.getElementsByTagName('body')[0].addEventListener('keydown', this.clickEvent.bind(this), false);
}

HexagonGrid.prototype.drawHexGrid = function(rows, cols, originX, originY) {
    this.rows = rows;
    this.cols = cols;

    this.canvasOriginX = originX;
    this.canvasOriginY = originY;

    for(var col = 0; col < this.cols; col++) {
        this.tiles[col] = [];
        this.soldiers[col] = [];
        this.players[col] = [];
        for(var row = 0; row < this.rows; row++) {
            this.tiles[col][row] = 0;
            this.soldiers[col][row] = -1;
            this.players[col][row] = -1;
        }
    }

    this.draw();
};

var COLORS = ['#03a9f4', '#FFF176', '#9ccc65', '#e0e0e0'];
var PLAYERS = ['darkblue', 'darkgreen', 'darkred', 'darkorange'];
HexagonGrid.prototype.draw = function() {
    var currentHexX;
    var currentHexY;

    var offsetColumn = false;

    for(var col = 0; col < this.cols; col++) {
        for(var row = 0; row < this.rows; row++) {

            if(!offsetColumn) {
                currentHexX = (col * this.side) + this.canvasOriginX;
                currentHexY = (row * this.height) + this.canvasOriginY;
            } else {
                currentHexX = col * this.side + this.canvasOriginX;
                currentHexY = (row * this.height) + this.canvasOriginY + (this.height * 0.5);
            }

            var text = null;
            var textColor = null;
            if(this.tiles[col][row] !== -1) {
                text = this.soldiers[col][row];
                textColor = PLAYERS[this.players[col][row]];
            }

            this.drawHex(currentHexX, currentHexY, COLORS[this.tiles[col][row]], text, textColor);
        }
        offsetColumn = !offsetColumn;
    }
};

HexagonGrid.prototype.drawHexAtColRow = function(column, row, color) {
    var drawy = column % 2 == 0 ? (row * this.height) + this.canvasOriginY : (row * this.height) + this.canvasOriginY + (this.height / 2);
    var drawx = (column * this.side) + this.canvasOriginX;

    this.drawHex(drawx, drawy, color, "");
};

HexagonGrid.prototype.drawHex = function(x0, y0, fillColor, text, textColor) {
    this.context.strokeStyle = "#000";
    this.context.beginPath();
    this.context.moveTo(x0 + this.width - this.side, y0);
    this.context.lineTo(x0 + this.side, y0);
    this.context.lineTo(x0 + this.width, y0 + (this.height / 2));
    this.context.lineTo(x0 + this.side, y0 + this.height);
    this.context.lineTo(x0 + this.width - this.side, y0 + this.height);
    this.context.lineTo(x0, y0 + (this.height / 2));

    if(fillColor) {
        this.context.fillStyle = fillColor;
        this.context.fill();
    }

    this.context.closePath();
    this.context.stroke();

    if(text) {
        this.context.font = "32px";
        this.context.fillStyle = textColor;
        this.context.fillText(text, x0 + (this.width / 2) - (this.width / 4), y0 + (this.height - 5));
    }
};

//Recusivly step up to the body to calculate canvas offset.
HexagonGrid.prototype.getRelativeCanvasOffset = function() {
    var x = 0, y = 0;
    var layoutElement = this.canvas;
    if(layoutElement.offsetParent) {
        do {
            x += layoutElement.offsetLeft;
            y += layoutElement.offsetTop;
        } while(layoutElement = layoutElement.offsetParent);

        return { x: x, y: y };
    }
};

//Uses a grid overlay algorithm to determine hexagon location
//Left edge of grid has a test to acuratly determin correct hex
HexagonGrid.prototype.getSelectedTile = function(mouseX, mouseY) {

    var offSet = this.getRelativeCanvasOffset();

    mouseX -= offSet.x;
    mouseY -= offSet.y;

    var column = Math.floor((mouseX) / this.side);
    var row = Math.floor(
        column % 2 == 0
            ? Math.floor((mouseY) / this.height)
            : Math.floor(((mouseY + (this.height * 0.5)) / this.height)) - 1);


    //Test if on left side of frame            
    if(mouseX > (column * this.side) && mouseX < (column * this.side) + this.width - this.side) {


        //Now test which of the two triangles we are in 
        //Top left triangle points
        var p1 = new Object();
        p1.x = column * this.side;
        p1.y = column % 2 == 0
            ? row * this.height
            : (row * this.height) + (this.height / 2);

        var p2 = new Object();
        p2.x = p1.x;
        p2.y = p1.y + (this.height / 2);

        var p3 = new Object();
        p3.x = p1.x + this.width - this.side;
        p3.y = p1.y;

        var mousePoint = new Object();
        mousePoint.x = mouseX;
        mousePoint.y = mouseY;

        if(this.isPointInTriangle(mousePoint, p1, p2, p3)) {
            column--;

            if(column % 2 != 0) {
                row--;
            }
        }

        //Bottom left triangle points
        var p4 = new Object();
        p4 = p2;

        var p5 = new Object();
        p5.x = p4.x;
        p5.y = p4.y + (this.height / 2);

        var p6 = new Object();
        p6.x = p5.x + (this.width - this.side);
        p6.y = p5.y;

        if(this.isPointInTriangle(mousePoint, p4, p5, p6)) {
            column--;

            if(column % 2 == 0) {
                row++;
            }
        }
    }

    return { row: row, column: column };
};


HexagonGrid.prototype.sign = function(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

HexagonGrid.prototype.isPointInTriangle = function isPointInTriangle(pt, v1, v2, v3) {
    var b1, b2, b3;

    b1 = this.sign(pt, v1, v2) < 0.0;
    b2 = this.sign(pt, v2, v3) < 0.0;
    b3 = this.sign(pt, v3, v1) < 0.0;

    return ((b1 == b2) && (b2 == b3));
};

HexagonGrid.prototype.incTile = function(col, row) {
    var before = this.tiles[col][row];
    this.tiles[col][row] =
        (before + 1) % 4;
    if(this.tiles[col][row] === 0) {
        this.soldiers[col][row] = -1;
        this.players[col][row] = -1;
    } else if(before === 0) {
        this.soldiers[col][row] = 1;
        this.players[col][row] = 0;
    }
};

HexagonGrid.prototype.incPlayer = function(col, row) {
    if(this.tiles[col][row] !== 0) {
        this.players[col][row] = (this.players[col][row] + 1) % 4;
    }
};

HexagonGrid.prototype.setSoldiers = function(col, row, num) {
    if(this.tiles[col][row] !== 0 && num > 0 && num < 10) {
        this.soldiers[col][row] = num;
    }
};

HexagonGrid.prototype.clickEvent = function(e) {
    console.log(e);
    var mouseX;
    var mouseY;

    if(e.type === 'mousemove') {
        this.last = [e.pageX, e.pageY];
        return;
    }

    if(e.type === 'keydown') {
        mouseX = this.last[0];
        mouseY = this.last[1];
    } else {
        mouseX = e.pageX;
        mouseY = e.pageY;
    }

    var localX = mouseX - this.canvasOriginX;
    var localY = mouseY - this.canvasOriginY;

    var tile = this.getSelectedTile(localX, localY);
    console.log('clicked ' + tile.column + 'x' + tile.row);
    if(tile.column >= 0 && tile.row >= 0 && tile.column < this.cols && tile.row < this.rows) {
        if(e.type === 'mousedown' && e.which === 1) {
            this.incTile(tile.column, tile.row);
            this.draw();
            e.preventDefault();
            return false;
        } else if(e.type === 'contextmenu' && e.which === 3) {
            this.incPlayer(tile.column, tile.row);
            this.draw();
            e.preventDefault();
            return false;
        } else if(e.type === 'keydown') {
            var num = parseInt(e.key);
            if(num && num > 0 && num < 10) {
                this.setSoldiers(tile.column, tile.row, num);
                this.draw();
                e.preventDefault();
                return false;
            }
        }
        return true;
    }
};
