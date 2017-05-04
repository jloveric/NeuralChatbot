#!/bin/bash

echo "copying recaptcha data to the public directory"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

cd ..

cp snippets/recaptcha.json source/ui/public/recaptcha.json
