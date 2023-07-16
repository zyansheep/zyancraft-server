function setup() {
  createCanvas(600,600);
  
  genBoard();
  
  ball = new ball(300,height-60,10,2, 30);
  
  //print(gcd(5,6));
}
var genX = 10;
var genY = 5;
function genBoard(){
  blocks = [];
  var genHeight = 200;
  var genMargin = 3;
  var blockWid = width/genX;
  var blockHei = genHeight/genY;
  for(var y=0;y<genY;y++){
    colorMode(HSB)
    var col = color(map(y,0,genY,0,255), 255,255);
    for(var x=0;x<genX;x++){
      blocks.push( new block(x*blockWid+genMargin, y*blockHei+genMargin + 100, blockWid - 2*genMargin, blockHei - 2*genMargin, col))
    }
  }
  colorMode(RGB);
}

var paddleWidth = 200;
var paddleHeight = 20;
var paddleMargin = 20;

var highScore = 0;
var daScore = 0;
var lives = 5;
var wasDead = true;

function draw() {
  background(200);
  
  ball.doCollisionWall()
  ball.doCollisionPaddle(mouseX-paddleWidth/2, width-paddleHeight-paddleMargin, paddleWidth, paddleHeight+20);
  ball.doCollisionBlock(blocks);
  
  ball.update();
  noStroke()
  fill(255,0,255);
  ball.show();
  
  if(wasDead != ball.isDead && ball.isDead == true){
    lives--;
    if(lives <= 0){
      genX = 10;
      genY = 5;
      daScore = 0;
      lives = 5;
      genBoard();
    }
  }
  
  var isDone = true;
  for(var i=0;i<blocks.length;i++){
    if(blocks[i].show()){
      var isDone = false;
    }
  }
  if(isDone){
    genX++;
    genY++;
    genBoard()
  }
  
  fill(255);
  if(!ball.isDead){
    rect(mouseX-paddleWidth/2, width-paddleHeight-paddleMargin, paddleWidth, paddleHeight);
    wasDead = ball.isDead;
  }else{
    rect(width/2-paddleWidth/2, width-paddleHeight-paddleMargin, paddleWidth, paddleHeight);
    wasDead = ball.isDead;
    
    var angle = Math.atan2(mouseY - ball.y, mouseX - ball.x)
    ball.vy = 10 * sin(angle);
    ball.vx = 10 * cos(angle);
  }
  textSize(100);
  text(lives, 0,70);
  textSize(20);
  text("Score: " + daScore, width-100, 30);
  
  textSize(20);
  text("Highscore: " + highScore, width-138, 60);
}

function mousePressed(){
  if(ball.isDead){
    ball.isDead = false;
  }
  if(!isLoop){
    draw();
  }
}

var isLoop = true;
function keyPressed(){
  //print("Keypressed: ", keyCode);
  if( keyCode == 32 && UserIsLogged){
    if(isLoop){
      isLoop = false;
      noLoop();
    }else{
      isLoop = true;
      loop();
    }
  }
  /*if( keyCode == 82 ){
    genX = 10;
    genY = 5;
    genBoard();
  }*/
}

function block(x, y, w, h, col){
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.col = col;
  
  this.isPopped = false;
  
  this.show = function(){
    if(this.isPopped){ return false; }
    noStroke();
    fill(this.col)
    rect(x,y,w,h);
    return true;
  }
}