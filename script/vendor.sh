TARGET_DIR=./www/js/vendor/

#	Dependencies
# 	 "jquery":^2.1.1",
#    "jquery-mobile": "^1.4.1",
#    "underscore": "^1.6.0",
#    "underscore.string": "^2.3.3",
#    "backbone": "^1.1.2",
#    "q": "^1.0.0",
#    "requirejs": "^2.1.11"

cp ./node_modules/jquery/dist/jquery.min.js $TARGET_DIR
cp ./node_modules/jquery-mobile/dist/jquery.mobile.min.js $TARGET_DIR
cp ./node_modules/underscore/underscore-min.js $TARGET_DIR
cp ./node_modules/underscore.string/dist/underscore.string.min.js $TARGET_DIR
cp ./node_modules/backbone/backbone-min.js $TARGET_DIR
cp ./node_modules/q/q.js $TARGET_DIR
cp ./node_modules/requirejs/require.js $TARGET_DIR