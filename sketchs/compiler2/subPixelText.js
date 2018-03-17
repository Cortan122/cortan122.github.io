var __createCanvas =function(w,h){
  var c = document.createElement("canvas");
  c.width  = w;
  c.height = h;
  c.ctx    = c.getContext("2d");
  //document.body.appendChild(c);
  return c;
}

// converts pixel data into sub pixel data
var subPixelBitmap = function(imgData){
  var spR,spG,spB; // sub pixels
  var id,id1; // pixel indexes
  var w = imgData.width;
  var h = imgData.height;
  var d = imgData.data;
  var x,y;
  var ww = w*4;
  var ww4 = ww+4;
  for(y = 0; y < h; y+=1){
    for(x = 0; x < w; x+=3){
      var id = y*ww+x*4;
      var id1 = Math.floor(y)*ww+Math.floor(x/3)*4;
      spR = Math.sqrt(d[id + 0] * d[id + 0] * 0.2126 + d[id + 1] * d[id + 1] * 0.7152 + d[id + 2] * d[id + 2] * 0.0722);
      id += 4;
      spG = Math.sqrt(d[id + 0] * d[id + 0] * 0.2126 + d[id + 1] * d[id + 1] * 0.7152 + d[id + 2] * d[id + 2] * 0.0722);
      id += 4;
      spB = Math.sqrt(d[id + 0] * d[id + 0] * 0.2126 + d[id + 1] * d[id + 1] * 0.7152 + d[id + 2] * d[id + 2] * 0.0722);
      
      var u = (subPixelTextType != 'thick')?(
              (subPixelTextType == 'thin')?spG&&spB&&spR:undefined):spG+spB+spR;
      d[id1++] = subPixelBitmap.helper(spR,u);
      d[id1++] = subPixelBitmap.helper(spG,u);
      d[id1++] = subPixelBitmap.helper(spB,u);
      d[id1++] = 255;  // alpha always 255
    }
  }
  return imgData;
}

subPixelBitmap.helper = function(a,u){
  var r = (u !== undefined)?u:a;
  if(!subPixelTextBlur)r = r?255:0;
  return r;
};

// Assume default textBaseline and that text area is contained within the canvas (no bits hanging out)
// Also this will not work is any pixels are at all transparent
var subPixelText = function(ctx,text,x,y,fontHeight){
  if(subPixelTextType == 'none')return ctx.fillTextBackup(text,x,y);
  var width = ctx.measureText(text).width + 12; // add some extra pixels
  var hOffset = Math.floor(fontHeight *0.7);
  var c = __createCanvas(width * 3,fontHeight);
  c.ctx.font = ctx.font;
  c.ctx.fillStyle = ctx.fillStyle;
  c.ctx.fontAlign = "left";
  c.ctx.setTransform(3,0,0,1,0,0); // scale by 3
  // turn of smoothing
  c.ctx.imageSmoothingEnabled = false;  
  c.ctx.mozImageSmoothingEnabled = false;  
  // copy existing pixels to new canvas
  c.ctx.drawImage(ctx.canvas,x -2, y - hOffset, width,fontHeight,0,0, width,fontHeight );
  c.ctx.fillText(text,0,hOffset);  // draw thw text 3 time the width
  // convert to sub pixel 
  c.ctx.putImageData(subPixelBitmap(c.ctx.getImageData(0,0,width*3,fontHeight)),0,0);
  ctx.drawImage(c,0,0,width-1,fontHeight,x,y-hOffset,width-1,fontHeight);
  // done
}

var subPixelTextType = 'none';//['none','normal','thin','thick']
var subPixelTextBlur = true;

function initSubPixelText(){
  if(subPixelTextType == 'none')return;
  drawingContext.fillTextBackup = drawingContext.fillText;
  drawingContext.fillText = function(text,x,y){
    subPixelText(this,text,x,y,textSize());
  };
}