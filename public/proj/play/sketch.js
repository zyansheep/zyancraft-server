var socket = new WebSocket("ws://"+location.hostname+(location.port ? ':'+location.port : '')+"/ws");

var gameMap = new Map();

var commandMap = new Map();
var gameSettings = {
  name: "draw",
  players: []
}

commandMap.set("setgame", {Desc:"Set the game", Func:function(args){
  if(UserType != "admin"){ addChat("To request a change of game use /votegame [game]"); return; }
  if(gameMap.has(args[1])){
    send("command", args);
  }else{
    addChat("That game does not exist");
  }
}, AutoCompletions: [{Index:2, Type:"Game"}]})
commandMap.set("chainreaction", {Desc:"Chain Reaction Command", Func:function(args){
  if(gameSettings.name == "chainreaction"){
    if(UserType == "admin" && args[1] == "restart"){
      send("command", args);
    }
  }else{
    addChat("Sorry, the current game is: " + gameSettings.name);
  }
}})
commandMap.set("w", {Desc:"Whispers to specified player", Func:function(args){
  if(args.length > 2){
    send("command", args);
  }else{
    addChat("The format is /w <User> ...");
  }
  //addChat("Whispering is not implemented yet...");
}})
commandMap.set("list", {Desc:"Lists Players", Func:function(args){
  addChat("Users Online: " + gameSettings.players.join(", "));
}})
var greetings = ["Hi!", "Hey!", "Hello", "Greetings", "Salut!", "Good Day", "Fancy meeting you here!", "Aloha!", "Salutations!"]
commandMap.set("hi", {Desc:"Give a random greeting", Func:function(args){
  send("chat", {user: UserName, message: greetings[round(random(greetings.length-1))]} );
}})
commandMap.set("clear", {Desc: "Clears the chat", Func:function(args){
  chatDisplay.innerHTML = "";
}})
commandMap.set("help", {Desc:"Display Help Menu", Func:function(args){
  if(args[1] !== undefined){
    if(commandMap.has(args[1])){
      addChat(commandMap.get(args[1]).Desc);
      return;
    }
  }
  addChat("List of commands:");
  if(UserType == "admin"){
    addChat("/setgame <game>");
    addChat("/chainreaction <command>")
  }
  //addChat("[WIP] /votegame <game>");
  addChat("/w <player> <text>")
  addChat("/hi")
  addChat("/list")
  addChat("/help [command]")
}, AutoCompletions: [{Index:2, Type:"Command"}] } )

gameMap.set("draw", new DrawGame());
gameMap.set("cubeshooter", new CubeshooterGame());
gameMap.set("chainreaction", new ChainReactionGame());

//CAN ONLY REACH THIS PAGE IF USER IS LOGGED IN!!!
if(!UserIsLogged){ window.location.href="/home/#login"; }
socket.onopen = function(event) {
  console.log('WebSocket is connected.');
  socket.onmessage = function(event){
    var data = JSON.parse(event.data);
    if(!gameHandler(data.key, data.content)){
      var curGame = getCurGame();
      curGame.handle(data.key, data.content);
    }
  }
  socket.onclose = function(event) {
    console.log('Socket Closed by Server', event);
    addChat("Connection Closed");
  };
};
socket.onerror = function(error) {
  console.log('WebSocket Error: ' + error);
  window.location.href = "/home/#login"
};
function send(key, data){
  //Alias for socket.send and json compress
  socket.send(JSON.stringify({key: key, content: data}));
}

//handler for non-game socket keys
function gameHandler(key, data){
  switch(key){
    case "chat-init":
    if(data == undefined){ break; }
    for (i = 0; i < data.length; i++) {
      addChat(data[i].user +": "+data[i].message);
    }
    return true;
    case "game-init":
    if(gameSettings.name != data.name){
      setGame(data.typegame);
    }
    gameSettings = data;
    return true;
    case "chat":
    addChat(data.user +": " + data.message);
    return true;
    case "chat-raw":
    addChat(data.message);
    return true;
    case "chat-banner": //Set banner
    chatBanner.innerHTML = data.user +" "+data.message;
    return true;
  }
  return false;
}
function sendChat(message){
  if(message.charAt(0) == '/'){ //is command? send to server
    message = message.substr(1); //delete slash
    parseCommand(message, 0);
  }else{
    send("chat", {user: UserName, message: message})
  }
}
function parseCommand(command, getAutocomplete){
  //getAutocomplete 0 == exec command
  //1 == return autocompleted command
  //2 == print possible autocompletions
  comArgs = command.split(" "); //split by space
  comArgs[0] = comArgs[0].toLowerCase(); //commands are not case-sensitive
  if(getAutocomplete == 0){
    comObj = commandMap.get(comArgs[0]); //get command function
    if(comObj != undefined){ comObj.Func(comArgs); } //if command existss, execute function
    else { addChat(comArgs[0] + ": command not found"); return; } //else print error
  }else{
    
    var uncompletedArg = comArgs.slice(-1); //get last arg (the one not completed)
    var potentialArgs = []; //potential completions
    if(comArgs.length == 1){ //if first argument, complete command
      for(const [key, obj] of this.commandMap.entries()){
        if(key.startsWith(uncompletedArg)){
          potentialArgs.push(key);
        }
      }
    }else{ //else complete username
      //check if autocompletion option is specified in command object
      var compArray = gameSettings.players;
      
      comObj = commandMap.get(comArgs[0]);
      console.log("ComObj: ",comObj);
      if(comObj != undefined){
        if(comObj.AutoCompletions != undefined){
          if(comObj.AutoCompletions.length > 0){
            for (const item of comObj.AutoCompletions) {
              if(item.Index == comArgs.length){
                switch(item.Type){
                  case "Command":
                  compArray = Array.from( commandMap.keys() );
                  break;
                  case "Game":
                  compArray = Array.from( gameMap.keys() );
                  break;
                  case "Custom":
                  if(item.CustomCompletion != undefined){
                    compArray = item.CustomCompletion;
                  }
                  break;
                }
                break;
              }
            }
          }
        }
      }
      for(const item of compArray){
        if(item.startsWith(uncompletedArg)){
          potentialArgs.push(item);
        }
      }
    }
    print(potentialArgs);
    if(getAutocomplete == 1){ //return autocompleted commands
      if(potentialArgs.length == 1){
        comArgs[comArgs.length-1] = potentialArgs[0];
        return comArgs.join(" ");
      }else{
        return command;
      }
    }else{
      if(potentialArgs.length > 1){
        addChat("Potential completions: " + potentialArgs.Join(" "));
      }
    }
  }
}

