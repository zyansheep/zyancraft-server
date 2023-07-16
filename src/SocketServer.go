package main

import(
  "net/http"
  "github.com/gorilla/websocket"
  "strings"
  "encoding/json"
  "sync"
  "fmt"
  "strconv"
)

//http to websocket upgrader
var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

var chat []chatObj;
var gameSettings = gameObj{chainreactionKey, []string{}} //Default Game, player array
type client struct{
  Socket *websocket.Conn
  mutx sync.Mutex
  User *User;
}
var clients = make(map[string]*client);

type packet struct{
  Key string `json:"key"`
  Content json.RawMessage `json:"content"`
}
var funcMap = map[string]func(*client, packet, string){
  "chat": chatHandler,
  "chat-init": chatInit,
  "draw": drawHandler,
  "cubeshooter": cubeshooterHandler,
  "chainreaction-init": chainreactionInitHandler,
  "chainreaction": chainreactionHandler,
  
  "command": commandHandler,
  "game-init": gameInit,
}

type chatObj struct{ Message string `json:"message"`; User string `json:"user"`; }

var chatBannerKey = "chat-banner";
var chainreactionKey = "chainreaction"
func chatInit(conn *client, msg packet, user string){
  //Send chat history as array
  var err error;
  msg.Content, err = json.Marshal(chat);
  handle(err);
  conn.send(msg);
  
  //Broadcast Join notification normally
  msg.Key = chatBannerKey;
  msg.Content, err = json.Marshal(chatObj{"joined", user}); //Display "[user] joined" to chat banner
  handle(err);
  broadcast <- msg;
}
func chatHandler(conn *client, msg packet, user string){
  broadcast <- msg; //broadcast
  
  //Add to chat array
  var message chatObj;
  err := json.Unmarshal([]byte(msg.Content), &message)
  handle(err)
  chat = append(chat, message);
  if(len(chat) >= 30){
    chat = chat[1:]
  }
  
  handle(err);
}
type drawObj struct{ X float64 `json:"x"`; Y float64 `json:"y"`; User string `json:"user"`; DoReset bool `json:"doReset"`; }
func drawHandler(conn *client, msg packet, user string){
  var pos drawObj
  err := json.Unmarshal([]byte(msg.Content), &pos)
  handle(err)
  pos.User = user;
  var rmsg = msg;
  rmsg.Content, err = json.Marshal(pos);
  handle(err);
  //broadcast message
  broadcast <- rmsg;
}
type cubeshooterObj struct{ X float64 `json:"x"`; Y float64 `json:"y"`; User string `json:"user"`; }
func cubeshooterHandler(conn *client, msg packet, user string){
  var obj cubeshooterObj
  //println(string(msg.Content));
  err := json.Unmarshal([]byte(msg.Content), &obj)
  handle(err)
  obj.User = user;
  var rmsg = msg;
  rmsg.Content, err = json.Marshal(obj);
  handle(err);
  broadcast <- rmsg;
}

