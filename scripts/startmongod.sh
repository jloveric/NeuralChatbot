#!/bin/bash

echo "Starting mongodb in desired directory"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

datadir="$DIR/../databases/mongodb"

#first shutdown the server if one is running
mongod --shutdown --dbpath $datadir

#then start a new one.
mongod --dbpath $datadir --port 27017
