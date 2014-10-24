TARGET_DIR=./www/js/vendor/

#	Dependencies
# 	 "jquery":^2.1.1",
#    "jquery-mobile": "^1.4.1",
#    "underscore": "^1.6.0",
#    "underscore.string": "^2.3.3",
#    "backbone": "^1.1.2",
#    "q": "^1.0.0",
#    "requirejs": "^2.1.11"
#	 "moment": "^2.6.0"
#	 "backbone-fetch-cache": "^1.4.1"
# 	 "fastclick": "^1.0.3"

cp ./node_modules/jquery/dist/jquery.min.js $TARGET_DIR
#cp ./node_modules/jquery-mobile/dist/jquery.mobile.min.js $TARGET_DIR
cp ./node_modules/underscore/underscore-min.js $TARGET_DIR
cp ./node_modules/underscore.string/dist/underscore.string.min.js $TARGET_DIR
cp ./node_modules/backbone/backbone-min.js $TARGET_DIR
cp ./node_modules/backbone-fetch-cache/backbone-fetch-cache.min.js $TARGET_DIR
cp ./node_modules/q/q.js $TARGET_DIR
cp ./node_modules/requirejs/require.js $TARGET_DIR
cp ./node_modules/moment/moment.min.js $TARGET_DIR
# using downloaded minified version from http://build.origami.ft.com/bundles/js?modules=fastclick
cp ./node_modules/fastclick/lib/fastclick.js $TARGET_DIR