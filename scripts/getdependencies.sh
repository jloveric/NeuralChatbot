#!/bin/bash

#make sure all installations are relative to the path where the .sh file is located.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR
cd ../dependencies

echo "Getting Selenium"
wget http://selenium-release.storage.googleapis.com/2.48/selenium-server-standalone-2.48.2.jar
mv selenium*.jar selenium-server-standalone.jar
rm -rf selenium
mkdir selenium
mv selenium*.jar selenium

echo "Getting elastic search!"

rm -rf elasticsearch*

wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-5.2.2.zip
unzip elasticsearch*.zip -q
rm -rf elasticsearch
rm -rf elasticsearch*.zip
mv elasticsearch* elasticsearch

echo "Copying elasticsearch.yml to the config directory"
cp es.yml elasticsearch/config/elasticsearch.yml

echo "Getting logstash!"
rm -rf logstash*
wget https://artifacts.elastic.co/downloads/logstash/logstash-5.2.2.zip
unzip logstash*.zip -q
rm -rf logstash
rm -rf logstash*.zip
mv logstash* logstash


echo "Install the logstash jdbc plugin!"
cd logstash
bin/logstash-plugin install logstash-input-jdbc
cd ..



