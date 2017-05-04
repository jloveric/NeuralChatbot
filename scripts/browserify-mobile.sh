#!/bin/bash

echo "Running browserify on the user interface"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ..

echo "Creating Chat page"
./node_modules/.bin/browserify source/ui/ChatIndex.js | ./node_modules/.bin/uglifyjs > source/ui/chat/chatMobileBundle.js

echo "Copying bundle to phonegap"

echo "Copying configuration to refer to aws"
cp snippets/clientConfigDeploy.json phonegap/chat/www/clientConfig.json

echo "Copying the browserified bundle"
cp source/ui/chat/chatMobileBundle.js phonegap/chat/www/js

echo "Copying indiviudal javascript files"
cp -rf source/ui/public/js/* phonegap/chat/www/js

#echo "Copying semantic-ui javascript"
#cp source/ui/public/js/Semantic-UI/dist/semantic.min.js phonegap/chat/www/js

echo "Copying css files"
cp source/ui/public/css/*.css phonegap/chat/www/css

#echo "Copying semantic-ui css"
#cp source/ui/public/js/Semantic-UI/dist/semantic.min.css phonegap/chat/www/css

echo "finished!"
