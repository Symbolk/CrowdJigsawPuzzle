
// auto hide and show some components when the user switch focus between workspace and sidespace
$('.charms, .title, .info, .progress-bar').mouseleave(function () {
    $('.charms').animate({ opacity: 0 });
    $('.title').animate({ opacity: 0 });
    $('.info').animate({ opacity: 0 });
    $('.progress-bar').animate({ opacity: 0 });
});

$('.charms, .title, .info, .progress-bar').mouseover(function () {
    $('.charms').animate({ opacity: 1.0 });
    $('.title').animate({ opacity: 1.0 });
    $('.info').animate({ opacity: 1.0 });
    $('.progress-bar').animate({ opacity: 1.0 });
});


Array.prototype.remove = function (start, end) {
    this.splice(start, end);
    return this;
}

view.currentScroll = new Point(0, 0);
var scrollVector = new Point(0, 0);
var scrollMargin = 32;

$('#puzzle-image').attr('src', 'images/cat.jpg');

var imgWidth = $('.puzzle-image').css('width').replace('px', '');
var imgHeight = $('.puzzle-image').css('height').replace('px', '');
var tileWidth = 64;

var config = ({
    zoomScaleOnDrag: 1.0,
    imgName: 'puzzle-image',
    tileShape: 'straight', // curved or straight
    tileWidth: tileWidth,
    tilesPerRow: Math.ceil(imgWidth / tileWidth), //returns min int >= arg
    tilesPerColumn: Math.ceil(imgHeight / tileWidth),
    imgWidth: imgWidth,
    imgHeight: imgHeight,
    shadowWidth: 120,
});


/**
 * Start building the puzzle
 */
var puzzle = new JigsawPuzzle(config);
puzzle.zoom(-.1);
var path;
var movePath = false;


// add functions to the charms(e.g. toolbox)
$('.zoomIn').click(function () {
    puzzle.zoom(.1);
});

$('.zoomOut').click(function () {
    puzzle.zoom(-.1);
});

$('.help').mousedown(function () {
    if ($('.canvas').css('display') == 'none') {
        $('.canvas').show();
        $('.puzzle-image').hide();
        $('.logo').hide();
    } else {
        $('.canvas').hide();
        $('.puzzle-image').show();
        $('.logo').show();
    }
});

/**
 * click the settings button and show the puzzle settings
 */
(function () {
    var showButton = document.querySelector('#show-settings');
    var dialog = document.querySelector('#settings');
    var cancelButton = document.querySelector('#cancel-button');
    var applyButton = document.querySelector('#apply-button');

    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }

    cancelButton.addEventListener('click', function (event) {
        dialog.close();
    });

    showButton.addEventListener('click', function (event) {
        dialog.showModal();
    });

    /**
     * Disabled for now
     */
    applyButton.addEventListener('click', function (event) {
        if (document.querySelector('#option-1').checked === true) {
            // console.log('Level 1');
            // config.tileShape = 'straight';
            // var c = document.querySelector("#canvas");
            // var cxt = c.getContext("2d");
            // cxt.fillStyle = "white";
            // puzzle = new JigsawPuzzle(config);

        } else {
            // console.log('Level 2');
            // config.tileShape = 'curved';
            // $('.canvas').remove();
            // var newC=$('<canvas id="canvas" class="canvas" resize></canvas>');
            // $('.puzzle').append(newC);
            // var puzzle = new JigsawPuzzle(config);
        }
        dialog.close();
    });
}());


$('.restart').click(function () {
    // document.execCommand('Refresh');
    window.location.reload();
    // var puzzle = new JigsawPuzzle(config);
});

var charmsWidth = $('.charms').css('width').replace('px', '');
$('.puzzle-image').css('margin', '-' + imgHeight / 2 + 'px 0 0 -' + imgWidth / 2 + 'px');


function onMouseDown(event) {
    switch (event.event.button) {
        case 0: {
            console.log('MD');
            if (GroupMode.checked) {
                puzzle.pickGroup();
            } else {
                puzzle.pickTile();
            }
            break;
        }
        case 2: {
            // test hint function
            puzzle.showRecommendTiles();
            break;
        }
    }
}



function onMouseUp(event) {
    // restrict to the left click
    switch (event.event.button) {
        case 0: {
            console.log('MU');
            if (!GroupMode.checked) {
                // console.log('Release');
                puzzle.releaseTile();
            }
            break;
        }
    }
}

