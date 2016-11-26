# Usage: sh script\release.sh <platform>
# <platform>: ios or android
# e.g.
#   sh script\release.sh android

if [ -z $1 ]; then
  echo "Need platform, e.g. android or ios";
  exit 1;
fi

# Optimize JS code
# Needs requirejs optimizer. See http://requirejs.org/docs/optimization.html
cd www
r.js -o baseUrl=js mainConfigFile=js/main.js name=main out=main-built.js
cd ..

script/fullbuild.sh $1 build

if [ $1 == "android" ]; then
  cd platforms
  cp release-signing.properties android
  cd ..
fi

cordova build $1 --release
