#!/bin/bash

tdir=$(pwd)

#script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR

#./defaultMapping.sh
./installTestDatabases.sh
./installPhraseAndOperator.sh

