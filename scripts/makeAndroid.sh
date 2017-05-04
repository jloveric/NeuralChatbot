#!/bin/bash

tdir=$(pwd)

cd phonegap/chat

echo "Trying to load android onto device"
phonegap run android

cd $tdir