type chainreactionObj struct{ Num float64 `json:"num"`; Max float64 `json:"max"`; Player string `json:"player"`; didExplodeThisTurn bool; }
var chainreactionBoard [][]chainreactionObj;
var chainreactionSizeX = 5;
var chainreactionSizeY = 5;
var isChainreactionRunning = false;
var chainreactionPlayers []int; //After new game, all clients join. this stores indexs
var chainreactionCurPlayer = 0;
func chainreactionInitHandler(conn *client, msg packet, user string){
  if(len(gameSettings.Players) < 2){ return; }
  if(!isChainreactionRunning){
    println("User", user,"initiated chainreaction");
    chainreactionPlayers = nil;
    genPlayerList(); //Make sure player list is up-to-date
    for i := range gameSettings.Players{
      chainreactionPlayers = append(chainreactionPlayers, i);
    }
    
    //If not running, on first person connecting, generate board
    isChainreactionRunning = true;
    chainreactionBoard = make([][]chainreactionObj, chainreactionSizeY); 
    for y := 0; y < chainreactionSizeY; y++ {
      chainreactionBoard[y] = make([]chainreactionObj, chainreactionSizeX);
      for x := 0; x < chainreactionSizeX; x++ {
        maxVal := 4;
        if(x == 0){ maxVal--; }
        if(y == 0){ maxVal--; }
        if(x == chainreactionSizeX-1){ maxVal--; }
        if(y == chainreactionSizeY-1){ maxVal--; }
        
        chainreactionBoard[y][x] = chainreactionObj{ 0, float64(maxVal), "", false }
      }
    }
  }else if(len(chainreactionPlayers) < 2){
    //if less than 2 players playing, add latest player joined.
    chainreactionPlayers = append(chainreactionPlayers, len(gameSettings.Players)-1);
  }
  //calculate recommended size
  chainreactionSizeX = 3+len(chainreactionPlayers);
  chainreactionSizeY = chainreactionSizeX;
  
  var err error;
  msg.Key = chainreactionKey;
  msg.Content, err = json.Marshal(chainreactionBoard);
  handle(err);
  broadcast <- msg;
  
  //Broadcast player list to everyone (rotated so that index 0 is current player to move)
  msg.Key = "chainreaction-playerlist";
  
  msg.Content, err = json.Marshal( rotate(chainreactionPlayers, chainreactionCurPlayer) );
  handle(err);
  broadcast <- msg;
  
  //var chainreactionPlayersString = string(mu(json.Marshal(chainreactionPlayers))[0].([]byte));
  //println(chainreactionPlayersString + " (Init) " + user + " " + string(msg.Content) + " Rot: " + strconv.Itoa(chainreactionCurPlayer));
}
func chainreactionHandler(conn *client, msg packet, user string){
  if(!isChainreactionRunning){
    println("User",user,"connected to chainreaction but game was not initialized")
    return;
  }
  type crPos = struct { X int; Y int; User string; };
  var pos crPos;
  err := json.Unmarshal(msg.Content, &pos);
  handle(err)
  //check if index exists in chainreactionBoard and right player
  if(0 <= pos.Y && pos.Y < len(chainreactionBoard) && gameSettings.Players[chainreactionPlayers[chainreactionCurPlayer]] == user){
    if(0 <= pos.X && pos.X < len(chainreactionBoard[pos.Y])){
      var isExploding = false;
      
      chbRef := &chainreactionBoard[pos.Y][pos.X];
      //Add number to board, detect if exploding
      if(chbRef.Player == "" || chbRef.Player == user){
        chbRef.Num++;
        chbRef.Player = user;
        if(chbRef.Num >= chbRef.Max){
          isExploding = true;
        }
        //broadcast movement to all other users so animation can play (before board sync)
        pos.User = user;
        var movMsg packet;
        movMsg.Key = "chainreaction-move";
        movMsg.Content, _ = json.Marshal(pos);
        broadcast <- movMsg;
        
        //Increment current player variable
        if(chainreactionCurPlayer == len(chainreactionPlayers)-1){
          chainreactionCurPlayer = 0;
        }else{
          chainreactionCurPlayer++;
        }
        
        //Send rotated playerlist to all clients
        var listMsg packet;
        listMsg.Key = "chainreaction-playerlist";
        listMsg.Content, err = json.Marshal( rotate(chainreactionPlayers, chainreactionCurPlayer) );
        handle(err);
        broadcast <- listMsg;
        
        //var chainreactionPlayersString = string(mu(json.Marshal(chainreactionPlayers))[0].([]byte));
        //println(chainreactionPlayersString + " (Move) " + user + " " + string(listMsg.Content) + " Rot: " + strconv.Itoa(chainreactionCurPlayer));
      }
      endGameFlag := false;
      if(isExploding && !endGameFlag){ println("Calculating Explosion"); }
      for (isExploding && !endGameFlag) { //if exploding and endGameFlag not tripped, do explode cycle
        var addVector []crPos;
        
        //Cycle through exploding squares
        endGameFlag = true;
        for y := range chainreactionBoard {
          for x := range chainreactionBoard[y] {
            item := &chainreactionBoard[y][x];
            if(item.Num >= item.Max){
              item.Num -= item.Max;
              addVector = append(addVector, crPos{x+1, y, user}, crPos{x-1,y, user}, crPos{x,y+1, user}, crPos{x,y-1, user});
              if(item.Num == 0){
                item.Player = "";
              }
            }
            if(!item.didExplodeThisTurn){
              endGameFlag = false;
            }
          }
        }
        //fmt.Printf("%v\n", addVector)
        
        //add all entries in addVector to board
        isExploding = false;
        for i := range addVector {
          adPos := &addVector[i];
          //test if add index exists in board
          if(0 <= adPos.Y && adPos.Y < len(chainreactionBoard)){
            if(0 <= adPos.X && adPos.X < len(chainreactionBoard[adPos.Y])){
              var ref2 = &chainreactionBoard[adPos.Y][adPos.X];
              ref2.Num++;
              ref2.Player = user;
              if(ref2.Num >= ref2.Max){
                ref2.didExplodeThisTurn = true;
                isExploding = true;
              }
            }
          }
        }
      }
      
      //reset board didExplodeThisTurn
      for y := range chainreactionBoard{
        for x := range chainreactionBoard[y]{
          chainreactionBoard[y][x].didExplodeThisTurn = false;
        }
      }
      if(isExploding){
        var winMsg packet;
        winMsg.Key = chatBannerKey;
        winMsg.Content, _  = json.Marshal(chatObj{"Won Chain Reaction!", user})
        broadcast <- winMsg;
        //chat = append(chat, "Player "+user+" won Chain Reaction!");
        println("Player",user,"won!")
        isChainreactionRunning = false;
        for user,cli := range clients {
          chainreactionInitHandler(cli,msg,user);
        }
      }
    }
  }
  
  msg.Content, err = json.Marshal(chainreactionBoard); //Send new board to all users
  handle(err);
  broadcast <- msg;
}

