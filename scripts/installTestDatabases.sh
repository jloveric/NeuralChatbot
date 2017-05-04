#!/bin/bash

echo "Running browserify on the user interface"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "Installing PCC with 100,000 entries"
./source/util/CreateBot.js --username=a.hakim777@gmail.com --password=xenomorph --install=uploads/pcc.install

echo "Installing small databases"
./source/util/CreateBot.js --username=john.loverich@gmail.com --password=xenomorph --install=uploads/groceries.install

echo "Installing small databases"
./source/util/CreateBot.js --username=ninfcs@gmail.com --password=xenomorph --install=uploads/ca-500.install