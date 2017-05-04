#!/bin/bash

echo "Create phone icons for Chat application"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
cd ../phonegap/chat

echo "Creating Chat icons"
../../node_modules/.bin/cordova-icon
