package main;

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"time"
	"html/template"
	"net/http"
	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"strings"
	"golang.org/x/crypto/acme/autocert"
	"crypto/tls"
)

type Config struct {
  HTTPPort string //1080
  HTTPSPort string //1443
  BindAddress string //0.0.0.0
	CertPath string //Path to .crt file (from certificate authority)
	KeyPath string //Path to .key file (from certificate authority)
  DeveloperMode bool //Developer Switch (for debugging)
	InsecureMode bool //Only run HTTP vs HTTPS with redirect
	
	UseAutocert bool //Whether to use LetsEncrypt Certificate Authority library or not (This will ignore CertPath & KeyPath)
	AtomDebugger bool //Whether to use the delve atom debugger (and change to root dir)
}
//Default Config
var config = Config{
	HTTPPort: "1080",
	HTTPSPort: "1443",
	BindAddress: "0.0.0.0",
	DeveloperMode: false,
	
	UseAutocert: false,
	AtomDebugger: false,
}
var configFile = "data/config/development.json"

func poolHandler(w http.ResponseWriter, r *http.Request) {
	if(config.DeveloperMode){
		templates = template.Must(template.ParseGlob("lib/templates/*")) //for playground testing
	}
	//open files
	files, err := ioutil.ReadDir("./proj/pool")
	if err != nil {
		panic(err)
	}
	
	var strArr []string;
	for _, f := range files {
		if(!strings.HasPrefix(f.Name(), ".")){
			strArr = append(strArr, f.Name());
		}
	}
	type PoolPage struct {
		PoolItems []string
	}
	//write template and log
	templates.ExecuteTemplate(w, "pool.html", PoolPage{strArr})
	Log("Pool", r.URL.Path, r)
}
func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	Log("404", r.URL.Path, r)
	http.ServeFile(w, r, "./lib/404/index.html")
}
func uploadHandler(w http.ResponseWriter, r *http.Request) {
	Log("Upload", "File is being uploaded", r);
	//Max upload size is 512MB
	if err := r.ParseMultipartForm(512 << 20); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest);
		Log("Upload", "Error in reading form", r);
		println(err.Error());
		return;
	}
	//get uploaded file from form
	file, handler, err := r.FormFile("uploadfile")
	if(handle(err)){
		Log("Upload", "uploadfile form field doesn't exist", r);
		return;
	}
	defer file.Close()
	http.Redirect(w, r, "/proj/pool/", http.StatusSeeOther)
	
	//check if logged in
	session := getSession(r);
	if checkSession(session) {
		user := getUser(session);
		if user.Type != "guest" {
			//write file to pool
			f, err := os.OpenFile("./proj/pool/"+handler.Filename, os.O_WRONLY|os.O_CREATE, 0666)
			if(handle(err)){ return; }
			
			defer f.Close()
			io.Copy(f, file)
			
			Log("Upload", handler.Filename+" was uploaded to the pool by "+user.Name, r)
		}else{
			Log("Upload", handler.Filename+" failed (not authed)", r)
		}
	}else{
		Log("Upload", handler.Filename+" failed (not logged in)", r)
	}
}
func adminHandler(w http.ResponseWriter, r *http.Request) {
	//use mu function to convert returning 2 objects from store.Get to interface array
	user := getUser(mu(store.Get(r, "da-cookie"))[0].(*sessions.Session));
	
	fmt.Println("Serving File: " + r.URL.Path);
	http.ServeFile(w, r, r.URL.Path);
	
	//w.Write([]byte("You have accessed Admin System: " + vars["page"] + "\n"))
	Log("Admin", "User "+user.Name +" accessed admininstrator system", r);
}
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		//if get method return session info
		session, err := store.Get(r, "da-cookie");
		handle(err);
		if(checkSession(session)){ //check if user is logged in with this session
			user := getUser(session);
			user.updateTime();
			
			w.Write([]byte("var UserIsLogged = true\n"))
			w.Write([]byte("var UserName = \""+user.Name+"\"\n"))
			w.Write([]byte("var UserType = \"" + user.Type +"\"\n"))
		}else{
			w.Write([]byte("var UserIsLogged = false\n"))
			w.Write([]byte("var UserName = \"\"\n"))
			w.Write([]byte("var UserType = \"\"\n"))
		}
	}else{
		//if post method, parse html form and login
		session, _ := store.Get(r, "da-cookie")
		r.ParseMultipartForm(32 << 20)
		
		user := r.FormValue("user");
		pass := r.FormValue("pass");
		if len(user) <= 6 {
			Log("Auth", "Username \"" +user+ "\" not more than 5 characters", r);
			w.Write([]byte("The username: \"" + user + "\" is not more than 5 characters")); //message response
			return;
		}else if len(user) >= 16 {
			Log("Auth", "Username \"" +user+ "\" is more than 16 characters", r);
			w.Write([]byte("That username is too long"))
			return;
		}
		//Call login function and get if login was sucessful and the type of user logged in
		if UserObj, ok := getUserLogin(user, pass); ok {
			UserObj.attachSession(session);
			session.Save(r,w)
			
			Log("Auth", "Logged in as "+UserObj.Type+": "+UserObj.Name, r);
			w.Write([]byte("Success"));
		}else if(UserObj != nil){ //if User exists, but password incorrect
			Log("Auth", "Failed login for " + UserObj.Type + " " + UserObj.Name + " password incorrect", r)
			w.Write([]byte("The username or password was incorrect"));
		}else{ //if no user, create guest user
			user = "guest-" + user;
			if UserObj, ok = getGuestLogin(user); ok {
				UserObj.attachSession(session);
				session.Save(r,w)
				w.Write([]byte("Success"));
			}else{
				Log("Auth", "Failed login for " + UserObj.Name + " more than 1 session", r)
				w.Write([]byte("There is another guest already logged in by this name"));
			}
		}
	}
}
func logoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "da-cookie")
	
	if user := getUser(session); user != nil{
		Log("Auth", user.Name + " Logged out", r);
		//delete unique session ID from user object
		user.detachSession(session);
		
		//Expire session
		session.Options.MaxAge = -1
		session.Save(r, w)
	}
	
	http.Redirect(w, r, "/home/", http.StatusSeeOther);
}
var templates *template.Template;

