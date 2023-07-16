package main;

import(
  "net/http"
  "fmt"
  "strings"
  "log"
  
  "net"
  "golang.org/x/crypto/bcrypt" //Hashing library
  "github.com/rs/xid" //Unique user ID library
  "github.com/gorilla/sessions" //Cookie session library
  
  "bufio"
  "os"
  "time"
  
  "archive/zip"
  "encoding/json"
  
  "path/filepath"
  "io"
  "io/ioutil"
  "reflect"
)

//log requests
func logging() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
        idStr := r.RemoteAddr;
        session := getSession(r);
        if(checkSession(session)){
          user := getUser(session);
          if(user != nil){
            idStr = user.Type + " " + user.Name;
          }
        }
        logRaw(idStr+" @", time.Now().Format("Jan _2 2006 15:04:05"), r.Method, r.URL.Path);
			}()
			next.ServeHTTP(w, r)
		})
	}
}
//Log is for feature-specific logging
func Log(logType string, message string, r *http.Request) {
	logStr := r.RemoteAddr
	logStr += " @ " + time.Now().Format("Jan _2 2006 15:04:05")
	logStr += " [" + logType + "] " + message
  logRaw(logStr);
	//fmt.Println(logStr)
}

//Logging to file
var logFile *os.File;
func initLog(path string){
  var fileName = path+time.Now().Format("Jan _2 2006 15:04:05")+".log";
  var err error;
  logFile, err = os.OpenFile(fileName, os.O_RDWR | os.O_CREATE | os.O_APPEND, 0666)
  if err != nil {
    log.Fatalf("[Log] error opening logfile: %v", err);
  }
  log.SetOutput(logFile)
  log.SetFlags(0)
  log.Println("Beginning of Log " + fileName); //Log test
}
func logRaw(toPrint ...interface{}){
  fmt.Println(toPrint...);
  log.Println(toPrint...);
}

func authing(next http.HandlerFunc) http.HandlerFunc {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    session, err := store.Get(r, "da-cookie");
    handle(err);
    if(checkSession(session)){
      user := getUser(session);
      if(user.Type == "admin" ){
        next.ServeHTTP(w, r)
      }else{
        Log("Auth", user.Type + " " + user.Name + " Attempted to access restricted page", r);
        notFoundHandler(w, r);
      }
    }else{
      Log("Auth", "Visitor Attempted to access account-restricted page", r);
      notFoundHandler(w, r);
    }
  })
}

//pass error into this function for reporting
func handle(e error) bool{
  //TOOD: log errors in logfile for bug-fixing
  if e != nil {
    panic(e);
  }
  return false;
}
//turn function that returns 2 objects into array
func mu(a ...interface{}) []interface{} {
    return a
}

//custom filesystem that doesn't return directory listings
type neuteredFileSystem struct {
	fs http.FileSystem
}
func (nfs neuteredFileSystem) Open(path string) (http.File, error) {
  var pathtrans = "public";
  var notFoundPath = "public/lib/404/index.html";
	f, err := nfs.fs.Open(pathtrans + path)
	if err != nil {
		fmt.Println("[404] " + path)
		return nfs.fs.Open(notFoundPath)
	}

	s, _ := f.Stat()
	if s.IsDir() {
		//check if index.html
		index := strings.TrimSuffix(path, "/") + "/index.html"
		//try to open
		if _, err := nfs.fs.Open(pathtrans + index); err != nil {
			fmt.Println("Error 404: " + index)
			return nfs.fs.Open(notFoundPath)
		}
	}

	return f, nil
}

//Password Hashing
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes), err
}

func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

//User structure
type User struct {
	Name string //name of user (if guest, will prefix with "guest-")
	Type string //can be "guest", "user", or "admin"
	Hash string //only users and admins have passwords
  LoggedTime time.Time;
  
  Sessions []string; //Array of IDs that are stored in session cookies
}
//User session store
var store = sessions.NewCookieStore([]byte("lololololol")) //TODO: make super-secret-key random
//UMap - User map
var UMap = make(map[string]*User)

func loadUserMap() {
  file, err := os.Open("data/users.txt")
  handle(err);
  defer file.Close()
	
  scanner := bufio.NewScanner(file)
  for scanner.Scan() {
    fileArr := strings.Split(scanner.Text(), ":");
    UMap[fileArr[0]] = new(User) //alloc new user obj on heap so it stays
    *UMap[fileArr[0]] = User{
      Name: fileArr[0], //username
      Type: fileArr[2], //type of user
      Hash: fileArr[1], //password hash
    }
  }
}

//return (UserObj, Did auth?)
func getUserLogin(user string, pass string) (*User, bool){
  //check if user exists in usermap
  if UserObj, ok := UMap[user]; ok {
    if checkPasswordHash(pass, UserObj.Hash) { //is user and right password
      return UserObj, true
    }
    return UserObj, false
  }
  
  return nil, false;
}
//return (UserObj, did auth?)
func getGuestLogin(user string) (*User, bool) {
  //If guest user has been created before
  if UserObj, ok := UMap[user]; ok {
    if len(UserObj.Sessions) <= 0 { //if no sessions
      return UserObj, true; //Return object
    }else if(UserObj.checkTime(15)){ //if sessions, check log time
      UserObj.Sessions = nil; //wipe all sessions and login
      return UserObj, true;
    }
    return UserObj, false;
  }
  
  //Else create new guest
  UMap[user] = new(User)
  *UMap[user] = User{
    Name: user,
    Type: "guest",
  }
  return UMap[user], true;
}

