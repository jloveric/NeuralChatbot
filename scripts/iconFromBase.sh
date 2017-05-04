#!/bin/bash
#Example use case -- program pngFile iconDirectory
#../../scripts/iconFromBase.sh ../StoreAI2.png ../../phonegap/chat/

echo $1

filename=$(basename "$1")
extension="${filename##*.}"
filename="${filename%.*}"

echo $filename
#echo $extension

convert $1 -resize 36x36 $filename-36-ldpi.png
convert $1 -resize 48x48 $filename-48-mdpi.png
convert $1 -resize 72x72 $filename-72-hdpi.png
convert $1 -resize 96x96 $filename-96-xhdpi.png
convert $1 -resize 80x80 $filename-80.png
convert $1 -resize 57x57 $filename-57.png
convert $1 -resize 72x72 $filename-72.png
convert $1 -resize 114x114 $filename-57-2x.png
convert $1 -resize 144x144 $filename-72-2x.png
convert $1 -resize 64x64 $filename-64.png
convert $1 -resize 48x48 $filename-48.png
convert $1 -resize 128x128 $filename-128.png
convert $1 -resize 200x200 $filename-200.png
convert $1 -resize 512x512 $filename-512.png


if [ $2 ]; then
    
    android="www/res/icon/android"
    blackberry="www/res/icon/blackberry"
    ios="www/res/icon/ios"
    winphone="www/res/icon/windows-phone"
    
    cp $filename-36-ldpi.png $2/$android/icon-36-ldpi.png
    cp $filename-48-mdpi.png $2/$android/icon-48-mdpi.png
    cp $filename-72-hdpi.png $2/$android/icon-72-hdpi.png
    cp $filename-96-xhdpi.png $2/$android/icon-96-xhdpi.png
    cp $filename-128.png $2/www/icon.png
    cp $filename-128.png $2/www/res/icon.png
    cp $filename-128.png $2/icon.png
    cp $filename-512.png $2/icon-512.png
    cp $filename-200.png $2/www/img/logo.png
fi
