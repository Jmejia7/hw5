/*--
File: ScrabbleUI.js  
Other Files: index.html, style.css,  
Description:  
This project gameplay of one line for Scrabble using HTML, CSS, JavaScript, and jQuery UI.  
It allows users to drag-and-drop tiles onto a board, calculate scores based on letter values and special squares,  
and manage the tile rack through drawing, submitting, and resetting.  

Jorge Mejia, UMass Lowell Computer Science, jorge_mejia1@student.uml.edu  
Credits: https://jqueryui.com/ for drag/drop, https://jquery.com/ for DOM interaction  
Copyright (c) JM  
Updated by JM on July 4 2025  
--*/
        var  tileBag = [];
        var playerTiles = [];
        var boardState = Array(15).fill(null);
        var  currentScore = 0;

        
        function initializeTileBag() {
            tileBag = [];
            for (let letter in ScrabbleTiles) {
                let tile = ScrabbleTiles[letter];
                for (let i = 0; i < tile["original-distribution"]; i++) {
                    tileBag.push({
                        letter: letter,
                        value: tile.value
                    });
                }
            }
        }

        // Draw random tiles
        function drawTiles(count) {
            let tiles = [];
            for (let i = 0; i < count && tileBag.length > 0; i++) {
                let randomIndex = Math.floor(Math.random() * tileBag.length);
                tiles.push(tileBag.splice(randomIndex, 1)[0]);
            }
            return tiles;
        }

        // tile HTML of linking images and letter/values 
        function createTileElement(tileData, index) {
        
            return `
                <div class="tile" data-letter="${tileData.letter}" data-value="${tileData.value}" data-tile-id="${index}">
                    <div class="letter">${tileData.letter}</div>
                    <div class="value">${tileData.value}</div>
                    <img src = "images/Scrabble_Tiles/Scrabble_Tile_${tileData.letter}.jpg" class="tile-img">
                </div>
            `;
        }

        // Initialize drag and drop
        function initializeDragDrop() {
            $(".tile").draggable({
                revert: "invalid",
                containment: "document",
                helper: "clone",
                cursor: "move",
                start: function(event, ui) {
                    $(this).addClass("ui-draggable-dragging");
                },
                stop: function(event, ui) {
                    $(this).removeClass("ui-draggable-dragging");
                }
            });

            $(".board-square").droppable({
                accept: ".tile",
                hoverClass: "ui-droppable-hover",
                drop: function(event, ui) {
                    let square = $(this);
                    let tile = ui.draggable;
                    let position = parseInt(square.data("position"));
                    
                    // Check if square is already occupied
                    if (boardState[position] !== null) {
                        showMessage("Square already occupied!", "error");
                        return false;
                    }
                    
                    // Place tile on board
                    let letter = tile.data("letter");
                    let value = tile.data("value");
                    let tileId = tile.data("tile-id");
                    
                    boardState[position] = {
                        letter: letter,
                        value: value,
                        tileId: tileId
                    };
                    
                    // Update visual and create a css image tile of teh line when dropped incase image does not resize
                    square.html(`
                        <div class="placed-tile">
                            <div class="letter">${letter}</div>
                            <div class="value">${value}</div>
                        </div>
                    `);
                    
                    // Remove tile 
                    tile.remove();
                    
                    // Update word 
                    updateWordDisplay();
                }
            });
        }

        // Update word display
        function updateWordDisplay() {
            let word = "";
            let hasGaps = false;
            let firstLetter = -1;
            let lastLetter = -1;
            
            // Find word eers
            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] !== null) {
                    if (firstLetter === -1) firstLetter = i;
                    lastLetter = i;
                }
            }
            
            // Build word check for gaps
            if (firstLetter !== -1) {
                for (let i = firstLetter; i <= lastLetter; i++) {
                    if (boardState[i] !== null) {
                        word += boardState[i].letter;
                    } else {
                        hasGaps = true;
                        word += "_";
                    }
                }
            }
            
            $("#word-display").text(`Current Word: ${word}`);
            
            if (hasGaps && word.length > 1) {
                showMessage("Word has gaps! Please fill all spaces between letters.", "error");
            } else {
                clearMessage();
            }
        }

        // Calculate score
        function calculateScore() {
            let word = "";
            let letterScore = 0;
            let wordMultiplier = 1;
            let hasGaps = false;
            let firstLetter = -1;
            let lastLetter = -1;
            
            // Find word boundaries
            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] !== null) {
                    if (firstLetter === -1) firstLetter = i;
                    lastLetter = i;
                }
            }
            
            if (firstLetter === -1) {
                return { score: 0, word: "", valid: false, message: "No tiles placed on board!" };
            }
            
            // Calculate score
            for (let i = firstLetter; i <= lastLetter; i++) {
                if (boardState[i] !== null) {
                    word += boardState[i].letter;
                    let tileValue = boardState[i].value;
                    let square = $(`.board-square[data-position="${i}"]`);
                    
                    if (square.hasClass("double-letter")) {
                        tileValue *= 2;
                    } else if (square.hasClass("triple-letter")) {
                        tileValue *= 3;
                    }
                    
                    letterScore += tileValue;
                    
                    if (square.hasClass("double-word") || square.hasClass("center-star")) {
                        wordMultiplier *= 2;
                    } else if (square.hasClass("triple-word")) {
                        wordMultiplier *= 3;
                    }
                } else {
                    hasGaps = true;
                }
            }
            
            if (hasGaps) {
                return { score: 0, word: word, valid: false, message: "Word has gaps! Please fill all spaces between letters." };
            }
            
            if (word.length < 2) {
                return { score: 0, word: word, valid: false, message: "Word must be at least 2 letters long!" };
            }
            
            let totalScore = letterScore * wordMultiplier;
            return { score: totalScore, word: word, valid: true, message: `Great! "${word}" scores ${totalScore} points!` };
        }

        // Submit word
        function submitWord() {
            let result = calculateScore();
            
            if (result.valid) {
                currentScore += result.score;
                $("#score-text").text(`Score: ${currentScore}`);
                showMessage(result.message, "success");
                
                // remove droppable
                $(".board-square").each(function() {
                    let position = parseInt($(this).data("position"));
                    if (boardState[position] !== null) {
                        $(this).droppable("destroy");
                    }
                });
            } else {
                showMessage(result.message, "error");
            }
        }

        // Reset board
        function resetBoard() {
            // Return tiles 
            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] !== null) {
                    let tileData = boardState[i];
                    let tileHtml = createTileElement({
                        letter: tileData.letter,
                        value: tileData.value
                    }, tileData.tileId);
                    $("#tile-rack").append(tileHtml);
                }
            }
            
            // Clear board 
            boardState = Array(15).fill(null);
            
            // Clear board 
            $(".board-square").each(function() {
                let position = parseInt($(this).data("position"));
                $(this).html("");
                
                // Restore original content for special squares
                if ($(this).hasClass("double-word")) {
                    $(this).html("DOUBLE<br>WORD<br>SCORE");
                } else if ($(this).hasClass("double-letter")) {
                    $(this).html("DOUBLE<br>LETTER<br>SCORE");
                } else if ($(this).hasClass("triple-letter")) {
                    $(this).html("TRIPLE<br>LETTER<br>SCORE");
                } else if ($(this).hasClass("triple-word")) {
                    $(this).html("TRIPLE<br>WORD<br>SCORE");
                }
            });
            
            // Reinitialize drag and drop
            initializeDragDrop();
       
            updateWordDisplay();
            clearMessage();
        }

        // Deal new tiles
        function dealNewTiles() {
            $("#tile-rack").empty();
            playerTiles = drawTiles(7);
            
            playerTiles.forEach((tile, index) => {
                let tileHtml = createTileElement(tile, index);
                $("#tile-rack").append(tileHtml);
            });
            
            initializeDragDrop();
            clearMessage();
        }

        // Show message
        function showMessage(message, type) {
            let messageClass = type === "error" ? "error-message" : "success-message";
            $("#message-area").html(`<div class="${messageClass}">${message}</div>`);
        }

        // Clear message
        function clearMessage() {
            $("#message-area").html("");
        }

        // Initialize game and their events 
        $(document).ready(function() {
            initializeTileBag();
            dealNewTiles();
    $(".submit-btn").on("click", function () {
        submitWord();
    });

    $(".reset-btn").on("click", function () {
        resetBoard();
    });

    $(".deal-btn").on("click", function () {
        dealNewTiles();
    });
        });