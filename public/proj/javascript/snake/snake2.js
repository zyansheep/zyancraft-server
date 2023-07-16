function snake2(){
  this.x = 450;
  this.y = 300;
  this.slen=0
  this.tail=[]
  
  this.death = function(){
    for(i=0;i<this.tail.length;i++){
      if(this.tail[i]!==undefined){
        if(this.x===this.tail[i].x & this.y===this.tail[i].y || this.x === s.tail[i].x & s.y === s.tail.y){
          this.slen=1;
          this.tail = [];
        }
      }
    }
  }
  this.update = function(){
    if(this.slen === this.tail.length){
      for(var i=0;i<this.tail.length-1;i++){
        this.tail[i] = this.tail[i+1];
        this.tailcolor[i]=this.tailcolor[i+1];
      }
    }
    //add tail position
    this.tail[this.slen-1] = createVector(this.x,this.y);
    
    //update x and y position
    this.x = this.x + this.xspeed*scl;
    this.y = this.y + this.yspeed*scl;
    //dont go out of map
    this.x = constrain(this.x, 0, width-scl);
    this.y = constrain(this.y, 0, height-scl);
  }
  this.show = function(){
    //white
    fill(50,255,50);
    //loop through tail.length then make rectangle
    for(var f=0;f<this.tail.length;f++){
      //if its undefined DONT DO
      if(this.tail[f] !== undefined){
        //ranbow
        if(this.rainbow){
          colorMode(HSB);
          fill(this.tailcolor[f]);
        }
        //draw rect
        rect(this.tail[f].x,this.tail[f].y,scl,scl)
      }
    }
  }
}
