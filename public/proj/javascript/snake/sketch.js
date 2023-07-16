//var s2 = new snake2();
var s = new snake();
var scl = 20;
var TailCutSound;
var EatSound;
var cnv;
var dospeed = 9;
var TimePassed;
var Delays =  []
var FoodPos = []
var FoodDelays = [];

function setup() {
  cnv=createCanvas(600,600);
  cnv.parent("sketch-holder");
  frameRate(dospeed);
  //TailCutSound = loadSound("sound/TailCutSound.mp3");
  EatSound = loadSound("sound/EatSound.mp3");
  food();
}

function draw() {
  TimePassed = round(millis()/1000);
  frameRate(dospeed + (s.slen/3));
  background(51);
  s.death();
  s.update();
  s.show();
  //s2.death();
  //s2.update();

  //draw food
  for(i=0; i <= FoodPos.length; i++){
    if(FoodPos[i] !== undefined){
      fill(200,100,50)
      rect(FoodPos[i].x,FoodPos[i].y,scl,scl)
      //print(FoodPos[i].x + ", " + FoodPos[i].y);
      if(s.ate(FoodPos[i])){
        food()
        FoodPos.splice(0,1);
        if(!EatSound.isPlaying()){
          EatSound.play()
        }
      }
    }
  }
  /*
  colorMode(HSB);
  fill(s.rainbowHue,255,255);
  rect(Rbowpos.x,Rbowpos.y,scl,scl);
  colorMode(RGB)
  */
}
function keyPressed(){
  //print(keyCode);
  //rainbows
  if(keyCode === 219){
    s.rainbow = true;
  }else if(keyCode === 221){
    s.rainbow = false;
  }

  if(keyCode === UP_ARROW && (s.yspeed != 1 || s.slen <= 1 )){
    s.dir(0,-1);
  }else if(keyCode === DOWN_ARROW && (s.yspeed != -1 || s.slen <= 1 )){
    s.dir(0,1);
  }else if(keyCode === RIGHT_ARROW && (s.xspeed != -1 || s.slen <= 1 )){
    s.dir(1,0);
  }else if(keyCode === LEFT_ARROW && (s.xspeed != 1 || s.slen <= 1 )){
    s.dir(-1,0);
  }//else if(keyCode===81){s.slen+=10}
}
//spawn food
function food(){
  var FoodToCalc = 1
  if(s.slen%10 === 0){
    FoodToCalc++;
    print("Level UP")
  }

  for(i=0; i < FoodToCalc; i++){
    var cols = floor(width/scl);
    var rows = floor(height/scl);
    var gen = createVector(floor(random(cols)),floor(random(rows))).mult(scl);
    if(FoodPos.length !== 0){
      for(j=0; j<FoodPos.length; j++){
        if(gen.x === FoodPos[j].x && gen.y === FoodPos[j]){
          print("gen overlap found");
          return;
        }
      }
    }
    append(FoodPos, gen);
    print("gen is safe");
    print(FoodPos.length)
  }
}
function DelaySet(time){
  append(Delays, TimePassed+time);
  var id = Delays.length-1
  return id
}
function DelayCheck(id){
  if(TimePassed >= Delays[id]){
    return true
  }else{
    return false
  }
}

//ignore arrow key scrolling
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false)
