# Needs requirejs optimizer. See http://requirejs.org/docs/optimization.html
cd www
r.js -o baseUrl=js mainConfigFile=js/main.js name=main out=main-built.js
cd ..

cd platforms
mkdir android
cp release-signing.properties android
cd ..

cordova build android --release
