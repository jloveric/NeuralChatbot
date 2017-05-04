#!/bin/bash
#Remove the elasticsearch indexes

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

rm -rf ../dependencies/elasticsearch/data
echo "Data director deleted. You need to restart elasticsearch."
