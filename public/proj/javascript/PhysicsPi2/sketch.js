

var small;
var large;

var digits = 5;
function setup() {
  createCanvas(1000,500);
  initBlocks(digits)
}
var supKE;
function initBlocks(igits){
  print("Digits of Pi: " + digits);
  if(digits == 1){ eulerStep = 1; }
  else{ eulerStep = pow(10,digits-1); }
  small = new Bouncer(100, 0, 1, 20);
  large = new Bouncer(300, -5, pow(100, digits-1), 100);
  supKE = small.calcKE() + large.calcKE();
}

var doLoop = true;
var prevPiCount = "N/A";
var piCounter = 0;
var doCount = true;

function draw() {
  background(200);
  var steps = small.getRecommendedStepVal(eulerStep, large, 0, large.pos + large.size);
  
  for(var i=0;i<steps;i++){
    //print(i + "/" + steps);
    var doBreak = true;
    if(small.collideBlock(large) && doCount){
      doBreak = false;
      piCounter++;
    }
    
    if(large.collideBlock(small)){
      doBreak = false;
    }
    
    //collide from left wall to far edge of big block
    if(small.collideRange(0,large.pos + large.size) && doCount){
      //doBreak = false;
      piCounter++;
    }
    
    //Detect if collision next frame
    if(small.detCollideBlock(large) || large.detCollideBlock(small) || small.detCollideRange(0,large.pos + large.size)){
      doBreak = false;
    }
    
    
    if(large.vel.toNumber() >= small.vel.toNumber() && large.vel.toNumber() > 0 && small.vel.toNumber() >= 0){
      if( large.pos + large.size > width ){
        large.vel = large.vel.neg();
        
        storePi(piCounter);
        piCounter = 0;
        small.vel = small.vel.mul(0);
      }
      small.vel = small.vel.div(1.01);
      large.vel = large.vel.round();
    }
    
    if(doBreak){
      print("Breaking");
      small.update(1);
      large.update(1);
      break;
    }else{
      small.update(steps);
      large.update(steps);
    }
  }
  fill(120,50,240);
  small.show();
  large.show();
  
  fill(0);
  textSize(100);
  textAlign(CENTER);
  text(piCounter, width/2, height/2);
  textSize(25);
  text(prevPiCount, width/2, height/2 - 90);
  
  textSize(11);
  textAlign(LEFT, CENTER);
  text("Small Pos: "+round(small.pos)+" Vel: "+round(small.vel.toNumber()), 10,10);
  text("Large Pos: "+round(large.pos)+" Vel: "+round(large.vel.toNumber()), 10,21);
  
  var allKE = small.calcKE() + large.calcKE();
  text("KE (number that should be constant): " + allKE, 10,35);
  if(allKE != supKE && !(large.vel.toNumber() >= small.vel.toNumber() && large.vel.toNumber() > 0 && small.vel.toNumber() >= 0) ){
    print("KE: "+allKE+" != " + supKE);
  }
}

function keyPressed(){
  if(49 <= keyCode && keyCode <= 57){
    piCounter = 0;
    doCount = true;
    digits = keyCode-48;
    initBlocks(digits);
  }
  if(keyCode == 32){
    if(doLoop){ doLoop = false; redraw(); noLoop(); }
    else{ loop(); doLoop = true; }
  }
}
function mousePressed(){
  if(!doLoop){
    redraw();
  }
}
function storePi(piapprox){
  prevPiCount = str(piapprox);
  prevPiCount = prevPiCount.substring(0, 1) + "." + prevPiCount.substring(1, prevPiCount.length);
}