package main

import (
  "bufio"
  "errors"
  "fmt"
  "os"
  "os/exec"
  "strings"
  "golang.org/x/crypto/bcrypt"
  "path/filepath"
)

var dataPath string;
func main() {
  //Get path of exec
  ex, err := os.Executable()
  if err != nil {
    panic(err)
  }
  dataPath = filepath.Dir(ex)
  
  reader := bufio.NewReader(os.Stdin)
  
  for {
    //get working directory
    pwd, _:= os.Getwd();
    fmt.Print(pwd+ "> ")
    // Read the keyboad input.
    input, err := reader.ReadString('\n')
    if err != nil {
        fmt.Fprintln(os.Stderr, err)
    }
    // Handle the execution of the input.
    if err = execInput(input); err != nil {
      fmt.Fprintln(os.Stderr, err)
    }
  }
}

// ErrNoPath is returned when 'cd' was called without a second argument.
var ErrNoPath = errors.New("path required")

func execInput(input string) error {
  // Remove the newline character.
  input = strings.TrimSuffix(input, "\n")
  
  // Split the input separate the command and the arguments.
  args := strings.Split(input, " ")
  
  // Check for built-in commands.
  switch args[0] {
  case "cd":
      // 'cd' to home with empty path not yet supported.
      if len(args) < 2 {
          return ErrNoPath
      }
      // Change the directory and return the error.
      return os.Chdir(args[1])
  case "exit":
      os.Exit(0)
  case "addUser":
    hashBytes, _ := bcrypt.GenerateFromPassword([]byte(args[2]), 14)
    if(len(args) < 3){ fmt.Println("Command Format: AddUser <User> <Pass> [type]"); }
    //make sure write type
    if(len(args) < 4){ args = append(args,"user");}
    toWrite := args[1] + ":" + string(hashBytes) + ":" + args[3] + "\n"
    fmt.Println("Writing Username and Password hash to file");
    f, err := os.OpenFile("./users.txt", os.O_APPEND|os.O_WRONLY, 0600)
    if err != nil {
      panic(err)
    }
    defer f.Close()

    if _, err = f.WriteString(toWrite); err != nil {
      panic(err)
    }
    
    //write username and has to file and return error
    return err;
  case "clearLogs":
    return runScript("clearLogs")
  case "prepSync":
    return runScript("prepSync")
  }
  return runCmd(args);
}
func runScript(name string) error{
  return runCmd( strings.Split("bash "+dataPath+"/scripts/" + name, " ") );
}
func runCmd(args []string) error {
  cmd := exec.Command(args[0], args[1:]...)
  cmd.Stderr = os.Stderr
  cmd.Stdout = os.Stdout
  return cmd.Run()
}