function snake(){
  //variable calling
  this.x = 300;
  this.y = 300;
  this.xspeed = 0;
  this.yspeed = 0;
  this.slen = 1;
  this.tail = [];
  this.rainbow;
  this.rainbowHue = 0;
  this.tailcolor = [];

  //set xspeed and yspeed
  this.dir = function(x,y){
    this.xspeed = x;
    this.yspeed = y;
  }
  //can snake eat?
  this.ate = function(pos){
    var d = dist(this.x,this.y,pos.x,pos.y);
    if(d < 1){
      this.slen++;
      return true;
    }else{
      return false;
    }
  }

  this.death = function(){
    //print(this.x)
    //print(this.y)
    //print(this.tail[1])
    for(i=0;i<this.tail.length;i++){
      if(this.tail[i]!==undefined){
        if(this.x===this.tail[i].x & this.y===this.tail[i].y){
          this.slen=1;
          this.tail = [];
          /*if(TailCutSound.isPlaying() !== true){
            TailCutSound.play();
          }*/
        }
      }
    }
  }

  this.update = function(){
    //Rainbow update
    this.rainbowHue+=4;
    if(this.rainbowHue>360){this.rainbowHue=0;}

    //shift position forward 1
    if(this.slen === this.tail.length){
      for(var i=0;i<this.tail.length-1;i++){
        this.tail[i] = this.tail[i+1];
        this.tailcolor[i]=this.tailcolor[i+1];
      }
    }
    //add tail position
    this.tail[this.slen-1] = createVector(this.x,this.y);
    //add color (if rainbow)
    colorMode(HSB);
    this.tailcolor[this.slen-1] = color(this.rainbowHue,150,150);
    colorMode(RGB);

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
    //draw front rect + score
    rect(this.x,this.y,scl,scl);
    text("Score: " + this.tail.length,10,10)
    colorMode(RGB)
    //draw eyes
    fill(0,0,0)
    rect(this.x+2,this.y+2,scl/4,scl/4)
    rect(this.x+13,this.y+2,scl/4,scl/4)
  }
}
