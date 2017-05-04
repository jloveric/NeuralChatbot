#!/bin/bash

echo "Using clientConfigDeploy configuration"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

cd ..

cp snippets/clientConfigDeploy.json source/ui/public/clientConfig.json
