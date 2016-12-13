# Usage: sh script\fullbuild.sh <platform> <action (optional)>
# <platform>: ios or android
# <action>: run (default) or build
# e.g.
#   sh script\fullbuild.sh ios build
# or
#   sh script\fullbuild.sh android

if [ -z $1 ]; then
  echo "Need platform, e.g. android or ios";
  exit 1;
fi

action=$2;
if [ -z $2 ]; then
  action="run";
fi

cd platforms && rm -rf $1 && cd .. && rm -rf plugins && cordova prepare $1 && cordova $action $1
