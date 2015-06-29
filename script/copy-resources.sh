# Splashscreen android
cp www/res/screen/android/screen-ldpi-portrait.png platforms/android/res/drawable-port-ldpi/screen.png
cp www/res/screen/android/screen-ldpi-landscape.png platforms/android/res/drawable-land-ldpi/screen.png
cp www/res/screen/android/screen-mdpi-portrait.png platforms/android/res/drawable-port-mdpi/screen.png
cp www/res/screen/android/screen-mdpi-landscape.png platforms/android/res/drawable-land-mdpi/screen.png
cp www/res/screen/android/screen-hdpi-portrait.png platforms/android/res/drawable-port-hdpi/screen.png
cp www/res/screen/android/screen-hdpi-landscape.png platforms/android/res/drawable-land-hdpi/screen.png
cp www/res/screen/android/screen-xhdpi-portrait.png platforms/android/res/drawable-port-xhdpi/screen.png
cp www/res/screen/android/screen-xhdpi-landscape.png platforms/android/res/drawable-land-xhdpi/screen.png

# Splashscreen ios
cp www/res/screen/ios/screen-iphone-portrait-568h-2x.png platforms/ios/Mobile.UP/Resources/splash/Default-568h@2x~iphone.png
cp www/res/screen/ios/screen-ipad-landscape-2x.png platforms/ios/Mobile.UP/Resources/splash/Default-Landscape@2x~ipad.png
cp www/res/screen/ios/screen-ipad-landscape.png platforms/ios/Mobile.UP/Resources/splash/Default-Landscape~ipad.png
cp www/res/screen/ios/screen-ipad-portrait-2x.png platforms/ios/Mobile.UP/Resources/splash/Default-Portrait@2x~ipad.png
cp www/res/screen/ios/screen-ipad-portrait.png platforms/ios/Mobile.UP/Resources/splash/Default-Portrait~ipad.png
cp www/res/screen/ios/screen-iphone-portrait-2x.png platforms/ios/Mobile.UP/Resources/splash/Default@2x~iphone.png
cp www/res/screen/ios/screen-iphone-portrait.png platforms/ios/Mobile.UP/Resources/splash/Default~iphone.png

# StatusBar settings ios
/usr/libexec/PlistBuddy -c "Add :UIStatusBarHidden bool false" platforms/ios/Mobile.UP/Mobile.UP-Info.plist
/usr/libexec/PlistBuddy -c "Add :UIViewControllerBasedStatusBarAppearance bool false" platforms/ios/Mobile.UP/Mobile.UP-Info.plist
