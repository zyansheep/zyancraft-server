//import {Decimal} from 'decimal.js';

function Bouncer(pos, vel, mass, size){
  this.pos = pos;
  this.vel = new Decimal(vel);
  this.mass = mass;
  this.size = size;
  
  this.didDetCollision = false;
  this.newVel = new Decimal(NaN);
  this.getRecommendedStepVal = function(maxStep, other, low,high){
    //Advance simulation to test for collisions if found, set step value to max
    thisnextPos = this.pos + this.vel.toNumber();
    othernextPos = other.pos + other.vel.toNumber();
    //Collide block
    if( thisnextPos <= othernextPos + other.size && thisnextPos + this.size >= othernextPos ){
      return maxStep;
    }
    //collide range
    if((thisnextPos <= low && this.vel.toNumber() < 0) || (thisnextPos + this.size >= high && this.vel.toNumber() > 0)){
      return maxStep;
    }
    return 1;
  }
  
  this.detCollideBlock = function(other){
    var thispos = this.pos + this.vel.toNumber();
    var otherpos = other.pos + other.vel.toNumber();
    //Test hit other block
    if( thispos <= (otherpos + other.size) && (thispos + this.size) >= otherpos ){
      return true;
    }
    return false;
  }
  this.detCollideRange = function(low, high){
    var thispos = this.pos + this.vel.toNumber();
    if((thispos <= low && this.vel.toNumber() < 0) || (thispos + this.size >= high && this.vel.toNumber() > 0)){
      return true;
    }
    return false;
  }
  this.collideBlock = function(other){
    //Test hit other block
    if( this.pos <= (other.pos + other.size) && (this.pos + this.size) >= other.pos ){
      //var massSum = this.mass + other.mass;
      var massSum = new Decimal(this.mass + other.mass);
      //see https://en.wikipedia.org/wiki/Elastic_collision for perfectly elastic collision formula
      //this.newVel = (this.mass - other.mass) / massSum * this.vel;
      this.newVel = new Decimal(this.mass - other.mass)
      this.newVel = this.newVel.div(massSum).times(this.vel);
      //this.newVel = this.vel.mul( new Decimal(this.mass - other.mass).div(massSum) );
      
      //this.newVel+= (2.0 * other.mass) / massSum * other.vel;
      this.newVel = this.newVel.add( (new Decimal(2 * other.mass)).div(massSum).mul(other.vel) );
      this.didDetCollision = true;
      return true;
    }
    return false;
  }
  this.collideRange = function(low, high){
    if((this.pos <= low && this.vel.toNumber() < 0) || (this.pos + this.size >= high && this.vel.toNumber() > 0)){
      this.newVel = this.vel.neg();
      this.didDetCollision = true;
      return true;
    }
    return false;
  }
  this.update = function(eulerStep){
    if(this.didDetCollision){
      this.vel = this.newVel.add(0); //get clone of newVel
      this.didDetCollision = false;
    }
    this.pos += this.vel.toNumber() / eulerStep;
  }
  this.show = function(){
    var hue = map(this.calcKE(), 0,pow(100,digits-1), 0,255);
    //colorMode(HSB);
    fill(hue);
    rect(this.pos, height-this.size, this.size, this.size);
    //colorMode(RGB);
    
    fill(0);
    textAlign(CENTER);
    
    text(this.mass, this.pos+(this.size/2), (height-this.size-20) );
  }
  this.calcKE = function(){
    return this.vel.pow(2).mul(this.mass).div(2).abs().toNumber();
  }
}