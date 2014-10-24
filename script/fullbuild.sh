cd platforms
rm -rf $1
cd ..

phonegap build $1
sh script/add-plugins.sh
sh script/copy-resources.sh
phonegap run $1
