if [ -z $1 ]; then
  echo "Need platform, e.g. android or ios";
  exit 1;
fi

rm -rf platforms/$1 && rm -rf plugins && cordova prepare && cordova run $1