func broadcastHandler(conn *client, msg packet, user string){
  broadcast <- msg;
}

func commandHandler(conn *client, msg packet, user string){
  var comm []string;
  err := json.Unmarshal([]byte(msg.Content), &comm);
  handle(err);
  switch comm[0] {
  case "setgame":
    if(UMap[user].Type == "admin"){
      gameSettings.Name = comm[1];
      msg.Key = "game-init";
      msg.Content, _ = json.Marshal(gameSettings);
      broadcast <- msg;
    }
    break;
  case chainreactionKey:
    if(gameSettings.Name == chainreactionKey){
      if(comm[1] == "restart"){
        if(len(comm) > 3){
          chainreactionSizeX, _ = strconv.Atoi(comm[2]);
          chainreactionSizeY, _ = strconv.Atoi(comm[3]);
        }
        isChainreactionRunning = false;
        
        //update user list (in case someone joined);
        msg.Key = "game-init";
        msg.Content, _ = json.Marshal(gameSettings);
        broadcast <- msg;
        
        for user,cli := range clients {
          chainreactionInitHandler(cli,msg,user);
        }
      }
    }
    break;
  case "w":
    fmt.Println("Recieved whisper",comm);
    if len(comm) > 2 {
      if cli, ok := clients[comm[1]]; ok {
        msg.Key = "chat-raw"
        msg.Content, _ = json.Marshal(chatObj{"["+user+"] " + strings.Join(comm[2:], " "), user});
        cli.send(msg);
      }
    }
  }
}
type gameObj struct{ Name string `json:"name"`; Players []string `json:"players"` }
func genPlayerList(){
  gameSettings.Players = nil;
  for usr := range clients{
    gameSettings.Players = append(gameSettings.Players, usr);
  }
}
func gameInit(conn *client, msg packet, user string){
  if(!contains(gameSettings.Players, user)){
    gameSettings.Players = append(gameSettings.Players, user);
  }
  
  //send new game data to all users.
  msg.Content, _ = json.Marshal(gameSettings);
  broadcast <- msg;
}

var broadcast = make(chan packet) //Write messages here to broadcast to all users
func socketMain() {
  for{
    //Get any new message from broadcast
    msg := <-broadcast
    for usr,client := range clients{
      //write message from channel to all other clients
      err := client.send(msg);
      
      //delete client if didn't write correctly
      if err != nil{
        logRaw("[Socket]" + usr + " Error Disconnected");
        //log.Println("Error Disconnected: ", err);
        client.Socket.Close();
        delete(clients, usr);
      }
    }
  }
}

func socketHandler(w http.ResponseWriter, r *http.Request) {
  //get session data
  session, err := store.Get(r, "da-cookie");
  handle(err);
  
  if !checkSession(session){
    Log("WebSocket", "Error no Session or user not authed", r);
    return;
  }
  user := getUser(session);
  //Init new websocket
  conn, err := upgrader.Upgrade(w, r, nil)
  //conn, err := upgrader.Upgrade(w, r, nil)
  cli := &client{Socket: conn, User: user}
  defer cli.Socket.Close();
  if(handle(err)){
    Log("WebSocket", "Connection could not be made by: "+user.Name, r);
  }
  
	clients[user.Name] = cli //register connection
  var msgInit packet
  //calling all init functions
  for k,v := range(funcMap){
    if strings.Contains(k, "init"){
      msgInit.Key = k;
      v(cli, msgInit, user.Name);
    }
  }
  Log("WebSockets", user.Name + " Connected",r);
  
  //handler loop
  for{
    var msg packet;
    //read message from JSON format
    err := cli.Socket.ReadJSON(&msg)
    ok := checkSession(session);
    if err != nil || !ok { // if some kind of error, or session expired
      Log("WebSocket", user.Name + " Disconnected", r);
      //add leaving message to chat banner
      msg.Key = chatBannerKey
      msg.Content, _ = json.Marshal(chatObj{"left", user.Name})
      broadcast <- msg;
      delete(clients, user.Name)
      break;
    }
    
    //get handler function based on json key from funcMap and pass data to function
    if funcObj, ok := funcMap[msg.Key]; ok{
      funcObj(cli, msg, user.Name);
    }
  }
}

//Sending with Mutex
func (p *client) send(v interface{}) error {
    p.mutx.Lock()
    defer p.mutx.Unlock()
    return p.Socket.WriteJSON(v)
}
