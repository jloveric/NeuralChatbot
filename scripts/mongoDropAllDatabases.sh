#!/bin/bash
#Drop all databases in mongodb.  Obviously should only be called if you really want that to happen
#http://stackoverflow.com/questions/6376436/mongodb-drop-every-database

read -r -p "Are you sure? [y/N] " response
response=${response,,}    # tolower
if [[ $response =~ ^(yes|y)$ ]]
then
  echo "Dropping all databases"
  mongo --quiet --eval 'db.getMongo().getDBNames().forEach(function(i){db.getSiblingDB(i).dropDatabase()})'
else
  echo "Aborting drop"
fi