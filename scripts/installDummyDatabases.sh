#!/bin/bash

echo "Running browserify on the user interface"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "Installing Bobs with 100,000 entries"
./source/util/CreateBot.js --username=bobs@gmail.com --password=xenomorph --install=uploads/bobs.install

echo "Installing nice grocery database"
./source/util/CreateBot.js --username=nice@gmail.com --password=xenomorph --install=uploads/nice.install

#echo "Installing mekanite corporation database"
#./source/util/CreateBot.js --username=mekanite@gmail.com --password=xenomorph --install=uploads/mekanite.install