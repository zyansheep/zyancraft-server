
function loadPageJS(){
  //Load login attributes
  var script = document.createElement('script');
  script.src = "/login";
  document.head.appendChild(script);
  
  var backButton = document.createElement('a');
  backButton.id = "backButton";
  backButton.innerHTML = "<- to Zyancraft Home";
  backButton.href = "/home"
  document.body.appendChild(backButton);
  
  script.onload = function () {
    //Make login status div
    userStatDiv = document.createElement('div');
    userStatDiv.id = "userStatus";
    document.body.appendChild(userStatDiv)
    
    if(UserIsLogged){
      userStatDiv.innerHTML = "Logged in as: " + UserName;
      userStatDiv.style.display = "block";
    }
  };
}
window.onload = loadPageJS;