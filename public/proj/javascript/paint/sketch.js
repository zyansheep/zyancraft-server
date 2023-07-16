brushsize=20;
canvsize = 600;
selectedPic = 0;
var picbook = [];
curPic = [];

function setup() {
  rend = new renderer()
  nm = new neuralmanager()
  pixels = round(canvsize/brushsize);
  screen = createCanvas(Csize(windowWidth),Csize(windowHeight-2));
  canvas = createGraphics(Csize(canvsize),Csize(canvsize));
  
  resetPic();
  
  background(200);
  canvas.background(51);
  noStroke();
  rectMode(CENTER);

  uploadbutton = createFileInput(uploadPics)
  downloadbutton = createButton("Save").mousePressed(function(){
    downloadPics()
  })
  editing = false
  recordbutton = createButton("New Image").mousePressed(function(){
    recordPic()
  })
  erase = false
  eraserbutton = createButton("Eraser").mousePressed(function(){
    if(!erase){
      erase = true
    }else{
      erase = false
    }
  })
  netOn = false
  neuralbutton = createButton("Init NeuralNet").mousePressed(function(){
    if(!netOn){
      netOn = nm.init(picbook)
      if(netOn){
        neuralbutton.html("Use Pics For Training");
        print("NeuralNet Initialized")
      }else{print("error need pictures");}
    }else{
      print("adding new batch")
      nm.addbatch(picbook)
      picbook = []
      rend.renderbook = []
      rend.drawPics()
      nm.train()
    }
  })
  windowResized();
}
function draw() {
  canMouX = mouseX-(width/2-canvsize/2+brushsize/2) //big canvas to small palete callibration
  canMouY = mouseY-(height-canvsize+brushsize/2-5)
  if(mouseIsPressed){
    corX = round(canMouX/brushsize);
    corY = round(canMouY/brushsize);
    canvas.noStroke()
    
    if((0 <= corX && corX < pixels) && (0 <= corY && corY < pixels)){
      if(!erase){
        curPic[corY][corX] = 1;
        canvas.fill(255)
        canvas.rect(corX*brushsize,corY*brushsize,brushsize,brushsize);
      }else{
        curPic[corY][corX] = 0;
        canvas.fill(51)
        canvas.rect(corX*brushsize,corY*brushsize,brushsize,brushsize);
      }
    }
  }
  image(canvas, width/2-canvsize/2, height-canvsize-5);
  
  rend.drawOverlay()
}

function resetPic(){
  canvas.background(51)
  curPic = []
  for(i=0;i<pixels;i++){
    curPic[i] = []
    for(f=0;f<pixels;f++){
      curPic[i][f] = 0
    }
  }
}
function recordPic(){
  if(!editing){
    selectedPic = picbook.length
  }
  picbook[selectedPic] = curPic
  resetPic()
  rend.renderPic(selectedPic)
  rend.drawPics()
  editing = false
}
function delPic(indexpic){
  picbook.splice(indexpic,1)
  rend.renderbook.splice(indexpic,1)
  rend.drawPics()
}
function editPic(indexpic){
  editing = true
  resetPic()
  curPic = picbook[indexpic]
  for(var i=0;i<curPic.length;i++){
    for(var j=0;j<curPic[i].length;j++){
      if(curPic[j][i] === 1){
        canvas.fill(255)
        canvas.rect(i*brushsize,j*brushsize, brushsize, brushsize)
      }
    }
  }
  
}

function downloadPics(){
  saveStrings(picbook, "sketchbook");
  picbook = []; rend.renderbook = [];
  rend.drawPics();
}
function uploadPics(file){
  doUpload = true
  if(picbook.length !== 0){
    doUpload = confirm("You have unsaved images, Uploading will overwrite them\n Click OK to overwrite current images or Cancel to stop loading")
  }
  data = file.data.split('\n')
  data.splice(data.length-1)
  inputpics = []
  for(var i=0;i<data.length;i++){
    data[i] = split(data[i], ',')
    inputpx = floor(sqrt(data[i].length))
    
    dataSeg = []
    for(var j=0;j<inputpx;j++){
      spldata = data[i].splice(0,inputpx)
      append(dataSeg, spldata)
    }
    append(inputpics,dataSeg)
  }
  //print(inputpics)
  inputpics = int(inputpics)
  if(doUpload){
    picbook = inputpics
    rend.renderAll()
    rend.drawPics()
  }else{
    uploadbutton.remove()
    uploadbutton = createFileInput(uploadPics)
    windowResized()
  }
}

