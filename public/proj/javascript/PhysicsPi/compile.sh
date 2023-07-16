#!/bin/bash

rm bin/jar/*.jar

#need to copy all the ingredients for jar file because APPARENTLY java can't link them from seperate folders!!!
cp bin/*.class bin/jar
cp libs/core.jar bin/jar
cp libs/MANIFEST.mf bin/jar
cd bin/jar
jar cfm PhysicsPi.jar MANIFEST.mf *.class core.jar

#delete copied stuff
rm MANIFEST.mf
rm *.class

cd ../..

#Convert .java file to .pde file to be interpreted by web processing.js lib
cat src/PhysicsPi.java | sed '$ s/.$//' | grep -v "extends PApplet" | sed -e '/public static void main/ { N; N; d; }' | grep -v "//~Java" | sed 's/\/\/\~Script //' > bin/web/PhysicsPi.pde
