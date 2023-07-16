function CubeshooterGame(){
  this.didInit = false;
  this.init = function(){
    this.canvas = createGraphics(windowWidth, windowHeight);
    this.didInit = true;
    this.send(); //send spawning position
    console.log("Init CubeShooter")
  }
  
  this.userMap = new Map();
  this.canvas; //Canvas
  this.handle = function(key, data){
    //Handle data from server
    if(key != "cubeshooter"){ return; }
    if(data.user === UserName){ return; }
    console.log("Inc:", data);
    //console.log(data);
    this.userMap.set(data.user, data)
  }
  this.send = function(){
    //Send data to server
    console.log(this.pos);
    socket.send(JSON.stringify({key: "cubeshooter", content: this.pos}))
  }
  
  this.mousePressed = function(x,y){
    
  }
  this.mouseDragged = function(x,y){
    
  }
  this.keyPressed = function(key){
    
  }
  this.windowResized = function(){
    var canvasOld = this.canvas;
    this.canvas = createGraphics(windowWidth, windowHeight);
    this.canvas.image(canvasOld, 0,0);
  }
  this.pos = {x: 600, y:200};
  this.draw = function(){ //called my main draw function to draw internal canvases
    background(51);
    noStroke();
    
    for(const [key, value] of this.userMap.entries()){
      console.log("Draw: ", value);
      fill(value.user.getHashCode().getHSBColor());
      ellipse(value.x, value.y, 50);
    }
    fill(255);
    ellipse(this.pos.x,this.pos.y,50);
    
    var posChange = false;
    if(keyIsDown(UP_ARROW)){this.pos.y -= 10; posChange = true; }
    if(keyIsDown(DOWN_ARROW)){this.pos.y += 10; posChange = true; }
    if(keyIsDown(LEFT_ARROW)){this.pos.x -= 10; posChange = true; }
    if(keyIsDown(RIGHT_ARROW)){this.pos.x += 10; posChange = true; }
    if(posChange){ this.send(); }
    //image(this.canvas, 0,0);
  }
}