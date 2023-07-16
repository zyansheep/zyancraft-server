var trainX = [
[1,1,1,1],
[1,1,0,0],
[0,0,1,1],
[0,0,0,0],
] //training inputs
var trainY = [
[1,1,1],
[0,1,0],
[0,0,1],
[0,0,0]
]
var neural_struct = [4,3];

var TW = [
  [
    [20,20,0,0,-30],
    [0,0,20,20,-30],
    [10,0,0],
    [0,10,0]
  ],
  [
    [20,20,-30],
    [20,0,-10],
    [0,20,-10]
  ]
  ]; //testing weights
var view = true;

function setup() {
  createCanvas(windowWidth,windowHeight);
  //trainX = initTraining(inputdata) //input training data
  
  NN = new NeuralNet(neural_struct, trainX, trainY);
  NN.init(trainX[0]);
  NN.calculate(0);
  
  upload = createFileInput(uploadFile).position(width-100,0)
  download = createButton("Download File").position(width-100,30).mousePressed(function(){
    weights = NN.outputWeights();
    saveStrings(weights.toString(), "weights.txt");
  })
  
  calcInput = createInput("1").position(0,0).size(100,10)
  trainNet = createInput("1").position(0,30).size(30,10)
  trainButton = createButton("Train!").position(50,30).mousePressed(function(){
    for(var t=0; t<int(trainNet.value()); t++){
      NN.nudge();
    }
  })
  addDataInputX = createInput("1110").position(width/2,5).size(100,10);
  addDataInputY = createInput("010").position(width/2,25).size(100,10);
  forwardData = createButton("Forward data Set").position(width/2+110,5).size(90,20).mousePressed(function(){
    if(addDataInputX.value().length == NN.trainX[0].length){
      NN.forward(addDataInputX.value());
    }
  });
  addDataButton = createButton("Add data set").position(width/2,40).size(100,20).mousePressed(function(){
    var dataSetX = addDataInputX.value();
    var dataSetY = addDataInputY.value();
    if(dataSetX.length == NN.trainX[0].length && dataSetY.length == NN.trainY[0].length){
      append(NN.trainX, dataSetX);
      append(NN.trainY, dataSetY);
    }else {print("DataSet Error");}
  });
  viewinit();
}
function draw(){
  background(51);
  drawview();
  //noLoop()
}
function viewinit(){
  ymult = NN.neurons[0].length
  xmult = NN.neurons.length-0.8
  yspace = height/ymult
  xspace = width/xmult
  xpos = 50
  ypos = 100
  textAlign(CENTER)
}
function drawview(){
  fill(255); stroke(0)
  text("Cost: " + NN.roundPlace(NN.cost, 10000),150,15) //COST OF NETWORK
  fill(0); stroke(255)
  //print("drawing")
  
  
  for(var i=0;i<NN.neurons.length;i++){
    nlen = (NN.neurons[i].length <= 10)? NN.neurons[i].length : 10 //limit on # of neurons drawn per layer
    //print("nlen: "+nlen)
    for(var j=0;j<nlen;j++){
      nval = NN.roundPlace(NN.neurons[i][j].V, 10000)
      fill(nval*255)
      curx = xspace*i+xpos
      cury = yspace*j+ypos
      //print(curx + "," + cury)
      ellipse(curx, cury, 50,50)
      fill(0)
      text(nval, curx, cury)
      
      //draw Weight Texts
      if(i>0){
        fill(255); stroke(0)
        text(NN.roundPlace(NN.neurons[i][j].B,1000), curx,cury+10)
        var nw = NN.neurons[i][j].W
        for(var wie=0; wie<nw.length;wie++){
          weix = xpos+curx+(j*(xspace/(nlen+1)))-xspace
          weiy = ypos+wie*yspace
          text(NN.roundPlace(NN.neurons[i][j].W[wie],1000), weix,weiy)
        }
        fill(0); stroke(255)
      }
    }
  }
}
function keyPressed(){
  if (keyCode === ENTER) {
    tindex = round(calcInput.value()-1)
    if (tindex > -1 && tindex < trainX.length) {
      NN.calculate(tindex)
      print(NN.yhat)
    }
  }
}
function initTraining(inputdata){
  output = []
  var undefAlert = false
  var i = 0
  while(!undefAlert){
    curAr = inputdata[i]
    if(curAr === undefined){
      break;
    }else{
      append(output, curAr)
    }
    i++
  }
  return output
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  viewinit()
}

function uploadFile(file){
  data = file.data.split('\n')
  data.splice(data.length-1)
  print(data)
} //WIP


