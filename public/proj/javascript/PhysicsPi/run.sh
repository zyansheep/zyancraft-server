#!/bin/bash

cd "$(dirname "$0")"

export JAVA_HOME=$(/usr/libexec/java_home -v1.8)
rm bin/*.class
javac -d bin src/PhysicsPi.java -cp "libs/core.jar"
cd bin
java -cp "./:../libs/core.jar" PhysicsPi
cd ..
export JAVA_HOME=$(/usr/libexec/java_home -v11)
echo "Done!"
