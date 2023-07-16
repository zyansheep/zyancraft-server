
var drawCnv;
var mainCnv
function setup() {
  cnv = createCanvas(windowHeight, windowHeight);
  cnv.mouseWheel(rendZoomInEvent);
  
  saveButton = createButton("Save Rendering");
  saveButton.position(cnv.elt.offsetLeft + width + 50, cnv.elt.offsetTop + 6);
  saveButton.mousePressed( function(){
    saveCanvas(drawCnv, "download", "png");
  });
  resSlider = createSlider(200,width+100,400,1);
  resSlider.position(cnv.elt.offSetLeft + width + 80, cnv.elt.offsetTop + 30);
  
  
  //canvas that gets rendered to
  drawCnv = createGraphics(resSlider.value(),resSlider.value());
  drawCnv.noStroke();
  drawCnv.pixelDensity(1);
  
  cnv.elt.onmouseover = function(){
    document.getElementsByTagName("body")[0].style.overflow = "hidden"
    if(drawCnv.width != resSlider.value()){
      drawCnv = createGraphics(resSlider.value(), resSlider.value());
      doDraw = true;
    }
  }
  cnv.elt.onmouseout = function(){
    document.getElementsByTagName("body")[0].style.overflow = "auto"
  }
  
  window.onresize = function(){
    resizeCanvas(windowHeight, windowHeight);
    resSlider.elt.max = width.toString();
    
    saveButton.position(cnv.elt.offsetLeft + width, cnv.elt.offsetTop + 6);
    resSlider.position(cnv.elt.offSetLeft + width + 80, cnv.elt.offsetTop + 30);
  }
  setupWorker();
}
function setupWorker(){
  //Render in background thread
  worker = new Worker('renderer.js');
  worker.addEventListener('message', function(e) {
    drawCnv.pixels.set(e.data.Pixels);
    //console.log("Before Update:", drawCnv.pixels);
    drawCnv.updatePixels();
    //drawCnv.loadPixels();
    //console.log("After Update", drawCnv.pixels);
    
    renderingTime = round(millis() - renderTime);
    
    drawMidX = drawCnv.width/2;
    drawMidY = drawCnv.height/2;
    drawZoom = 0;
    
    drawZoomNum = 0;
    drawZoomExp = 0;
    canDraw = true;
  }, false);
}

var zThresh = 2;
var maxIter = 50;
doDraw = true;
canDraw = true;
renderingTime = 0;

maxIterOverride = undefined;
function draw() {
  if(doDraw && canDraw){
    renderTime = millis();
    if(drawCnv.width != resSlider.value()){
      drawCnv = createGraphics(resSlider.value(), resSlider.value());
    }
    drawCnv.loadPixels();
    if(maxIterOverride === undefined){
      maxIter = abs(curZoomExp-2) * 40;
    }else{
      maxIter = maxIterOverride;
    }
    
    worker.postMessage({
      Pixels: drawCnv.pixels,
      Width: drawCnv.width,
      Height: drawCnv.height,
      MaxIter: maxIter,
      MidX: rendMidX,
      MidY: rendMidY,
      Zoom: rendZoom
    });
    doDraw = false;
    canDraw = false;
  }
  background(0);
  image(drawCnv, drawMidX - drawCnv.width/2 - drawZoom, drawMidY - drawCnv.height/2 - drawZoom, width + 2*drawZoom, height + 2*drawZoom);
  
  fill(0,255,0);
  text("Rendering Time: " + renderingTime + "ms", 20,20);
  text("Zoom: "+rendZoom.toExponential(1), width-95,20);
  
  text("Resolution: "+resSlider.value()+"x"+resSlider.value(), width-130,40);
}

var curZoomExp = -1;
var curZoomNum = 20;