function onMouseMove(event) {

    puzzle.mouseMove(event.point, event.delta);

    if (event.point.x < scrollMargin) {
        scrollVector = new Point(scrollMargin - event.point.x, 0);
    } else {
        scrollVector = new Point(0, 0);
    }
}

function onMouseDrag(event) {
    switch (event.event.button) {
        case 0: {
            console.log('MG');
            if (GroupMode.checked) {
                puzzle.dragGroup(event.delta);
            } else {
                puzzle.dragTile(event.delta);
            }
            break;
        }
    }
}


function onKeyUp(event) {
    switch (event.key) {
        case 'z':
            puzzle.zoom(.1);
            break;
        case 'x':
            puzzle.zoom(-.1);
            break;
    }
}

var GroupMode = document.querySelector('#group-mode');

function JigsawPuzzle(config) {
    instance = this; // the current object(which calls the function)
    this.tileShape = config.tileShape;

    this.currentZoom = 1;
    this.zoomScaleOnDrag = config.zoomScaleOnDrag;
    this.imgName = config.imgName;
    this.shadowWidth = config.shadowWidth;
    this.puzzleImage = new Raster(config.imgName);
    this.puzzleImage.position = view.center;

    this.puzzleImage.visible = false;
    this.tileWidth = config.tileWidth;

    this.tilesPerRow = config.tilesPerRow;
    this.tilesPerColumn = config.tilesPerColumn;
    this.tileNum = this.tilesPerRow * this.tilesPerColumn;

    // output some info about this puzzle
    console.log("Game started : " + this.tileNum + " tiles(" + this.tilesPerRow + " rows * " + this.tilesPerColumn + " cols)");

    this.tileMarginWidth = this.tileWidth * 0.203125;
    this.selectedTile = undefined;
    this.selectedTileIndex = undefined;
    this.selectedGroup = undefined;
    this.selectedTiles = [];
    this.selectedTilesGroup = undefined;

    this.shadowScale = 1.5;
    this.tiles = createTiles(this.tilesPerRow, this.tilesPerColumn);

    // keep track of the steps of the current user
    this.steps = 0;

    function createTiles(xTileCount, yTileCount) {
        var tiles = new Array();
        var tileRatio = instance.tileWidth / 100.0;

        var shapeArray = getRandomShapes(xTileCount, yTileCount);
        var tileIndexes = new Array();
        for (var y = 0; y < yTileCount; y++) {
            for (var x = 0; x < xTileCount; x++) {

                var shape = shapeArray[y * xTileCount + x];

                var mask = getMask(tileRatio, shape.topTab, shape.rightTab, shape.bottomTab, shape.leftTab, instance.tileWidth);
                mask.opacity = 0.01;
                mask.strokeColor = '#fff'; //white

                var cloneImg = instance.puzzleImage.clone();
                var img = getTileRaster(
                    cloneImg,
                    new Size(instance.tileWidth, instance.tileWidth),
                    new Point(instance.tileWidth * x, instance.tileWidth * y)
                );

                var border = mask.clone();
                border.strokeColor = '#ccc'; //grey
                border.strokeWidth = 5;

                // each tile is a group of
                var tile = new Group(mask, border, img, border);
                tile.clipped = true;
                tile.opacity = 1;

                tile.shape = shape;
                tile.imagePosition = new Point(x, y);

                // tile fixed index/unique id
                tile.findex = y * xTileCount + x;
                //console.log(tile.findex);

                tiles.push(tile);
                tileIndexes.push(tileIndexes.length);
            }
        }

        // randomly select tiles and place them one by one 
        for (var y = 0; y < yTileCount; y++) {
            for (var x = 0; x < xTileCount; x++) {

                var index1 = Math.floor(Math.random() * tileIndexes.length);
                var index2 = tileIndexes[index1];
                var tile = tiles[index2];
                tileIndexes.remove(index1, 1);

                var position = view.center -
                    new Point(instance.tileWidth, instance.tileWidth / 2) +
                    new Point(instance.tileWidth * (x * 2 + ((y % 2))), instance.tileWidth * y) -
                    new Point(instance.puzzleImage.size.width, instance.puzzleImage.size.height / 2);

                var cellPosition = new Point(
                    Math.round(position.x / instance.tileWidth) + 1,//returns int closest to arg
                    Math.round(position.y / instance.tileWidth) + 1);

                tile.position = cellPosition * instance.tileWidth; // round position
                tile.cellPosition = cellPosition; // cell position
            }
        }

        return tiles;
    }

    function getRandomShapes(width, height) {
        var shapeArray = new Array();

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                var topTab = undefined;
                var rightTab = undefined;
                var bottomTab = undefined;
                var leftTab = undefined;

                if (y == 0)
                    topTab = 0;

                if (y == height - 1)
                    bottomTab = 0;

                if (x == 0)
                    leftTab = 0;

                if (x == width - 1)
                    rightTab = 0;

                shapeArray.push(
                    ({
                        topTab: topTab,
                        rightTab: rightTab,
                        bottomTab: bottomTab,
                        leftTab: leftTab
                    })
                );
            }
        }

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                var shape = shapeArray[y * width + x];

                var shapeRight = (x < width - 1) ?
                    shapeArray[y * width + (x + 1)] :
                    undefined;

                var shapeBottom = (y < height - 1) ?
                    shapeArray[(y + 1) * width + x] :
                    undefined;

                shape.rightTab = (x < width - 1) ?
                    getRandomTabValue() :
                    shape.rightTab;

                if (shapeRight)
                    shapeRight.leftTab = -shape.rightTab;

                shape.bottomTab = (y < height - 1) ?
                    getRandomTabValue() :
                    shape.bottomTab;

                if (shapeBottom)
                    shapeBottom.topTab = -shape.bottomTab;
            }
        }
        return shapeArray;
    }

    function getRandomTabValue() {
        //math.floor() returns max int <= arg
        switch (instance.tileShape) {
            case 'straight': {
                return 0;
                break;
            }
            case 'curved': {
                return Math.pow(-1, Math.floor(Math.random() * 2));
                break;
            }
            default: {
                return 0;
            }
        }
    }

    function getMask(tileRatio, topTab, rightTab, bottomTab, leftTab, tileWidth) {

        var curvyCoords = [
            0, 0, 35, 15, 37, 5,
            37, 5, 40, 0, 38, -5,
            38, -5, 20, -20, 50, -20,
            50, -20, 80, -20, 62, -5,
            62, -5, 60, 0, 63, 5,
            63, 5, 65, 15, 100, 0
        ];

        var mask = new Path();
        var tileCenter = view.center;

        var topLeftEdge = new Point(-4, 4);

        mask.moveTo(topLeftEdge);

        //Top
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = topLeftEdge + new Point(curvyCoords[i * 6 + 0] * tileRatio, topTab * curvyCoords[i * 6 + 1] * tileRatio);
            var p2 = topLeftEdge + new Point(curvyCoords[i * 6 + 2] * tileRatio, topTab * curvyCoords[i * 6 + 3] * tileRatio);
            var p3 = topLeftEdge + new Point(curvyCoords[i * 6 + 4] * tileRatio, topTab * curvyCoords[i * 6 + 5] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
        }
        //Right
        var topRightEdge = topLeftEdge + new Point(tileWidth, 0);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 1] * tileRatio, curvyCoords[i * 6 + 0] * tileRatio);
            var p2 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 3] * tileRatio, curvyCoords[i * 6 + 2] * tileRatio);
            var p3 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 5] * tileRatio, curvyCoords[i * 6 + 4] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
        }
        //Bottom
        var bottomRightEdge = topRightEdge + new Point(0, tileWidth);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = bottomRightEdge - new Point(curvyCoords[i * 6 + 0] * tileRatio, bottomTab * curvyCoords[i * 6 + 1] * tileRatio);
            var p2 = bottomRightEdge - new Point(curvyCoords[i * 6 + 2] * tileRatio, bottomTab * curvyCoords[i * 6 + 3] * tileRatio);
            var p3 = bottomRightEdge - new Point(curvyCoords[i * 6 + 4] * tileRatio, bottomTab * curvyCoords[i * 6 + 5] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
        }
        //Left
        var bottomLeftEdge = bottomRightEdge - new Point(tileWidth, 0);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 1] * tileRatio, curvyCoords[i * 6 + 0] * tileRatio);
            var p2 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 3] * tileRatio, curvyCoords[i * 6 + 2] * tileRatio);
            var p3 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 5] * tileRatio, curvyCoords[i * 6 + 4] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
        }

        return mask;
    }

    var hitOptions = {
        segments: true,
        stroke: true,
        fill: true,
        tolerance: 5
    };

    function getTileRaster(sourceRaster, size, offset) {
        var targetRaster = new Raster('empty');
        var tileWithMarginWidth = size.width + instance.tileMarginWidth * 2;
        var data = sourceRaster.getData(new Rectangle(
            offset.x - instance.tileMarginWidth,
            offset.y - instance.tileMarginWidth,
            tileWithMarginWidth,
            tileWithMarginWidth));
        targetRaster.setData(data, new Point(0, 0))
        targetRaster.position = new Point(28, 36);
        return targetRaster;
    }

    this.pickGroup = function () {
        if (instance.selectedTile) {

            console.log('Group');
            console.log('@ ' + instance.selectedTileIndex);

            var tile = instance.tiles[instance.selectedTileIndex];// the selected tile
            instance.selectedTiles.push(instance.selectedTileIndex);

            // highlight the grouped tiles in some way
            tile._style.strokeColor = "yellow";
            // instance.selectedTile.opacity = .5;

            // instance.selectedTile.cellPosition = undefined;
            // instance.selectedTile.position = new Point(0, 0);     
            // if (instance.selectedTilesGroup == undefined || instance.selectedTilesGroup == null) {
            instance.selectedTilesGroup = new Group(instance.tiles[instance.selectedTileIndex]);
            for (var i = 0; i < instance.selectedTiles.length; i++) {
                instance.selectedTilesGroup.addChild(instance.tiles[instance.selectedTiles[i]]);
            }
            // instance.selectedTile.cellPosition = undefined;
            // instance.selectedTile.position = new Point(0, 0);
            console.log('Grouped : ' + instance.selectedTilesGroup.children.length);
            // console.log(instance.selectedTilesGroup.children);
            // for (var i = 0; i < instance.selectedGroup.children.length; i++) {
            //     console.log(instance.selectedGroup.children[i]);
            // }
        }
    }

    this.pickTile = function () {
        if (instance.selectedTile) {
            if (!instance.selectedTile.lastScale) {
                instance.selectedTile.lastScale = instance.zoomScaleOnDrag;
                instance.selectedTile.scale(instance.selectedTile.lastScale);
            } else {
                if (instance.selectedTile.lastScale > 1) {
                    instance.releaseTile();
                    return;
                }
            }
            // whether the tile is moved or just selected
            instance.selectedTile.moved = false;
            instance.selectedTile._style.strokeColor = "red";
            // get all linked tiles and group them together
            var cellPosition = instance.selectedTile.cellPosition;

            console.log('Single');
            instance.selectedGroup = new Group(instance.selectedTile);

            instance.selectedTile.cellPosition = undefined;
            var pos = new Point(instance.selectedTile.position.x, instance.selectedTile.position.y);
            // the index of the selected tile
            console.log('@ ' + instance.selectedTileIndex);
            instance.selectedGroup.position = pos;
        }
    }

    this.showRecommendTiles = function () {
        if (instance.selectedTile) {
            showHints(instance.selectedTile, 4);
        }
    }

    this.releaseTile = function () {
        console.log('Release');
        if (instance.selectedTile) {
            // the release position
            var cellPosition = new Point(
                Math.round(instance.selectedGroup.position.x / instance.tileWidth),
                Math.round(instance.selectedGroup.position.y / instance.tileWidth));

            var roundPosition = cellPosition * instance.tileWidth;

            var hasConflict = false;
            var aroundTiles = new Array();

            // get the tile already placed in the currenct position
            var alreadyPlacedTile = getTileAtCellPosition(cellPosition);

            hasConflict = alreadyPlacedTile;

            var topTile = getTileAtCellPosition(cellPosition + new Point(0, -1));
            var rightTile = getTileAtCellPosition(cellPosition + new Point(1, 0));
            var bottomTile = getTileAtCellPosition(cellPosition + new Point(0, 1));
            var leftTile = getTileAtCellPosition(cellPosition + new Point(-1, 0));

            // check if tiles around(if exists) fit in the tab( for curved tile puzzle )
            // if there exists the top tile
            // position means that: start from the selected tile, walk one step in the direction
            if (topTile) {
                // hasConflict = hasConflict || !(topTile.shape.bottomTab + instance.selectedTile.shape.topTab == 0);
                aroundTiles.push({
                    tile: topTile,
                    direction: 'T'
                });
            }

            if (bottomTile) {
                // hasConflict = hasConflict || !(bottomTile.shape.topTab + instance.selectedTile.shape.bottomTab == 0);
                aroundTiles.push({
                    tile: bottomTile,
                    direction: 'B'
                });
            }

            if (rightTile) {
                // hasConflict = hasConflict || !(rightTile.shape.leftTab + instance.selectedTile.shape.rightTab == 0);
                aroundTiles.push({
                    tile: rightTile,
                    direction: 'R'
                });
            }

            if (leftTile) {
                // hasConflict = hasConflict || !(leftTile.shape.rightTab + instance.selectedTile.shape.leftTab == 0);
                aroundTiles.push({
                    tile: leftTile,
                    direction: 'L'
                });
            }


            // current no tile&&4 sides no conficts, a successful release
            // fitted(has tiles around it)
            if (!hasConflict) {
                // if the released tile has tiles around but no conflict
                if (aroundTiles.length > 0) {
                    // release and combine
                    if (instance.selectedTile.moved) {
                        updateLinks(instance.selectedTileIndex, aroundTiles);
                    }
                } else if (aroundTiles.length === 0) {
                    // isolated
                    if (instance.selectedTile.moved) {
                        removeLinks(instance.selectedTileIndex);// to be done
                        // meaning that all around links are removed 
                        console.log(instance.selectedTileIndex + '-= 0');
                    }
                }

                // every pick and release is counted as one step
                // real time update the step counter
                instance.steps += 1;
                document.getElementById("steps").innerText = instance.steps;

                if (instance.selectedTile.lastScale) {
                    instance.selectedTile.scale(1 / instance.selectedTile.lastScale);
                    instance.selectedTile.lastScale = undefined;
                }

                instance.selectedGroup.remove();

                var tile = instance.tiles[instance.selectedTileIndex];
                tile.position = roundPosition;
                tile.cellPosition = cellPosition;
                instance.selectedGroup.remove();
                project.activeLayer.addChild(tile);

                instance.selectedTile = instance.selectedGroup = null;
                // check num of errors every release
                var errors = checkTiles();

                if (errors == 0) {
                    alert('Congratulations!!!');
                }
            } else {
                // hasConflict = alreadyPlacedTile
                // if the cell already has tile in it, just switch the 2 tiles
                console.log('conflict');
                var tile = instance.tiles[instance.selectedTileIndex];

                alreadyPlacedTile.position = instance.selectedTile.position;
                alreadyPlacedTile.cellPosition = instance.selectedTile.position / instance.tileWidth;

                tile.cellPosition = cellPosition;
                tile.position = roundPosition;

                instance.selectedGroup.remove();
                instance.selectedTile = instance.selectedGroup = null;
                project.activeLayer.addChild(tile);
            }
        }

    }


    function getTileAtCellPosition(point) {
        //var width = instance.tilesPerRow;
        //var height = instance.tilesPerColumn;
        var tile = undefined;
        for (var i = 0; i < instance.tiles.length; i++) {
            if (instance.tiles[i].cellPosition == point) {
                tile = instance.tiles[i];
                break;
            }
        }
        return tile;
    }

    /**
     * Not called
     * @param {*} tile 
     */
    function getAroundTiles(tile) {
        var aroundTiles = [];
        var directions = [
            { 'T': new Point(0, -1) },
            { 'R': new Point(1, 0) },
            { 'B': new Point(0, 1) },
            { 'L': new Point(-1, 0) }
        ];
        for (var d in directions) {
            if (directions.hasOwnProperty(d)) {
                var t = getTileAtCellPosition(tile.cellPosition + directions[d]);
                if (t != undefined) {
                    aroundTiles.push({
                        d: t
                    });
                }
            }
        }
        return aroundTiles;
    }

    this.dragGroup = function (delta) {
        if (instance.selectedTilesGroup) {
            for (var i = 0; i < instance.selectedTilesGroup.children.length; i++) {
                var tile = instance.selectedTilesGroup.children[i];
                tile.position += delta;
                // tile.position+=tile.cellPosition * instance.tileWidth;
                // tile.cellPosition += Math.round(delta / instance.tileWidth);
            }
        }
    }

    this.dragTile = function (delta) {
        if (instance.selectedTile) {
            instance.selectedTile.moved = true;
            instance.selectedGroup.position += delta;
            instance.selectedTile.opacity = 1;
        } else {
            var currentScroll = view.currentScroll - delta * instance.currentZoom;
            view.scrollBy(currentScroll);
            view.currentScroll = currentScroll;
        }
    }

    this.mouseMove = function (point, delta) {
        if (!instance.selectedGroup) {
            // if not selected group, move the whole canvas
            project.activeLayer.selected = false;
            if (delta.x < 8 && delta.y < 8) {
                var tolerance = instance.tileWidth * .5;
                var hit = false;
                for (var index = 0; index < instance.tiles.length; index++) {
                    var tile = instance.tiles[index];
                    // [row, col] coordinate of the tile
                    var row = parseInt(index / config.tilesPerRow);
                    var col = index % config.tilesPerRow;

                    var tileCenter = tile.position;

                    var deltaPoint = tileCenter - point;
                    hit = (deltaPoint.x * deltaPoint.x +
                        deltaPoint.y * deltaPoint.y) < tolerance * tolerance;

                    if (hit) {
                        instance.selectedTile = tile;
                        instance.selectedTileIndex = index;
                        tile.opacity = .5;
                        project.activeLayer.addChild(tile);
                        return;
                    } else {
                        tile.opacity = 1;
                    }
                }
                if (!hit)
                    instance.selectedTile = null;
            }
        } else {
            instance.dragTile(delta);
        }
    }

    this.zoom = function (zoomDelta) {
        var newZoom = instance.currentZoom + zoomDelta;
        if (newZoom >= 0.3 && newZoom <= 1) {
            view.zoom =
                instance.currentZoom = newZoom;
        }
    }

    /**
     * Only checks the global errors, local 
     */
    function checkTiles() {
        var errors = 0;
        var firstTile = instance.tiles[0];
        var firstCellPosition = firstTile.cellPosition;

        for (var y = 0; y < instance.tilesPerColumn; y++) {
            for (var x = 0; x < instance.tilesPerRow; x++) {
                var index = y * instance.tilesPerRow + x;
                var cellPosition = instance.tiles[index].cellPosition;

                if (cellPosition != firstCellPosition + new Point(x, y)) {
                    errors++;
                }
            }
        }
        return errors;
    }



    /**
     * Move the recommended tiles into the hint box, and move them back when the user "focus" on another tile
     * Called in recommendTiles() then()
     * @param {*} selectedTile
     * @param {*} n 
     */
    function showHints(selectedTile, n) {
        var selectedTileIndex = selectedTile.findex;
        getHints(selectedTileIndex, n).then(function (hintTiles) {
            var once = {
                'T': false,
                'R': false,
                'B': false,
                'L': false
            };
            // from the highest score to the lowest score
            for (var i = hintTiles.length - 1; i >= 0; i--) {
                var tile = instance.tiles[Number(hintTiles[i].index)];
                var direction = hintTiles[i].direction;
                var selectedCellPosition = instance.tiles[selectedTileIndex].cellPosition;
                var newCellPosition = undefined;
                if (direction != undefined && !once[direction]) {
                    switch (direction) {
                        case 'T':
                            newCellPosition = selectedCellPosition + new Point(0, -1);
                            break;
                        case 'R':
                            newCellPosition = selectedCellPosition + new Point(1, 0);
                            break;
                        case 'B':
                            newCellPosition = selectedCellPosition + new Point(0, 1);
                            break;
                        case 'L':
                            newCellPosition = selectedCellPosition + new Point(-1, 0);
                            break;
                        default:
                            break;
                    }
                    once[direction] = true;
                    // only combine the empty cell around the selected one
                    if (newCellPosition != undefined && getTileAtCellPosition(newCellPosition) == undefined) {
                        tile.animate({
                            properties: {
                                position: {
                                    x: (newCellPosition * instance.tileWidth).x,
                                    y: (newCellPosition * instance.tileWidth).y
                                },
                            },
                            settings: {
                                duration: 1000
                            }
                        });
                        // update the tile position after the animation
                        setTimeout(function () {
                            if (newCellPosition != undefined) {
                                tile.cellPosition = newCellPosition;
                                tile.position = newCellPosition * instance.tileWidth;

                            }
                        }, 1000);
                    }
                }
            }
        }).catch(function () {
            console.log('No recommendations.');
        });
    }
}