#!/bin/bash

set -e

cd build
mv static resources
mv favicon.png resources/
mv media/* resources/media
rm -r media

if [ "$(uname)" = "Darwin" ]; then # MacOSX case
    sed -i '' -e 's/static\///g; s/favicon\.png/resources\/favicon\.png/' index.html
else # Linux case
    sed -i -e 's/static\///g; s/favicon\.png/resources\/favicon\.png/' index.html
fi