func createServer() (*http.Server){
	r := mux.NewRouter()
	r.StrictSlash(false)
	r.NotFoundHandler = http.HandlerFunc(notFoundHandler)
	
	r.HandleFunc("/login", loginHandler)
	r.HandleFunc("/logout", logoutHandler)
	r.HandleFunc("/admin/", authing(adminHandler)) //Admin Console
	r.HandleFunc("/admin/{page}/", authing(adminHandler)) //Admin Pages
	
	r.HandleFunc("/proj/pool", poolHandler).Methods("GET") //Pool
	r.HandleFunc("/proj/pool", uploadHandler).Methods("POST")
	r.HandleFunc("/ws", socketHandler) //WebSocket Handler
	go socketMain() //WebSocket GoRoutine
	
	customFileServer := http.FileServer(neuteredFileSystem{http.Dir("./")})
	r.PathPrefix("/").Handler(customFileServer).Methods("GET")
	return &http.Server{
		Handler:        logging()(r),
		ReadHeaderTimeout: 10 * time.Second, //Prevents Slowloris
		//ReadTimeout:		60 * time.Second,
		//WriteTimeout:		120 * time.Second,
		//IdleTimeout:		120 * time.Second,
		MaxHeaderBytes: 1 << 14, //16kb max header size
	}
}

func main() {
	var err error;
	//Use production config if on production server
	if hostname, _ := os.Hostname(); hostname == "ZYAN-SERVER"{
		configFile = "data/config/production.json"
	}
	
	err = loadJSON(configFile, &config)
	if(err != nil){
		println("Could not load config file: "+  err.Error());
		printInfo();
		return;
	}
	
	if(config.DeveloperMode){
		printInfo();
	}
	
	templates = template.Must(template.ParseGlob("./public/lib/templates/*"));
	initLog("data/logs/"); //init logging
	loadUserMap(); //Load users
	
	server := createServer();
	
	if(!config.UseAutocert){
		if(config.InsecureMode){
			server.Addr = config.BindAddress + ":" + config.HTTPPort
			fmt.Println("Hosting Insecure (http) Webserver on " + server.Addr)
			if err := server.ListenAndServe(); err != nil {
				panic(err)
			}
		}else if fileExists(config.CertPath) && fileExists(config.KeyPath) {
			server.Addr = config.BindAddress + ":" + config.HTTPSPort
			fmt.Println("Hosting Secure (https) Webserver on " + server.Addr)
			
			go http.ListenAndServe(config.BindAddress + ":" + config.HTTPPort, http.RedirectHandler("https://www.zyancraft.net/", 301))
			if err := server.ListenAndServeTLS(config.CertPath, config.KeyPath); err != nil {
				panic(err)
			}
		}else{
			println("Tried to start HTTPS Development Webserver, but cert or key did not exist (" + config.CertPath+" or "+config.KeyPath+")");
			println("To start server without SSL, set InsecureMode in the config to true");
			println("To change the path of the certs set CertPath or KeyPath in correct config file")
		}
	}else{ //Option to use autocert package to request certificate directly from letsencrypt
    certManager := &autocert.Manager{
      Prompt:     autocert.AcceptTOS,
      HostPolicy: autocert.HostWhitelist("www.zyancraft.net", "zyancraft.net"),
      Cache:      autocert.DirCache("data/certs"),
    }
    server.TLSConfig = &tls.Config{GetCertificate: certManager.GetCertificate}
		server.Addr = config.BindAddress + ":" + config.HTTPSPort;
		fmt.Println("Hosting Secure Webserver using autocert" + server.Addr)
		
		//handle port 80 -> port 443 redirection
		go http.ListenAndServe(config.BindAddress + ":" + config.HTTPPort, certManager.HTTPHandler(nil))
		if err := server.ListenAndServeTLS("", ""); err != nil {
			panic(err)
		}
	}
	
	fmt.Println("Closing...");
}


