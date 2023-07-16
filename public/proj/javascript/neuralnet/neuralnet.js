function NeuralNet(neural_struct, trainX, trainY){
  var self = this
  this.cost = 0
  this.yhat = [] //current stored network output
  this.y = [] //what the output should be
  this.neurons = [] //ALL DA NEURONS
  this.trainX = trainX
  this.trainY = trainY
  
  /***Neural Functions***/
  this.inputneuron = function(input){ //input neuron for first layer
    this.V = input
    this.setInput = function(xSeg){ //can only be an int (segment of input training data)
      this.V = xSeg
    }
  } 
  this.neuron = function(inputLayer){ //recieves input neurons
    this.W = self.randomArr(self.neurons[inputLayer].length, -1, 1); //generate random input weights for neuron
    this.A = [] //activations from previous layer
    this.B = 0 //roundPlace(random(-1,1),10);  //bias add random later maybe
    this.V = 0; //val of neuron
    
    this.Vnudge = 0; //a nudge to the value of neuron
    
    this.WnudgeSUM = self.randomArr(self.neurons[inputLayer].length, 0,0);
    this.BnudgeSUM = 0
    
    this.nudge = function(){
      this.Wnudge = self.multArr(this.A, self.sigprime(this.V)*this.Vnudge)
      this.Bnudge = self.sigprime(this.V)*this.Vnudge
      this.W = self.minusArr(this.W, this.Wnudge)
      this.B -= (this.Bnudge)
    }
  
    this.calc = function(){
      this.A = [];
      for(var inc=0; inc<self.neurons[inputLayer].length; inc++){ //get activations
        append(this.A, self.neurons[inputLayer][inc].V)
      }
      
      this.sum = 0;
      for(var i=0; i<this.W.length; i++){ //sum all recieved weights
        this.sum += (this.A[i] * this.W[i])
      }
      this.sum += this.B
      
      this.V = self.sig(this.sum);
      return this.V
    }
  } //neuron object
  this.init = function(x){ //input vals
    self.neurons[0] = []
    this.rep(0,neural_struct[0],function(i){
      self.neurons[0][i] = new self.inputneuron(x[i]); //feed inputs into input neurons
    })
    
    self.rep(1,neural_struct.length,function(i){ //iterate though neural_struct layers start at index 1 because inputs are allready initialized
      self.neurons[i] = []
      self.rep(0,neural_struct[i],function(j){ //iterate though each neuron in layer i of neural_struct
        self.neurons[i][j] = new self.neuron(i-1);
      })
    })
    lastlayer = self.neurons.length-1
  } //initiate neurons and weights
  this.forward = function(x){ //calc network
    for(g=0; g<x.length; g++){
      self.neurons[0][g].setInput(x[g])
    }
    var output = []
    for(g=1; g<self.neurons.length; g++){
      for(h=0; h<self.neurons[g].length; h++){
        self.neurons[g][h].calc();
        if(g == self.neurons.length-1){
          append(output, self.neurons[g][h].V);
        }
      }
    }
    stroke(255)
    //print("Output = " + output + " for input " + x)
    self.yhat = output
    return output
  }
  
  /***Training***/
  this.train = function(trainIndex){
    self.calculate(trainIndex);
    self.nudgeNetActivations();
    for(var i=1; i<self.neurons.length; i++){
      for(var j=0; j<self.neurons[i].length; j++){
        self.neurons[i][j].nudge();
      }
    }
  }
  this.nudge = function(){
    view = false;
    for(var i=0; i<trainX.length; i++){
      self.train(i)
    }
    self.cost = self.netCost()
  }
  this.netCost = function(){
    var output = 0
    for(var l=0; l<trainX.length; l++){
      self.calculate(l)
      for(var i=0; i<self.y.length; i++){
        nthOut = pow(self.yhat[i]-self.y[i], 2);
        output += nthOut;
      }
    }
    return output/trainX.length
  }
  this.nudgeNetActivations = function(){
    this.writenudges = function(layer, Nnudges){
      for(var j=0; j<Nnudges.length; j++){
        self.neurons[layer][j].Vnudge = Nnudges[j]
      }
    }
    
    var nudges = self.multArr(self.minusArr(self.yhat, self.y),2) //return dCdV of last layer (derv of cost function)
    //print("layer: "+lastlayer+" : "+nudges)
    this.writenudges(lastlayer, nudges)
    
    for(l=self.neurons.length-2; l>=1 ;l--){//loop backwards through layers
      var nudge = self.randomArr(self.neurons[l].length,0,0)
      for(var i=0;i<self.neurons[l+1].length; i++){ //for index neurons layer in next layer 
        var dcdv = self.neurons[l+1][i].Vnudge //get nudge to neuron in next layer
        var dvdz = self.sigprime(self.neurons[l+1][i].V) //get weights of neuron in next layer
        var dzda = self.neurons[l+1][i].W
        var chng = self.multArr(dzda, dcdv*dvdz)
        nudge = self.sumArr(nudge, chng)
      }
      //print("layer: "+l+" : "+nudge)
      this.writenudges(l, nudge)
    }
  } //get the nudge to neuron activations based on sum of weights
  this.calculate = function(trainIndex){
    this.forward(trainX[trainIndex])
    self.y = trainY[trainIndex]
  }
  
  /***Array Manupulators***/
  this.outputWeights = function(){
    output = []
    for(var layr=1; layr<self.neurons.length; layr++){
      output[layr] = []
      for(var neurn=0; neurn<self.neurons[layr].length; neurn++){
        output[layr][neurn] = self.neurons[layr][neurn].W //+1 to skip input neurons
        var binx = output[layr][neurn].length
        output[layr][neurn][binx] = self.neurons[layr][neurn].B //bias
      }
    }
    return output
  }
  this.inputWeights = function(weights){
    for(layr=0; layr<self.neurons.length-1; layr++){
      for(neurn=0; neurn<self.neurons[layr+1].length; neurn++){
        bias = weights[layr][neurn].pop(); //get last element of array and deleate off array
        self.neurons[layr+1][neurn].W = weights[layr][neurn];
        self.neurons[layr+1][neurn].B = bias;
      }
    }
  }
  this.randomArr = function(len,mini,maxi){ //write data to weights using index array
    output = [];
    for(var ind=0; ind<len; ind++){
      append(output, self.roundPlace(random(mini,maxi),100));
    }
    return output;
  }
  this.sumArr = function(arr1, arr2){
    len = (arr1 <= arr2) ? arr2.length : arr1.length; //length = longer array
    var output = []
    for(var a=0; a<len; a++){
      output[a] = arr1[a] + arr2[a]
    }
    return output
  }
  this.minusArr = function(arr1, arr2){
    len = (arr1 <= arr2) ? arr2.length : arr1.length; //length = longer array
    var output = []
    for(var a=0; a<len; a++){
      output[a] = arr1[a] - arr2[a]
    }
    return output;
  }
  this.divArr = function(arr, num){
    var output = [];
    for(var a=0; a<arr.length; a++){
      output[a] = arr[a] / num;
    }
    return output;
  }
  this.multArr = function(arr, num){
    var output = [];
    for(var a=0; a<arr.length; a++){
      output[a] = arr[a] * num;
    }
    return output;
  }
  
  /***Other***/
  this.roundPlace = function(num, placeval){
    return round(num*placeval)/placeval
  }
  this.sig = function(x){
    return 1/(1+exp(-x));
  }
  this.sigprime = function(x){
    return exp(-x)/pow(1+exp(-x),2)
  }
  this.rep = function(start, stop, code){
    for(var i=start; i<stop; i++){
      code(i)
    }
  } //replace for loops maybe
}