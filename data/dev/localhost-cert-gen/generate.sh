#!/usr/bin/env bash

cd "$(dirname "$0")"
#Generate Certificate Authority
openssl genrsa -des3 -out gen/rootCA.key 2048
openssl req -x509 -new -nodes -key gen/rootCA.key -sha256 -days 1024 -out gen/rootCA.pem
#Generate Server Stuff
openssl req -new -sha256 -nodes -out gen/server.csr -newkey rsa:2048 -keyout gen/server.key -config server.csr.cnf
openssl x509 -req -in gen/server.csr -CA gen/rootCA.pem -CAkey gen/rootCA.key -CAcreateserial -out gen/server.crt -days 500 -sha256 -extfile v3.ext