var drawZoomExp = 1;
var drawZoomNum = 2;
var rendZoomSkip = 0;
function rendZoomInEvent(event){
  //Sensitivity check
  rendZoomSkip += abs(event.deltaY);
  if(rendZoomSkip > 10){ 
    rendZoomSkip = 0;
    //Zooming for rendering coordinates
    if(event.deltaY > 0){ //Zoom out (touchpad down)
      if(curZoomExp == -1){
        if(curZoomNum < 20){
          curZoomNum++;
        }
      }else{
        if(curZoomNum < 10){
          curZoomNum++;
        }else{
          curZoomNum = 1;
          if(curZoomExp < -1){
            curZoomExp++;
          }
        }
      }
    }else{ //Zoom in (touchpad up)
      if(curZoomNum > 1){
        curZoomNum--;
      }else{
        curZoomExp--;
        curZoomNum = 10;
      }
    }
  }
  
  //Zooming for scaling (to have smoothness when rendZooming in while rendering)
  if(event.deltaY > 0){ //Zoom out
    drawZoomNum--;
  }else{ //Zoom in
    drawZoomNum++;
  }
  if(drawZoomNum <= -29){
    drawZoomExp = 0;
    drawZoomNum = -29;
  }
  
  prevZoom = rendZoom;
  rendZoom = pow(10, curZoomExp) * curZoomNum;
  //Make sure rendZoom into spot cursor is at
  rendMidX += map(mouseX, 0,width, -prevZoom, prevZoom) - map(mouseX, 0, width, -rendZoom, rendZoom);
  rendMidY += map(mouseY, 0,height, -prevZoom, prevZoom) - map(mouseY, 0, height, -rendZoom, rendZoom);
  
  //Smooth zooming using render scaling (WIP)
  /*prevDrawZoom = drawZoom;
  drawZoom = drawZoomNum;
  drawMidX += map(mouseX, 0,width, -prevDrawZoom, prevDrawZoom) - map(mouseX, 0,width, -drawZoom, drawZoom);
  drawMidY += map(mouseY, 0,height, -prevDrawZoom, prevDrawZoom) - map(mouseY, 0,height, -drawZoom, drawZoom);*/
  
  doDraw = true;
}
function keyPressed(){
  //print("KeyCode: " + keyCode);
  
  switch(keyCode){
    case 69: //'c' for centering on mouse
      rendMidX += map(mouseX, 0,width, -rendZoom, rendZoom);
      rendMidY += map(mouseY, 0,height, -rendZoom, rendZoom);
      doDraw = true;
      break;
    case 82: //'r' to reset to beginning rendZoom and position
      rendZoom = 2;
      rendMidX = -0.6; rendMidY = 0;
      drawZoom = 0;
      drawZoomNum = 0;
      drawZoomExp = 0;
      
      drawMidX = drawCnv.width/2;drawMidY = drawCnv.width/2;
      doDraw = true;
      break;
    case 189: //'=' to rendZoom in
      rendZoomInEvent({deltaY: 10});
      break;
    case 187: //'-' to rendZoom out
      rendZoomInEvent({deltaY: -10});
      break;
    case 90: //'z' to reset candraw
      canDraw = true;
      break;
  }
}

rendZoom = 2;
rendMidX = -0.6;
rendMidY = 0;

drawZoom = 0;
drawMidX = 0;
drawMidY = 0;

prevMouseDragX = 0;
prevMouseDragY = 0;
isMovingFractal = false;
function mouseDragged(){
  if(isMovingFractal){
    drawMidX += mouseX - prevMouseDragX;
    drawMidY += mouseY - prevMouseDragY;
    prevMouseDragX = mouseX;
    prevMouseDragY = mouseY;
  }
}
function mousePressed(){
  //print(mouseX + ", "+mouseY);
  if(0 < mouseX && mouseX < width && 0 < mouseY && mouseY < height){
    isMovingFractal = true;
    prevMouseDragX = mouseX;
    prevMouseDragY = mouseY;
    
    prevMouseX = map(mouseX, 0,width, -rendZoom,rendZoom);
    prevMouseY = map(mouseY, 0,height, -rendZoom,rendZoom);
  }else{
    print("Not moving");
  }
}
function mouseReleased(){
  if(isMovingFractal){
    isMovingFractal = false;
    rendMidX += prevMouseX - map(mouseX, 0,width, -rendZoom,rendZoom);
    rendMidY += prevMouseY - map(mouseY, 0,height, -rendZoom,rendZoom);
    
    //Restart web worker
    if(!canDraw){
      console.log("Terminaing: ",worker);
      worker.terminate();
      setupWorker();
      canDraw = true;
    }
    doDraw = true;
  }
}
