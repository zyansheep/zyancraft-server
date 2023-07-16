function ball(x,y,vx,vy,rad){
  this.x = x;
  this.y = y;
  this.vx = vx;
  this.vy = vy;
  this.rad = rad;
  this.isDead = true;
  
  this.update = function(){
    if(!this.isDead){
      this.x += this.vx;
      this.y += this.vy;
    }else{
      this.x = width/2;
      this.y = height-40-this.rad/2;
    }
  }
  
  this.doCollisionBlock = function(blockArr){
    var didVelChng = false;
    for(var i=0;i<blockArr.length;i++){
      var blk = blockArr[i];
      if(blk.isPopped){ continue; }
      if(collideRectCircle(blk.x, blk.y, blk.w, blk.h, this.x, this.y, this.rad)){
        var dx = this.x - (blk.x+blk.w/2);
        var dy = this.y - (blk.y+blk.h/2);
        var doBrk = false;
        if( abs(dx) <= abs(dy)+5 ){ //vertical hit
          //print("Vert Reflext");
          
          blk.isPopped = true;
          if(!didVelChng){
            this.vy *= -1;
          }
          didVelChng = true;
          daScore++;
        }
        if(abs(dx) > abs(dy)){ //horizontal hit
          //print("Horz Reflext");
          
          blk.isPopped = true;
          if(!didVelChng){
            this.vx *= -1;
          }
          didVelChng = true;
          daScore++;
        }
        if(daScore > highScore){
          highScore = daScore;
        }
      }
    }
  }
  this.doCollisionWall = function(){
    var ret = false;
    var nextX = this.x;
    var nextY = this.y;
    if(nextX-this.rad/2 <= 0 && this.vx < 0){ //left wall
      this.vx *= -1;
      ret = true;
    }
    if(nextX+this.rad/2 >= width && this.vx > 0){ //right wall
      this.vx *= -1;
      ret = true;
    }
    if(nextY-this.rad/2 <= 0 && this.vy < 0){ //floor
      this.vy *= -1;
      ret = true;
    }
    if(nextY+this.rad/2 >= height && this.vy > 0){ //ground
      this.isDead = true;
      ret = true;
    }
    return ret;
  }
  this.doCollisionPaddle = function(x,y,rw,rh){ //draw coords of paddle
    if(collideRectCircle(x,y,rw,rh,this.x,this.y,this.rad)){
      if(this.vy > 0){
        //this.vy *= -1;
        if(collideRectCircle(x,y, rw/7, rh, this.x,this.y,this.rad)){
          this.vx = -random(7,12);
        }else if(collideRectCircle(x+(6*rw/7), y, rw/7, rh, this.x,this.y,this.rad) ){
          this.vx = random(7,12);
        }
        this.vy = -random(7,12);
      }
      
    }
  }
  
  this.show = function(){
    ellipse(this.x,this.y,this.rad);
    stroke(0,0,255)
    line(this.x,this.y,this.x+this.vx,this.y+this.vy);
  }
}