function setup(){
  cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("sketch-container");
  pixelDensity(1);
}
function setGame(name){
  if(gameMap.has(name)){
    gameSettings.name = name;
    addChat("Setting to game type: " + data.typegame);
  }
}
function mousePressed(){
  if(typeof getCurGame().mousePressed !== "undefined"){
    getCurGame().mousePressed(mouseX, mouseY);
  }
}
function mouseReleased(){
  if(typeof getCurGame().mouseReleased !== "undefined"){
    getCurGame().mouseReleased(mouseX, mouseY);
  }
}
function mouseDragged(){
  if(typeof getCurGame().mouseDragged !== "undefined"){
    getCurGame().mouseDragged(mouseX, mouseY);
  }
}
function mouseMoved(){
  if(typeof getCurGame().mouseMoved !== "undefined"){
    getCurGame().mouseMoved(mouseX, mouseY);
  }
}

//Chat stuff
isTyping = false;
function addChat(str){
  chatDisplay.innerHTML += str+'<br>';
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}
var chatBox = document.getElementById("chat_textbox");
var chatDisplay = document.getElementById("chat_display");
var chatBanner = document.getElementById("chat_banner");
chatBox.onblur = function() {
  isTyping = false;
  chatHistoryIndex = -1;
};
chatBox.onfocus = function() {
  isTyping = true;
  chatHistoryIndex = -1;
};

var chatHistoryIndex = -1;
var chatHistory = []; //your previous chat commands

var didTab = false; //did try autocomplete? (used to display possiblt autocompletions if more than 1)
function keyPressed(){
  if(keyCode != 91){
    didTab = false;
  }
  print("Keypressed: "+ keyCode)
  if(keyCode == 191 && !isTyping){ //if slash key pressed
    chatBox.focus();
    //chatBox.value = "/";
  }
  if(keyCode == 13){ //if enter pressed
    if (isTyping) { //if is focused
      chatBox.blur();
      var chattxt = chatBox.value;
      if (chattxt.length > 0) sendChat(chattxt);
      chatBox.value = "";
      chatHistory.splice(0,0,chattxt);
    } else chatBox.focus(); //if not focused, focus
  }
  //Keys that can be pressed while typing
  if(isTyping){
    if(keyCode == 91){ //command key for autocompletion (find way to work with tab)
      var message = chatBox.value;
      if(message.charAt(0) == '/'){ //autocompletion is only for commands (can't read people's mind)
      message = message.substr(1); //delete slash
      if(!didTab){
        messageCompleted = parseCommand(message, 1);
        //if message didn't change (because more than 1 autocompletion)
        if(messageCompleted === message){
          didTab = true;
        }
        chatBox.value = "/" + messageCompleted;
      }else{
        didTab = false;
        parseCommand(message, 2);
      }
    }
  }else if(keyCode == 38){ //up arrow pressed
    if(chatHistoryIndex < chatHistory.length-1){
      chatHistoryIndex++;
      chatBox.value = chatHistory[chatHistoryIndex];
    }
  }else if (keyCode == 40) { //down arrow pressed
    if(chatHistoryIndex > -1){
      chatHistoryIndex--;
      if(chatHistoryIndex >= 0){
        chatBox.value = chatHistory[chatHistoryIndex];
      }else{
        chatBox.value = "";
      }
    }
  }
}else{
  if(typeof getCurGame().keyPressed !== "undefined"){
    getCurGame().keyPressed(keyCode);
  }
}
}
function draw(){
  if(!getCurGame().didInit){
    getCurGame().init();
  }
  getCurGame().draw();
}
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  getCurGame().windowResized();
}
function getCurGame(){
  var curGame = gameMap.get(gameSettings.name);
  if(curGame == undefined){ console.log("Game " + gameSettings.name + " Does not exist"); }
  return curGame;
}
