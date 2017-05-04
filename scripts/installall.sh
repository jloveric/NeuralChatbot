#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

./getdependencies.sh
./install-node-packages.sh
./useDeployConfig.sh
./installPrivacyDocs.sh