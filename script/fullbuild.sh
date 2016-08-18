if [ -z $1 ]; then
  echo "Need platform, e.g. android or ios";
  exit 1;
fi

cd platforms && rm -rf $1 && cd .. && rm -rf plugins && cordova prepare $1 && cordova run $1
