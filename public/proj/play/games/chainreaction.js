function ChainReactionGame(){
  this.didInit = false;
  this.init = function(){
    this.didInit = true;
    this.canvas = createGraphics(windowHeight-40,windowHeight-40);
    this.genBoard(4,4); //generate default board (will be overwritten when init comes through)
    send("chainreaction-init", undefined);
    console.log("Init ChainReaction Game")
  }
  this.genBoard = function(sizex, sizey){
    //Fancy array init method
    this.board = Array.from(Array(sizey), _ => Array(sizex).fill(0));
    //set board
    for(var y=0;y<sizey;y++){
      for(var x=0;x<sizex;x++){
        maxVal = 4;
        if(x == sizex-1){ maxVal--; }
        else if (x == 0){ maxVal--; }
        if(y == sizey-1){ maxVal--; }
        else if (y == 0){ maxVal--; }
        
        this.board[y][x] = {
          num: 0,
          max: maxVal,
          player: "",
          didExplodeThisTurn: false
        }
      }
    }
    this.render(this.canvas);
  }
  this.sqSize = 0;
  this.render = function(renderCanvas){
    if(renderCanvas == undefined){ return; }
    this.sqSize = renderCanvas.width / this.board.length;
    var sqMargin = this.sqSize/50;
    renderCanvas.clear();
    renderCanvas.textAlign(CENTER, CENTER);
    renderCanvas.noStroke();
    renderCanvas.textSize(this.sqSize/2);
    
    var isStillExploding = false;
    for(var y=0;y<this.board.length;y++){
      for(var x=0;x<this.board[y].length;x++){
        var ref = this.board[y][x];
        
        var pcol;
        if(ref.player != ""){
          pcol = ref.player.getHashCode().getHSBColor();
        }else{
          pcol = color(200);
        }
        
        if(this.sqSelected.x == x && this.sqSelected.y == y){
          pcol._array[3] = 0.7; //set alpha to 70%
        }
        renderCanvas.fill(pcol);
        
        renderCanvas.rect(x*this.sqSize+sqMargin, y*this.sqSize+sqMargin, this.sqSize-sqMargin*2, this.sqSize-sqMargin*2);
        
        if(ref.num == ref.max-1){
          renderCanvas.fill(255);
        }else{
          renderCanvas.fill(0);
        }
        var drawTxt
        if(ref.num >= ref.max){
          drawTxt = "💣"
        }else{ drawTxt = ref.num.toString(); }
        renderCanvas.text(drawTxt, x*this.sqSize+this.sqSize/2, y*this.sqSize+this.sqSize/2);
      }
    }
  }
  this.addSquare = function(x, y, user){
    if(this.board[y] === undefined){ return; } //is y index in board
    else if(this.board[y][x] === undefined){ return; } //is x index in board
    var ref = this.board[y][x];
    
    //if first move
    if(!this.isExploding && user == UserName){
      if(gameSettings.players[this.playerIndexs[0]] != user){ return; }
      if(ref.player != "" && ref.player != user){ return; }
      send("chainreaction", {x:x, y:y}); //send play coords to server if non-exploding addition
    }
    
    this.board[y][x].num += 1;
    this.board[y][x].player = user;
    if(this.board[y][x].num >= this.board[y][x].max){
      this.board[y][x].didExplodeThisTurn = true;
      this.isExploding = true;
    }
  }
  this.isExploding = false;
  this.doExplodeCycle = function(){
    var bcopy = JSON.parse(JSON.stringify(this.board)); //copy array so that addSquare function doesn't mess up explode detection
    //console.log("Explode Cycle, copy: ", bcopy);
    var endGame = true;
    for(var y=0;y<bcopy.length;y++){
      for(var x=0;x<bcopy[y].length;x++){
        var ref = this.board[y][x];
        if(!ref.didExplodeThisTurn){ endGame = false; }
        if(bcopy[y][x].num >= bcopy[y][x].max){
          ref.num -= ref.max;
          this.addSquare(x+1, y, bcopy[y][x].player);
          this.addSquare(x-1, y, bcopy[y][x].player);
          this.addSquare(x, y+1, bcopy[y][x].player);
          this.addSquare(x, y-1, bcopy[y][x].player);
          if(ref.num == 0){
            ref.player = "";
          }
        }
      }
    }
    
    //Check if still exploding
    isStillExploding = false;
    for(var y=0;y<this.board.length;y++){
      for(var x=0;x<this.board[y].length;x++){
        if(this.board[y][x].num >= this.board[y][x].max){
          isStillExploding = true;
        }
      }
    }
    this.isExploding = isStillExploding;
    if(endGame){
      this.isExploding = false;
    }
    
    this.render(this.canvas);
  }
  
  this.board;
  this.storedBoard;
  this.playerIndexs = []; //get list of indexs for gameSettings.players
  this.handle = function(key, data){
    //console.log("Inc:", data);
    if(key == "chainreaction-init"){
      this.players = data;
    }else if(key == "chainreaction-move"){
      if(data.User != UserName){
        //print("Recieved Move", data);
        this.addSquare(data.X, data.Y, data.User);
      }
    }else if(key == "chainreaction"){
      this.storedBoard = data;
    }else if(key == "chainreaction-playerlist"){
      this.playerIndexs = data;
    }
  }
  
  this.sqSelected = {x:-1, y:-1}; //selected square obj
  this.mouseMoved = function(x,y){
    x -= width/2 - this.canvas.width/2;
    y -= 20;
    
    var selX = floor(x/this.sqSize);
    var selY = floor(y/this.sqSize);
    if(0 > selX | selX >= this.board[0].length | 0 > selY | selY >= this.board.length){ selX = -1; selY = -1; }
    if(this.sqSelected.x != selX | this.sqSelected.y != selY){
      this.sqSelected = {x:selX, y:selY};
      this.render(this.canvas);
    }
  }
  this.mouseReleased = function(x,y){
    if(!this.isExploding){
      this.addSquare(this.sqSelected.x, this.sqSelected.y, UserName);
      this.render(this.canvas);
    }
  }
  this.keyPressed = function(key){
    //console.log(key);
    switch (key) {
      case 69: //Key 'e' pressed
        this.doExplodeCycle();
        break;
      case 67: //Key 'c' pressed
        this.init();
        break;
    }
  }
  this.windowResized = function(){
    this.canvas = createGraphics(windowHeight-40,windowHeight-40);
    this.render(this.canvas);
  }
  this.drawCounter = 0;
  this.draw = function(){
    this.drawCounter++;
    if(this.drawCounter % 30 == 1){
      this.doExplodeCycle();
    }
    if(!this.isExploding && this.storedBoard != undefined){
      //print("Synced Board", this.isExploding);
      this.board = this.storedBoard;
      this.storedBoard = undefined;
      this.render(this.canvas);
    }
    background(51);
    noStroke();
    fill(255);
    image(this.canvas, width/2 - this.canvas.width/2, 20);
    
    stroke(255);
    strokeWeight(2)
    noFill();
    var boxWidth = 100;
    for(var i=0;i<this.playerIndexs.length;i++){
      curBoxWidth = textWidth( gameSettings.players[this.playerIndexs[i]] );
      if(curBoxWidth > boxWidth){
        boxWidth = curBoxWidth;
      }
    }
    for(var i=0;i<this.playerIndexs.length;i++){
      fill(gameSettings.players[this.playerIndexs[i]].getHashCode().getHSBColor());
      rect(width/2 + this.canvas.width/2 + 10, height/2 - (this.playerIndexs.length*40) + 40*i, boxWidth+20, 20, 40);
      fill(0);
      text(gameSettings.players[this.playerIndexs[i]], width/2 + this.canvas.width/2 + 20, height/2 - (this.playerIndexs.length*40) + 40*i + 13);
    }
  }
}