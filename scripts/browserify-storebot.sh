#!/bin/bash

echo "Running browserify on the user interface"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "Creating Chat page"
./node_modules/.bin/browserify source/ui/ChatIndex.js -o source/ui/chatbundle.js

echo "Creating start page"
./node_modules/.bin/browserify source/ui/Index.js -o source/ui/startpagebundle.js

echo "Creating watcher bundle"
./node_modules/.bin/browserify source/ui/Watcher.js -o source/ui/watcherbundle.js

echo "Creating test bundle"
./node_modules/.bin/browserify source/ui/TestIndex.js -o source/ui/testbundle.js
