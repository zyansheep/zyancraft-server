self.addEventListener('message', function(e){
  var pxlObj = e.data;
  var pixIndex = 0;
  for(var y=0;y<pxlObj.Height;y+=1){
    for(var x=0;x<pxlObj.Width;x+=1){
      var iter = 0;
      
      //for each point on complex plane (canvas), detect if z is kept within a certain threshold
      //c = a + b*i
      //f(z) = z^2 + c
      //count number of iterations and color point accordingly
      var a = x.map(0, pxlObj.Width, pxlObj.MidX - pxlObj.Zoom, pxlObj.MidX + pxlObj.Zoom); //Normal component of c
      var b = y.map(0, pxlObj.Height, pxlObj.MidY - pxlObj.Zoom, pxlObj.MidY + pxlObj.Zoom); //Complex component of c
      
      var za = 0;
      var zb = 0;
      while(iter < pxlObj.MaxIter){
        var zaNew = za*za - zb*zb + a
        zb = 2*za*zb + b;
        za = zaNew;
        
        if(Math.abs(za + zb) > 10){
          break;
        }
        iter++;
      }
      
      var col = iter.map(0,pxlObj.MaxIter, 0,255, true);
      
      //pixIndex = (y * pxlObj.Width + x) * 4
      pxlObj.Pixels[pixIndex+0] = col;
      pxlObj.Pixels[pixIndex+1] = 0;
      pxlObj.Pixels[pixIndex+2] = col;
      pxlObj.Pixels[pixIndex+3] = 255;
      pixIndex += 4;
    }
  }
  self.postMessage(pxlObj);
})

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}