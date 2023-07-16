function toggleLoginType() {
  var passInput = document.getElementById("password");
  var loginTypeToggler = document.getElementById("toggleType");
  if (loginTypeToggler.innerHTML === "Login as User") {
    passInput.style.visibility = "visible";
    loginTypeToggler.innerHTML = "Login as Guest"
  } else {
    passInput.style.visibility = "hidden";
    loginTypeToggler.innerHTML = "Login as User"
  }
}
function checkAuthForURL(event, url){
  if(UserIsLogged){
    location.href = url;
  }else{
    event.preventDefault();
    deployErrorDisplay("Must be logged in to go there");
  }
}
function changepage(inputstr) {
  var pages = document.getElementsByClassName("page")
  var visiblepage = document.getElementById(inputstr);
  if(!visiblepage){ return; }
  
  for(i=0; i<pages.length; i++) {
    pages[i].removeAttribute("style")
  }
  //if user logged in, make login page into logout button
  if(inputstr == "login"){
    if(UserIsLogged){
      //Logout
      $.post( "/logout", function(data){});
      reload_js("/login",  loadLogin);
      changepage("news");
      return;
    }else{
      //check for chrome password autofill, if yes than most likely a user (show password box)
      $('#password').each(function(){
        if($(this).val() != ""){
          if($("#toggleType").html() == "Login as User"){
            toggleLoginType();
          }
        }
      });
    }
  }
  visiblepage.style.display = "block";
}
function deployErrorDisplay(data){
  var errPopup = $("#errorPopup")
  errPopup.stop();
  errPopup.html(data)
  errPopup.fadeIn(10);
  errPopup.fadeOut(3000);
}
function reload_js(src, callback) {
  $.ajaxSetup({
    cache: false
  });
  console.log(src);
  $.getScript(src)
  .done(function(){
    callback();
  })
  .fail(function (jqxhr, settings, exception){
    deployErrorDisplay("Could not load login information");
  })
}
function loadLogin(){
  loginStatus = $("#userStatus")[0];
  loginButton = $("#loginButton")[0];
  if(UserIsLogged){
    loginButton.innerHTML = "Logout";
    loginStatus.innerHTML = "Logged in as: " + UserName;
    loginStatus.style.display = "block";
  }else{
    loginButton.innerHTML = "Login";
    loginStatus.style.display = "none";
  }
}

var isSending = false;
$( document ).ready(function() {
  //Load login information
  reload_js('/login', loadLogin);
  
  changepage(window.location.hash.substring(1))
  //On change page hash (so that you can go to certain pages using url)
  window.addEventListener("hashchange", function(event){
    changepage(window.location.hash.substring(1))
  });
  
  $("#loginForm").on("submit", function(event){
    event.preventDefault();
    if(isSending || UserIsLogged){ return; }
    isSending = true;
    var form = new FormData($(this)[0]);
    $.ajax({
      url: '/login',
      data: form,
      cache: false,
      contentType: false,
      processData: false,
      method: 'POST',
      type: 'POST', // For jQuery < 1.9
    }).done(function(data) {
      if(data != "Success"){
        deployErrorDisplay(data);
      }else{
        reload_js('/login', loadLogin);
        changepage("news");
      }
      isSending = false;
    }).fail(function( jqXHR, textStatus ) {
      deployErrorDisplay("Couldn't connect to server");
      isSending = false;
    });
  });
});

//change html background (to fix scroll)
/*var scrollPos = $(window).scrollTop(); 
$(window).scroll(function() {
  var scroll = $(window).scrollTop();
  if(scroll > scrollPos) {
    console.log('scrollDown');
    $('html').css("background-color", "black");
  } else {
    console.log('scrollUp');
    $('html').css("background-color", "green");
  }
  scrollPos = scroll;
});*/