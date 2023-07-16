function ExampleGame(){
  this.didInit = false;
  this.init = function(){
    this.didInit = true;
    console.log("Init ExampleGame")
  }
  
  this.userData = {};
  this.userMap = new Map();
  this.handle = function(key, data){
    if(key != "example"){ return; } //checks
    if(data.user === UserName){ return; }
    
    
  }
  this.send = function(){
    //Send data to server
    socket.send(JSON.stringify({key: "example", content: this.data))
  }
  
  this.mousePressed = function(x,y){
    
  }
  this.mouseDragged = function(x,y){
    
  }
  this.keyPressed = function(key){
    
  }
  this.windowResized = function(){
    
  }
  this.draw = function(){ //called my main draw function to draw internal canvases
    background(51);
    noStroke();
  }
}