#!/bin/bash

echo "Creating HTML documentation and adding to public"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

cd ..

pandoc doc/user/UsingStoreAi.md -o source/ui/public/UsingStoreAi.html
