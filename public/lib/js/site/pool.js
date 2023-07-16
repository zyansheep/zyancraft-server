if(UserIsLogged && UserType != "guest"){
  document.getElementsByClassName("upload-btn-wrapper")[0].style.display = "inline-block"
  document.getElementById("canDo").innerHTML = "You can upload files and they will appear here"
}

//exitmosueover functions
var exitMouseOver = false;
function setExitMouseOver(inState){
  exitMouseOver = inState;
}
function closeAllExitButtons(){
  exitButtonArr = document.getElementsByClassName("frame-close");
  for(var i=0;i<exitButtonArr.length;i++){
    exitButtonArr[i].style.visibility = "hidden";
  }
}

//iframe updating
function closeFrame(exitbutton){
  var frame = exitbutton.parentNode.getElementsByClassName("frames")[0];
  
  frame.contentWindow.location.replace("about:blank");
  exitbutton.style = "visibility: hidden;";
}
$(document).dblclick(function(){
  window.focus();
})
setTimeout(function(){ window.focus(); }, 0.5);

var frameWrapper;
var exitbutton;
var frame;
$(document).ready( function() {
  var overiFrame = "";
  $('iframe').hover( function() {
    overiFrame = $(this).closest('.frame-wrapper').attr('id');
    frameWrapper = document.getElementById(overiFrame);
    frame = frameWrapper.getElementsByClassName("frames")[0];
    exitbutton = frameWrapper.getElementsByClassName("frame-close")[0];
    
    if(frame.contentWindow.location.href !== "about:blank"){
      exitbutton.style.visibility = "visible";
    }
    
  }, function() {
    overiFrame = "";
    
    //make sure this is delayed untill after exitMouseOver is updated
    setTimeout(function() {
      //if frame is initialized and not mouseing over the button then hide all buttons
      if(frame != undefined){
        if(frame.contentWindow.location.href !== "about:blank" && !exitMouseOver){
          exitbutton.style.visibility = "hidden";
        }
      }
    }, 0);
  });
  $(window).blur( function() {
    if( overiFrame != "" ){
      if(frame.contentWindow.location.href === "about:blank"){
        var fUrl = "/proj/pool/" + overiFrame;
        
        closeAllExitButtons();
        frame.contentWindow.location.replace(fUrl);
        exitbutton.style.visibility = "visible";
        console.log("Set frame: ",frame, exitbutton);
      }
      setTimeout(function(){ window.focus(); }, 0);
    }
  });
});

//upload button stuff
var file
$('.upload-btn-wrapper input[type=file]').change(function(e){
  var para = $(".upload-display")[0];
  para.style.display = "block";
  para.textContent = "Selected: " + e.target.files[0].name;
  
  console.log(e.target.files[0]);
  $("#submit")[0].style.display = "inline-block";
  $("#curl-copy")[0].style.display = "inline-block";
  
  file = e.target.files[0];
});
$("#submit").click(function(){
  var form = new FormData();
  console.log(file);
  form.append("uploadfile", file);
  jQuery.ajax({
    url: '/proj/pool',
    data: form,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    type: 'POST', // For jQuery < 1.9
    success: function(data){
      window.location.reload()
    }
  });
});


function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

$("#curl-copy").click(function(){
  var curlTxt = "curl --cookie \"da-cookie=\"" + getCookie("da-cookie")
  curlTxt += " " + window.location.href + " -F \"uploadfile=@/path/to/"
  curlTxt += $(".upload-btn-wrapper").children("input")[0].files[0].name + "\"";
  copyToClipboard(curlTxt);
});
function copyToClipboard(str){
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};
//shrink spans
/*$(function() {
    while( $('.link-span').height() > $('.frame-wrapper').height() ) {
        $('.link-span').css('font-size', (parseInt($('.link-span').css('font-size')) - 1) + "px" );
    }
});*/