if [ -z $1 ]; then
  echo "Need platform, e.g. android or ios";
  exit 1;
fi

cd platforms
rm -rf $1
cd ..

cd plugins
rm -rf */
rm -rf $1.json
cd ..

phonegap build $1 --verbose --stacktrace
sh script/add-plugins.sh
#sh script/copy-resources.sh
phonegap run $1 --verbose --stacktrace