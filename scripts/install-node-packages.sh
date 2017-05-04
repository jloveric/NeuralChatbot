#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "running npm install"
npm install

./scripts/createSymLink.sh

./scripts/browserify-storebot.sh

echo "Currently not installing nwjs application"
#echo "installing nwjs application"
#cd nwjs/watcher
#npm install 
#npm install sqlite3 --build-from-source --runtime=node-webkit --target_arch=x64 --target="0.12.3"

#echo "executing move"
#cp -rf node_modules/sqlite3/lib/binding/* ../../node_modules/sqlite3/lib/binding
