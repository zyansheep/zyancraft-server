
  class Bouncer {
    double pos;
    double vel;
    double mass;
    int size;
    
    boolean didDetCollision = false;
    double newVel = 0; //undefined value
    public Bouncer(double pos, double vel, double mass, int size){
      this.pos = pos;
      this.vel = vel;
      this.mass = mass;
      this.size = size;
    }
    public double calcKE(){
      return (0.5) * this.mass * Math.pow(Math.abs(this.vel), 2);
    }
    public void balanceKE(Bouncer other, double allKE){
      double curVelSign = this.vel/Math.abs(this.vel);
      
      double thisKE = allKE - other.calcKE();
      double velSquared = thisKE / (0.5 * this.mass);
      this.vel = curVelSign * Math.sqrt(velSquared);
    }
    public int getRecommendedStepVal(int maxStep, Bouncer other, double low, double high){
      //Advance simulation to test for collisions if found, set step value to max
      double thisnextPos = this.pos + this.vel;
      double othernextPos = other.pos + other.vel;
      //Collide block
      if( thisnextPos <= othernextPos + other.size && thisnextPos + this.size >= othernextPos ){
        return maxStep;
      }
      //collide range
      if((thisnextPos <= low && this.vel < 0) | (thisnextPos + this.size >= high && this.vel > 0)){
        return maxStep;
      }
      return 1;
    }
    public boolean collideBlock(Bouncer other){
      //Test hit other block
      if( this.pos <= (other.pos + other.size) && (this.pos + this.size) >= other.pos ){
        double massSum = this.mass + other.mass;
        //see https://en.wikipedia.org/wiki/Elastic_collision for perfectly elastic collision formula
        this.newVel = (this.mass - other.mass) / massSum * this.vel;
        this.newVel+= (2.0 * other.mass) / massSum * other.vel;
        didDetCollision = true;
        return true;
      }
      return false;
    }
    public boolean collideRange(double low, double high){
      if((this.pos <= low && this.vel < 0) | (this.pos + this.size >= high && this.vel > 0)){
        this.vel = -this.vel;
        return true;
      }
      return false;
    }
    public void update(double eulerStep){
      if(didDetCollision){
        this.vel = this.newVel;
        this.newVel = 0;
        didDetCollision = false;
      }
      this.pos += this.vel/eulerStep;
    }
    public void show(){
      float hue = map( (float)this.calcKE(), 0,pow(100,digits-1), 0,255);
      //colorMode(HSB);
      fill(hue);
      rect((float)this.pos, height-this.size, this.size, this.size);
      //colorMode(RGB);
      
      fill(0);
      textAlign(CENTER);
      
      float massStr = (float)this.mass
      text(massStr, (float)(this.pos+this.size/2), (float)(height-this.size-20) );
    }
  }
  
  public void settings(){
    size(1000,500);
  }
  
  Bouncer small;
  Bouncer large;
  int digits = 5;
  String prevPiCount = "N/A";
  int piCounter;
  boolean doCount = true;
  
  int eulerStep;
  double allKE = 0;
  public void setup(){
    settings();
    initBlocks(digits);
  }
  public void initBlocks(int digits){
    eulerStep = (int)pow(10,digits-1);
    if(digits == 1){ eulerStep = 1; }
    small = new Bouncer(100, 0, 1, 20);
    large = new Bouncer(300, -5, pow(100, digits-1), 100);
    allKE = small.calcKE() + large.calcKE();
  }
  
  boolean doLoop = true;
  public void draw(){
    background(200);
    int steps = small.getRecommendedStepVal(eulerStep, large, 0, large.pos + large.size);
    //print(steps + " ");
    
    for(int i=0;i<steps;i++){
      
      if(small.collideBlock(large) && doCount){
        piCounter++;
      }
      large.collideBlock(small);
      
      small.update(steps);
      large.update(steps);
      
      //collide from left wall to far edge of big block
      if(small.collideRange(0,large.pos + large.size) && doCount){
        piCounter++;
      }
      
      
      if(large.vel >= small.vel && large.vel > 0 && small.vel >= 0){
        if(large.pos + large.size > width){
          large.vel *= -1;
          storePi(piCounter);
          piCounter = 0;
          large.balanceKE(small, allKE);
          //small.vel = 0;
          //large.vel = round(large.vel);
        }
        //small.vel = small.vel / 1.01;
      }
    }
    fill(120,50,240);
    small.show();
    large.show();
    //rect((float)small.pos, height-small.size, small.size, small.size);
    //rect((float)large.pos, height-large.size, large.size, large.size);
    
    fill(0);
    textSize(100);
    textAlign(CENTER);
    text(piCounter, width/2, height/2);
    textSize(25);
    text(prevPiCount, width/2, height/2 - 90);
    
    textSize(11);
    textAlign(CORNER);
    text("Small Pos: "+round((float)small.pos)+" Vel: "+round((float)small.vel), 10,10);
    text("Large Pos: "+round((float)large.pos)+" Vel: "+round((float)large.vel), 10,20);
    
    double smKE = small.calcKE();
    double lgKE = large.calcKE();
    
    text("All KE: "+(smKE + lgKE), 10,30);
    
    double[] energyArray = { small.calcKE() / allKE, large.calcKE() / allKE };
    int[] colorArray = { color(255,0,255), color(0,255,0) };
    pieChart(width/2, height/2-180, 100, energyArray, colorArray );
  }
  public void pieChart(float x, float y, float diameter, double[] data, int[] colors) {
    double lastAngle = 0;
    double curAngle = 0;
    for (int i = 0; i < data.length; i++) {
      float gray = map(i, 0, data.length, 0, 255);
      curAngle = data[i]*2*Math.PI;
      fill(gray);
      arc(x, y, diameter, diameter, (float)lastAngle, (float)(lastAngle+curAngle));
      lastAngle += curAngle;
    }
  }
  public void keyPressed(){
    //println(keyCode);
    if(49 <= keyCode && keyCode <= 56){
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
  public void mousePressed(){
    if(!doLoop){
      redraw();
    }
  }
  
  public void storePi(int piapprox){
    prevPiCount = str(piapprox);
    prevPiCount = prevPiCount.substring(0, 1) + "." + prevPiCount.substring(1, prevPiCount.length());
  }

