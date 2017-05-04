#!/bin/bash

tdir=$(pwd)

#script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR

echo "Installing databases for deployment with dummy data"

#./defaultMapping.sh
./installDummyDatabases.sh
./installPhraseAndOperator.sh

