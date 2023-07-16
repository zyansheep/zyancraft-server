var commandMap = new Map();

commandMap.set("createroom", {Desc:"Create a new gaming room", Func: function(args){
  send("command", args);
}, AutoCompletions: [{Index:2, Type:"None"}, {Index:3, Type:"Game"}]});
commandMap.set("joinroom", {Desc:"Join an existing gaming room", Func: function(args){
  send("command", args);
}})
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
}, AutoCompletions: [{Index: 2, Type:"User"}, {Index:3, Type:"None"}]})
commandMap.set("list", {Desc:"Lists Players", Func:function(args){
  addChat("Users Online: " + roomInfo.players.join(", "));
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