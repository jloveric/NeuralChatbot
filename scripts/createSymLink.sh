#!/bin/bash

echo "creating symbolic links in node_modules"
echo "this is needed so we don't have to use"
echo "relative paths require('../../source/io/io.js')"
echo "instead becomes require('sb/io/io.js')"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

#cd ../node_modules

rm -f ../node_modules/sb
ln -s ../source ../node_modules/sb

rm -f ../node_modules/clockmaker
ln -s ../clockmaker ../node_modules/clockmaker

cd ..