function neuralmanager(){
  this.trainingBatches = []
  this.forward = function(inputpic){
    nArSeg = [];
    for(var j=0;j<pixels;j++){
      nArSeg = concat(nArSeg, inputpic[j]);
    }
    yhat = nn.forward(nArSeg)
    return yhat
  }
  this.picsToInput = function(inputbook){
    var nAr = [];
    var nArSeg = [];
    for(var i=0;i<inputbook.length;i++){
      nArSeg = [];
      for(var j=0;j<pixels;j++){
        nArSeg = concat(nArSeg, inputbook[i][j]);
      }
      append(nAr, nArSeg);
    }
    return nAr;
  }
  this.picsToOutput = function(inputbook){
    outAr = []
    var blen = inputbook.length
    for(var i=0;i<blen;i++){
      outAr[i] = []
      for(var j=0;j<blen;j++){
        if(i===j){
          outAr[i][j] = 1
        }else{
          outAr[i][j] = 0
        }
      }
    }
    return outAr
  }
  this.init = function(inputbook){
    if(picbook.length === 0){ return false}
    trainIN = this.picsToInput(inputbook);
    trainOUT = this.picsToOutput(inputbook);
    neuralstruct = [trainIN[0].length,pixels,trainOUT[0].length];
    nn = new NeuralNet(neuralstruct, trainIN, trainOUT);
    nn.init();
    nn.calculate(0);
    return true
  }
  this.addbatch = function(inputbook){
    var TRdata = this.picsToInput(inputbook)
    append(this.trainingBatches, TRdata)
  }
  this.train = function(){
    nn.nudge()
    while(nn.cost > 0.05){
      for(var i=0;i<this.trainingBatches.length;i++){
        nn.trainX = this.trainingBatches[i]
        nn.nudge();
      }
    }
  }
}
function renderer(){
  this.renderbook = [];
  this.picsPerRow = 6;
  this.getPosition = function(numpic){
    function posObject(x,y,w,h){
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
    marginToCanvas = (width/2)-(canvas.width/2);
    w = marginToCanvas/(this.picsPerRow/2);
    h=w;
    ypos = floor(numpic/this.picsPerRow)*w;
    xpos = numpic*w - ((marginToCanvas*2) * floor(numpic/this.picsPerRow));
    //print(xpos+","+ypos + " m:" + marginToCanvas)
    
    if(floor(xpos+w)>marginToCanvas){
      xpos += canvas.width;
    }
    output = new posObject(xpos,ypos,w,h);
    return output;
  }
  this.renderAll = function(){
    for(var i=0; i<picbook.length;i++){
      this.renderPic(i);
    }
  }
  this.renderPic = function(numpic){
    curp = picbook[numpic];
    picPos = this.getPosition(numpic);
    
    //picbook[numpic-1][-1] = window.prompt("Name This Pic")
    
    pixelsize = w/pixels;
    //print(curp + "x:"+x+" y:"+y+" p:"+pixelsize)
    tpa = createGraphics(picPos.w,picPos.h);
    tpa.background(51);
    tpa.fill(255);
    tpa.stroke(255);
    for(var i=0; i<curp.length; i++){ //draw tiny pic
      for(var j=0; j<curp[i].length; j++){
        if(curp[j][i] === 1){
          tpa.rect(i*pixelsize, j*pixelsize, pixelsize,pixelsize);
        }
      }
    }
    this.renderbook[numpic] = tpa;
  }
  this.drawPics = function(){
    background(200); //reset background for screen
    curp = [];
    for(var numpic=0;numpic<this.renderbook.length;numpic++){
      picpos = this.getPosition(numpic);
      image(this.renderbook[numpic],picpos.x,picpos.y);
    }
    //print("rendered pics");
  }
  editbutton = createButton("Edit").style('display','none').mousePressed(function(){
    editPic(selectedPic);
    editbutton.style('display','none');
    delbutton.style('display','none');
  })
  delbutton = createButton("Deleate").style('display','none').mousePressed(function(){
    delPic(selectedPic);
    editbutton.style('display','none');
    delbutton.style('display','none');
  })
  this.drawOverlay = function(){
    var wasinpic = false;
    for(var i=0;i<this.renderbook.length;i++){
      picPos = this.getPosition(i);
      inpic = collidePointRect(mouseX, mouseY, picPos.x,picPos.y,picPos.w,picPos.h);
      if(inpic){
        wasinpic = true;
        selectedPic = i;
        editbutton.position(picPos.x,picPos.y).style('display','block');
        delbutton.position(picPos.x,picPos.y+20).style('display','block');
      }else if(!wasinpic){
        editbutton.style('display','none');
        delbutton.style('display','none');
      }
    }
  }
}

/***Other***/
function keyPressed(){
  if(keyCode===82){ //r for restart
    resetPic();
  }else if(keyCode===13){ //enter to log
    recordPic();
  }else if(keyCode===69){ //e for eraser toggle
    if(!erase){
      erase = true;
    }else{
      erase = false;
    }
  }
}
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  var hmarg = 5
  downloadbutton.position(width/2-canvsize/2+75,hmarg);
  recordbutton.position(width/2-canvsize/2,hmarg);
  eraserbutton.position(width/2-canvsize/2,hmarg+20);
  uploadbutton.position(width/2-canvsize/2+115,hmarg);
  neuralbutton.position(width/2+canvsize/2-120,hmarg)
  rend.renderAll()
  rend.drawPics();
} //recalculate positions
function Csize(lng){return round(lng/brushsize)*brushsize;}
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
}, false); //disable right click menu


