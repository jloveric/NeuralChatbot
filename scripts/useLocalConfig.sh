#!/bin/bash

echo "Using clientConfigLocal configuration"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

cd ..

cp snippets/clientConfigLocal.json source/ui/public/clientConfig.json
