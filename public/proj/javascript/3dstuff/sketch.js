movX = 0
movY = 0
blockSize = 20

function preload(){
  imgs = new images()
  imgs.load("sun.png")
  imgs.load("stone.jpg")
  imgs.load("dirt.png")
  imgs.load("error.png")
}
function setup() {
  createCanvas(windowWidth,windowHeight, WEBGL)
  
  mlock = new mouseLock()
  cam = new camview(createVector(0,-3*blockSize,0))
  overinfo = new overlay()
  w = new world()
  
  genRadius = 20
  genHeight = 3
  gridstart = createVector(round(cam.bpos.x-genRadius),round(cam.bpos.y-3),round(cam.bpos.z-genRadius))
  gridend = createVector(round(cam.bpos.x+genRadius),round(cam.bpos.y+2),round(cam.bpos.z+genRadius))
  w.genGrid(gridstart, gridend)
  
}
function draw(){
  background(135, 206, 250)
  //blendMode(MULTIPLY)
  cam.interface()
  overinfo.update()
  
  //pointLight(255,255,255,0,cam.pos.y-1500,0)
  
  //w.testbox()
  w.sun()
  w.base()
  //w.updateGrid(gridstart, gridend)
  w.drawGrid(gridstart, gridend)
}

function block(name){
  //where are other blocks and what are they [+x, -x, +y, -y, +z, -z]
  this.blockRelation = []
  this.isVisible = true;
  this.name = name
  this.texture = imgs.get(this.name)
  if(this.texture === undefined){
    this.texture = imgs.get("error")
  }
}
function world(){
  wself = this
  noStroke()
  this.testbox = function(){
    noStroke()
    push()
    normalMaterial()
    noStroke()
    translate(0,0,0)
    box(50,100,200);
    pop()
  }
  
  this.blocks = []
  this.worldgraphic;
  this.getBlock = function(xinc, yinc, zinc){
    if(wself.blocks[xinc] === undefined){
      return undefined
    }else if(wself.blocks[xinc][yinc] === undefined){
      return undefined
    }else if(wself.blocks[xinc][yinc][zinc] === undefined){
      return undefined
    }else{
      return wself.blocks[xinc][yinc][zinc]
    }
  }
  this.worldIter = function(startPos, endPos, code, xfunc, yfunc, zfunc){
    xfunc = xfunc || function(){};
    yfunc = yfunc || function(){};
    zfunc = zfunc || function(){};
    for(var xinc=startPos.x;xinc < endPos.x;xinc++){
      xfunc(xinc)
      for(var yinc = startPos.y;yinc < endPos.y;yinc++){
        yfunc(xinc, yinc)
        for(var zinc = startPos.z;zinc < endPos.z;zinc++){
          zfunc(xinc,yinc,zinc)
          code(xinc, yinc, zinc);
        }
      }
    }
  }
  this.genGrid = function(startPos, endPos){
    this.worldIter(startPos, endPos, function(xinc, yinc, zinc){
      var randomnum = round(random(-0.4,0.4));
      if(randomnum === 0){
        if(yinc == 1){
          wself.blocks[xinc][yinc][zinc] = new block("dirt");
        }else{
          wself.blocks[xinc][yinc][zinc] = new block("stone");
        }
      }
      
    },
    function(xinc){wself.blocks[xinc] = []},
    function(xinc,yinc){wself.blocks[xinc][yinc] = [];}
    );
    this.updateGrid(startPos, endPos)
    //this.renderGrid(startPos, endPos)
  }
  this.updateGrid = function(startPos, endPos){
    this.worldIter(startPos, endPos, function(xinc, yinc, zinc){
      curBlock = wself.getBlock(xinc,yinc,zinc)
      if(curBlock !== undefined){
        curBlock.blockRelation[0] = wself.getBlock(xinc+1,yinc,zinc);
        curBlock.blockRelation[1] = wself.getBlock(xinc-1,yinc,zinc);
        curBlock.blockRelation[2] = wself.getBlock(xinc,yinc+1,zinc);
        curBlock.blockRelation[3] = wself.getBlock(xinc,yinc-1,zinc);
        curBlock.blockRelation[4] = wself.getBlock(xinc,yinc,zinc+1);
        curBlock.blockRelation[5] = wself.getBlock(xinc,yinc,zinc-1);
        curBlock.isVisible = false;
        for(var i=0;i<curBlock.blockRelation.length;i++){
          if(curBlock.blockRelation[i] === undefined){
            curBlock.isVisible = true;
          }
        }
        wself.blocks[xinc][yinc][zinc] = curBlock
      }
    });
  }
  //this.renderGrid = function(startPos, endPos){
  //  gridHeight = endPos.x-startPos.x
  //  gridWidth = endPos.
  //}
  
  this.drawGrid = function(startPos, endPos){
    this.worldIter(startPos, endPos, function(xinc,yinc,zinc){
      renderError = false;
      xbpos = blockSize*xinc;
      ybpos = blockSize*yinc;
      zbpos = blockSize*zinc;
      curBlock = wself.getBlock(xinc, yinc, zinc)
      if(curBlock !== undefined){
        if(curBlock.isVisible){
          push()
          textureimg = curBlock.texture;
          specularMaterial(255)
          texture(textureimg)
          translate(xbpos,ybpos*-1,zbpos);
          box(blockSize)
          pop()
        }
      }
    });
  }
  this.sun = function(){
    var inimg = imgs.get("sun");
    
    push();
    translate(0,cam.pos.y-2000,0);
    rotateX(HALF_PI);
    fill(0,0,0,0);
    texture(inimg);
    plane(1000,1000);
    pop();
    
  }
  this.base = function(){
    push()
    translate(0,0,0)
    rotateX(HALF_PI)
    fill(100)
    planeLength = this.genLength*blockSize;
    planeWidth = this.genWidth*blockSize;
    plane(planeLength, planeWidth);
    pop();
  }
}
function overlay(){
  this.info = createP('').style('color','white')
  this.sensitivity = createSlider(0,100,50)
  this.resize = function(){
    this.info.position(5,-5)
    this.sensitivity.position(width-150,10)
  }
  this.update = function(){
    this.resize()
    infodata = [
      "Position: " + cam.pos.x/blockSize+",  "+cam.pos.y/blockSize+",  "+cam.pos.z/blockSize,
      "Mouse Movement: " + movX + ","+ movY,
      "Angles: "+roundPlace(cam.Xangle,3)+","+roundPlace(cam.Yangle,3)
      //"Pointing: " + x1 + "," + y1 + "," + z1
    ]
    this.info.html(infodata.join("</br>"))
    
    //Sensitivity
    cam.sensitivity = map(this.sensitivity.value(), 0,100, 0.001, 0.02)
  }
}
function camview(spawnPos){
  this.pos = spawnPos;
  this.bpos = createVector(0,0,0)
  this.pointer = createVector(0,0,0)
  this.Xangle= 0
  this.Yangle= 0
  this.sensitivity = 0.003;
  this.moveSpeed = blockSize/2;
  
  this.updatePos = function(){
    var bx = this.pos.x/blockSize;
    var by = this.pos.y/blockSize;
    var bz = this.pos.z/blockSize;
    this.bpos = createVector(bx,by,bz);
  }
  this.tp = function(x,y,z){
    this.pos.x = x*blockSize;
    this.pos.y = y*blockSize;
    this.pos.z = z*blockSize;
  }
  this.transpos = function(xangle, yangle, orgin,point){
    x = point.x - orgin.x
    y = point.y - orgin.y
    z = point.z - orgin.z
    
    x1 = (x*cos(yangle)) - (z*sin(yangle)) //rotate around camera y axis for x
    y1 = (x*sin(xangle)) + (z*cos(xangle))
    z1 = (x*sin(yangle)) + (z*cos(yangle)) //rotate around camera y axis for z
    
    yisup = map(abs(y1), 0,1, 1,1/TWO_PI)
    
    x1 *= yisup;
    z1 *= yisup;
    //print("Before: " + x1+","+z1+" After: " + x2+","+z2)
    return createVector(x1+orgin.x,y1+orgin.y,z1+orgin.z)
  }
  this.moveDetect = function(){
    mdist = this.moveSpeed
    if(keyIsDown(87)){ //W FORWARD
      this.move(0,mdist)
    }if(keyIsDown(65)){ //A LEFT
      this.move(-HALF_PI,mdist)
    }if(keyIsDown(83)){ //S BACKWARD
      this.move(PI,mdist)
    }if(keyIsDown(68)){ //D RIGHT
      this.move(HALF_PI,mdist)
    }if(keyIsDown(32)){ //Space UP
      cam.pos.y -= mdist
    }if(keyIsDown(16)){ //Shift DOWN
      cam.pos.y +=mdist
    }if(keyIsDown(18)){ zoomin = true; }else{
      zoomin = false;
    }
  }
  this.move = function(dir,distance){
    movevect = this.transpos(0,this.Yangle+dir, this.pos, createVector(this.pos.x+distance,this.pos.y,this.pos.z))
    cam.pos.x = round(movevect.x);
    cam.pos.y = round(movevect.y);
    cam.pos.z = round(movevect.z);
  }
  this.mouseDetect = function(){
    if(mouseIsPressed){
      movX = this.sensitivity * (mouseX-this.prevMouseX)
      this.Yangle -= movX
      movY = this.sensitivity * (mouseY-this.prevMouseY)
      this.Xangle -= movY
    }else if(mlock.state){
      this.Yangle += (this.sensitivity * movX)
      this.Xangle += (this.sensitivity * movY)
      movX = 0
      movY = 0
    }
    //Make sure Xangle (mouse up and down) doesn't wrap around
    var xangT = HALF_PI //threshold (min and max) for x angle
    if(this.Xangle > xangT){
      this.Xangle = xangT
    }else if(this.Xangle < -xangT){
      this.Xangle = -xangT
    }
    this.prevMouseX = mouseX
    this.prevMouseY = mouseY //Note previous mouse position to calc difference
  }
  
  this.prevMouseX=mouseX;this.prevMouseY=mouseY;
  this.interface = function(){
    this.moveDetect()
    this.mouseDetect()
    
    let fov = PI/3 //make slider for this
    let renderDist = 1000*blockSize
    let zoom = 2
    let aspectRatio = width/height
    if(zoomin){
      fov /= zoom
    }
    
    this.pointer = this.transpos(this.Xangle, this.Yangle, this.pos,createVector(this.pos.x+1,this.pos.y,this.pos.z))
    camera(this.pos.x,this.pos.y,this.pos.z,   this.pointer.x, this.pointer.y, this.pointer.z,   0,1,0);
    //perspective(fieldOfView, aspectRatio, minimumClipping, maxCliping/RenderDist )
    perspective(fov, aspectRatio, 1, renderDist)
    
    this.updatePos()
  }
  
}
function mouseLock(){
  this.enabled = false
  this.state = false
  this.movX
  this.movY
  
  this.init = function(){
    this.enabled = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    console.log("MouseLock Enabled: " + this.enabled)
    this.p5canvas = document.getElementById("defaultCanvas0")
    this.p5canvas.requestPointerLock = this.p5canvas.requestPointerLock || this.p5canvas.mozRequestPointerLock || this.p5canvas.webkitRequestPointerLock;
    //this.p5canvas.exitPointerLock = this.p5canvas.exitPointerLock || this.p5canvas.mozExitPointerLock || this.p5canvas.webkitExitPointerLock
    
    //Event Listeners
    document.addEventListener('pointerlockchange', this.stateChanged.bind(this), false);
    document.addEventListener('mozpointerlockchange', this.stateChanged.bind(this), false);
    document.addEventListener('webkitpointerlockchange', this.stateChanged.bind(this), false);
  }
  this.lock = function(){
    this.state = true
    this.p5canvas.requestPointerLock();
  }
  this.stateChanged = function(){
    if (document.pointerLockElement === this.p5canvas ||
      document.mozPointerLockElement === this.p5canvas ||
      document.webkitPointerLockElement === this.p5canvas) {
      console.log("Pointer Locked")
      this.state = true
      document.addEventListener("mousemove", this.moveCallback, false);
    } else {
      console.log("Pointer Unlocked")
      this.state = false
      document.removeEventListener("mousemove", this.moveCallback, false);
      //this.unlockHook(this.element);
    }
  }
  this.moveCallback = function(e){
    this.movX = e.movementX ||
      e.mozMovementX          ||
      e.webkitMovementX       ||
      0;
    this.movY = e.movementY ||
      e.mozMovementY      ||
      e.webkitMovementY   ||
      0;
    movX = this.movX
    movY = this.movY
  }
  
  this.init() //initiate MouseLock
}
function images(){
  this.names = []
  this.images = []
  this.load = function(name){
    img = loadImage("assets/" + name)
    sname = name.split(".")[0]
    append(this.names, sname)
    append(this.images, img)
  }
  this.get = function(name){
    index = this.names.indexOf(name)
    return this.images[index]
  }
}

/***Utils***/
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  overinfo.update()
}
function doubleClicked(){
  mlock.lock()
}
function roundPlace(num, placeval){
  var times = pow(10,placeval)
  return round(num*times)/times
}
function keyPressed(){
  printKeyCode = false;
  if(printKeyCode){
    print(keyCode)
  }
}
