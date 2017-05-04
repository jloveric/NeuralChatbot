#!/bin/bash

echo "Copying privacy docs from mekanite homepage."
echo "We need to do this since mekanite.com does not use SSL"
echo "So refering to it from within iFrames fails."

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

cd ..

cp mekahome/storeAiPrivacy.html source/ui/public/storeAiPrivacy.html
