phonegap build $1
sh script/add-plugins.sh
sh script/copy-resources.sh
phonegap run $1
