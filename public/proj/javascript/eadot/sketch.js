var dots = [];

var curSize = 15;
var assistMode = false;
function setup(){
  var cnv = createCanvas(600,600);
  cnv.parent("canvas-creator");
  
  for(var i=0;i<30;i++){
    dots.push(new eadot());
    dots[i].init(curSize);
  }
  noStroke();
  textSize(100);
  document.querySelector("canvas").onmouseout = function(){
    isPaused = true;
  }
}
var isPaused = false;
function draw(){
  if(isPaused){
    noLoop();
    var pausedText = "Game is paused, Click to resume";
    textSize(20);
    var tw = textWidth(pausedText);
    fill(0);
    text(pausedText, width/2-tw/2, height/2);
    return;
  }
  
  background(50);
  for(var i=0;i<dots.length;i++){
    dots[i].update();
    dots[i].draw();
    if(dots[i].isDead){
      dots[i].init(curSize);
    }
    if(collideCircleCircle(mouseX, mouseY, curSize, dots[i].X, dots[i].Y, dots[i].rad)){
      if(dots[i].rad < curSize+1){ //little margin (because its hard to tell sometimes)
        dots[i].isDead = true;
        curSize++;
      }else{
        curSize = 15;
        for(var i=0;i<dots.length;i++){
          dots[i].init(curSize);
        }
        break;
      }
    }
  }
  fill(255);
  ellipse(mouseX, mouseY, curSize);
  fill(0)
  textSize(100);
  text(str(curSize-15),0,75);
}
function mousePressed(){
  isPaused = false;
  loop();
}
function keyPressed(){
  if(keyCode == 65){ //a key pressed
    assistMode = !assistMode;
  }
}

var minVel = 0.5;
var maxVel = 2;

//chance (percentage), from, to, dependent on size?
sizeProbablilityIndex = [
  {chance:20, from:10, to:20, dep:false},
  {chance:40, from:-5, to:10, dep:true},
  {chance:20, from:30, to:100, dep:true},
  {chance:20, from:50, to:100, dep:false}
] //make sure sum of chance = 100
function eadot(){
  this.X = 0;
  this.Y = 0;
  this.color;
  this.vX = 0;
  this.vY = 0;
  this.rad = 5;
  this.isDead = false;
  this.init = function(midSize){
    this.isDead = false;
    
    //This code goes through sizeProbablilityIndex and sets circle radius
    //To make sure 
    hundoRand = random(1,100);
    curRandPtr = 0;
    for(var j=0;j<sizeProbablilityIndex.length;j++){
      curRandPtr += sizeProbablilityIndex[j].chance;
      if(hundoRand < curRandPtr){
        if(sizeProbablilityIndex[j].dep){
          this.rad = round(random(sizeProbablilityIndex[j].from + midSize, sizeProbablilityIndex[j].to + midSize));
        }else{
          this.rad = round(random(sizeProbablilityIndex[j].from, sizeProbablilityIndex[j].to));
        }
        break;
      }
    }    
    if(rrand(1,3) != 3){
      this.rad = round(random(midSize-5, midSize+10));
    }else{
      this.rad = round(midSize+50, midSize+100);
    }
    this.color = random(1,360).getHSBColor();
    var range = round(random(0,width));
    if(bitRand()){ //random along X or Y axis?
      this.X = range;
      this.vX = random(minVel,maxVel) * (bitRand() ? 1 : -1)
      if(bitRand()){ //Which side of Y axis start dot on?
        this.Y = -this.rad*2;
        this.vY = random(minVel,maxVel);
      }else{
        this.Y = height + this.rad*2;
        this.vY = -random(minVel,maxVel);
      }
    }else{
      this.Y = range;
      this.vY = random(minVel,maxVel) * (bitRand() ? 1 : -1)
      if(bitRand()){ //Which side of X axis to start dot on?
        this.X = -this.rad*2;
        this.vX = random(minVel,maxVel);
      }else{
        this.X = width + this.rad*2;
        this.vX = -random(minVel,maxVel);
      }
    }
  }
  this.update = function(){
    if(this.isDead){ return; }
    this.X += this.vX;
    this.Y += this.vY;
    var margin = 20;
    if(-(this.rad*2)-margin > this.X | this.X > width + this.rad*2 + margin){
      this.isDead = true;
    }
    if(-(this.rad*2)-margin > this.Y | this.Y > width + this.rad*2 + margin){
      this.isDead = true;
    }
  }
  this.draw = function(){
    fill(this.color);
    if(this.rad < curSize && assistMode){
      fill(0);
    }
    ellipse(this.X, this.Y, this.rad);
  }
}

function bitRand(){
  if(round(random(0,1)) == 0){
    return true;
  }else{
    return false;
  }
}
function rrand(min, max){
  return round(random(min,max));
}
Number.prototype.getHSBColor = function(){
  randHue = abs(this)%255;
  colorMode(HSB)
  var hsbCol = color(randHue, 255,255);
  colorMode(RGB)
  return color(red(hsbCol), green(hsbCol), blue(hsbCol));
}