//Get username from session
func getUser(sess *sessions.Session) *User {
  if(sess != nil){
    if userName := sess.Values["user"].(string); userName != "" {
      if userObj, ok := UMap[userName]; ok {
        return userObj;
      }
    }
  }
  return nil;
}
func getSession(r *http.Request) *sessions.Session{
  sess, err := store.Get(r, "da-cookie");
  if(handle(err)){
    return nil;
  }
  return sess;
}

func checkSession(sess *sessions.Session) bool{
  //check values
  if(sess == nil){ return false; }
  user, okUser := sess.Values["user"] //get current username
  id, okID := sess.Values["id"] //get current username
  if(!okUser || !okID){ return false; } //make sure exist
  
  if userObj, ok := UMap[user.(string)]; ok { //if username exists
    for i := range userObj.Sessions {
      if(userObj.Sessions[i] == id.(string)){
        return true;
      }
    }
  }
  return false;
}

func (UserObj *User) attachSession(sess *sessions.Session) {
  id := xid.New().String(); //Generate unique id
  sess.Values["id"] = id; //give id to session for identification
  sess.Values["user"] = UserObj.Name; //set username
  
  UserObj.Sessions = append(UserObj.Sessions, id); //add session Id to array
  UserObj.updateTime(); //make sure to log time.
}
func (UserObj *User) detachSession(sess *sessions.Session){
  for i := range UserObj.Sessions {
    if(UserObj.Sessions[i] == sess.Values["id"].(string)){
      UserObj.Sessions = deleteAtIndex(UserObj.Sessions, i).([]string);
      break;
    }
  }
}

func (UserObj *User) updateTime(){
  UserObj.LoggedTime = time.Now();
}
func (UserObj *User) checkTime(minutes float64) bool{
  //If guest logged in more than 30 minutes, log out
  var minutesSince = time.Since(UserObj.LoggedTime).Minutes();
  if(minutesSince > minutes){ //If guest not active for more than 15 minutes
    return true;
  }
  return false;
}

func rotate(nums []int, k int) []int {
    if k < 0 || len(nums) == 0 {
        return nums
    }

    r := k%len(nums)
    nums = append(nums[r:], nums[:r]...)
    return nums;
}
func contains(s interface{}, elem interface{}) bool {
	arrV := reflect.ValueOf(s)
	
	if arrV.Kind() == reflect.Slice {
		for i := 0; i < arrV.Len(); i++ {
			// XXX - panics if slice element points to an unexported struct field
			// see https://golang.org/pkg/reflect/#Value.Interface
			if arrV.Index(i).Interface() == elem {
				return true
			}
		}
	}
	return false
}
func deleteAtIndex(a interface{}, index int) interface{}{
  av := reflect.ValueOf(a);
  if av.Kind() != reflect.Slice {
    panic("deleteAtIndex not passed slice");
  }
  
  ret := reflect.MakeSlice(av.Type(), av.Len(), av.Len());
  
  for i := 0; i<av.Len(); i++ {
    if(i != index){
      reflect.Append(ret, av.Index(i));
    }
  }
  return ret.Interface();
}

// Unzip will decompress a zip archive, moving all files and folders
// within the zip file (parameter 1) to an output directory (parameter 2).
func Unzip(src string, dest string) ([]string, error) {
  
  var filenames []string
  
  r, err := zip.OpenReader(src)
  if err != nil {
    return filenames, err
  }
  defer r.Close()
  
  for _, f := range r.File {
    
    // Store filename/path for returning and using later on
    fpath := filepath.Join(dest, f.Name)
    
    // Check for ZipSlip. More Info: http://bit.ly/2MsjAWE
    if !strings.HasPrefix(fpath, filepath.Clean(dest)+string(os.PathSeparator)) {
      return filenames, fmt.Errorf("%s: illegal file path", fpath)
    }
    
    filenames = append(filenames, fpath)
    
    if f.FileInfo().IsDir() {
      // Make Folder
      os.MkdirAll(fpath, os.ModePerm)
      continue
    }
    
    // Make File
    if err = os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
      return filenames, err
    }
    
    outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
    if err != nil {
      return filenames, err
    }
    
    rc, err := f.Open()
    if err != nil {
      return filenames, err
    }
    
    _, err = io.Copy(outFile, rc)
    
    // Close the file without defer to close before next iteration of loop
    outFile.Close()
    rc.Close()
    
    if err != nil {
      return filenames, err
    }
  }
  return filenames, nil
}

func loadJSON(filename string, object interface{}) error {
	//Load file
	bytes, err := ioutil.ReadFile(filename)
	if err != nil{ return err; }
	
	//Unmarshal json
	err = json.Unmarshal(bytes, object);
  return err;
}
func saveJSON(object interface{}, filename string) error {
	bytes, err := json.Marshal(object);
	if err != nil{ return err; }
	err = ioutil.WriteFile(filename, bytes, 0644);
  return err;
}

func fileExists(filename string) bool {
  _, err := os.Stat(filename)
  //fmt.Println(info)
  if err == nil {
    return true;
  }else{
    return false;
  }
}

func printInfo(){
  fmt.Println("---------Development Information Begin---------")
  //Print CWD
  dir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("CWD: "+dir)
  
  //Print Network info
  fmt.Println("Network Info")
  addrs, err := net.InterfaceAddrs()
  if(err != nil){fmt.Println("Error, could not get Adresses")}
  
	for _, a := range addrs {
		if ipnet, ok := a.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				fmt.Println(a.String() + ": " + ipnet.IP.String())
			}
		}
	}
  //Print config
  fmt.Printf("Config: %+v\n", config);
  
  //File structure
  /*err = filepath.Walk("data/dev",
    func(path string, info os.FileInfo, err error) error {
    if err != nil {
        return err
    }
    fmt.Println(path, info.Size())
    return nil
  })
  handle(err);*/
  
  fmt.Println("---------Development Information End---------")
}
