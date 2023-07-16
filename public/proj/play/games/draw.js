function DrawGame(){
  this.didInit = false;
  this.init = function(){
    this.userDraw = createGraphics(windowWidth, windowHeight)
    this.myDraw = createGraphics(windowWidth, windowHeight)
    this.didInit = true;
    console.log("Init Draw")
  }
  
  this.drawMap = new Map(); //Map username to point array
  this.userDraw;
  this.myDraw;
  this.handle = function(key, data){
    //don't re-draw own drawing
    if(key != "draw"){ return; }
    if(data.user === UserName){ return; }
    //get unique rgb color from username
    fill(data.user.getHashCode().getHSBColor());
    
    if(data.doReset){ //Reset certain user
      console.log("Clearing data from user: " + data.user);
      
      this.drawMap[data.user] = [];
      this.renderUserDraw();
      return;
    }
    //Map server coords (4000x4000) to local screen
    var nx = map(data.x, 0,4000,0,width);
    var ny = map(data.y, 0,4000,0,height);
    
    if(this.drawMap[data.user] == undefined){
      this.drawMap[data.user] = [];
    }
    this.drawMap[data.user].push( {x: nx, y: ny} );
    
    this.userDraw.noStroke();
    this.userDraw.fill(data.user.getHashCode().getHSBColor());
    this.userDraw.ellipse(nx, ny, 15)
  }
  
  this.drawPoint = function(data){
    //draw to local frambuffer
    this.myDraw.noStroke();
    this.myDraw.colorMode(RGB)
    this.myDraw.fill(255,255,255);
    this.myDraw.ellipse(data.x, data.y, 15)
    
    //send data to server
    var nx = map(data.x,0,width,0,4000); //map range to 4k to make sure it appears in same place on all computers
    var ny = map(data.y,0,height,0,4000);
    var ndata = {x: nx, y: ny};
    socket.send(JSON.stringify({key: "draw", content: ndata}))
  }
  
  this.mousePressed = function(x,y){
    this.drawPoint({x:x,y:y})
  }
  this.mouseDragged = function(x,y){
    this.drawPoint({x:x,y:y})
  }
  this.keyPressed = function(key){
    switch (key) {
      case  67: //if "c" pressed clear own drawing
        this.myDraw.clear();
        //Signal server to clear other users data of this user's drawing
        var data = {doReset: true};
        send("draw", data);
        break;
      case 82: //if "r" pressed clear other drawings
        this.userDraw.clear();
        break;
    }
  }
  this.windowResized = function(){
    var userDrawOld = this.userDraw;
    var myDrawOld = this.myDraw;
    this.userDraw = createGraphics(windowWidth, windowHeight);
    this.myDraw = createGraphics(windowWidth, windowHeight);
    this.userDraw.image(userDrawOld, 0,0);
    this.myDraw.image(myDrawOld, 0,0);
  }
  this.draw = function(){ //called my main draw function to draw internal canvases
    background(51);
    image(this.userDraw, 0,0);
    image(this.myDraw, 0,0);
  }
  
  //Render user canvas from this.drawMap
  this.renderUserDraw = function(){
    this.userDraw.clear();
    this.userDraw.noStroke();
    for(const [usr, arr] of this.drawMap.entries()){
      this.userDraw.fill(usr.getHashCode().getHSBColor());
      for(var i=0;i<arr.length;i++){
        this.userDraw.ellipse(arr[i].x, arr[i].x, 15);
      }
    }
  }
}
String.prototype.getHashCode = function() {
    var hash = 0;
    if (this.length == 0) return hash;
    for (var i = 0; i < this.length; i++) {
        hash = this.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
Number.prototype.getHSBColor = function(){
  randHue = abs(this)%255;
  colorMode(HSB)
  var hsbCol = color(randHue, 255,255);
  colorMode(RGB)
  return color(red(hsbCol), green(hsbCol), blue(hsbCol));
}