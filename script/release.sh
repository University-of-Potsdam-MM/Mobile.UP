# Usage: sh script\release.sh <platform>
# <platform>: ios or android
# e.g.
#   sh script\release.sh android

if [ -z $1 ]; then
  echo "Need platform, e.g. android or ios";
  exit 1;
fi

cordova clean && cordova prepare $1 && cordova build $1 --release --buildConfig=release-config.json
