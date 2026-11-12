# forbidden_city_roam
 Roam The Forbidden City

## Android 平板安装包

在项目根目录运行 `npm ci` 安装网页依赖。准备 JDK 11 和 Android SDK Platform 31，设置 `ANDROID_HOME` 后运行：

```sh
cd android
./gradlew assembleDebug
```

Windows 使用 `gradlew.bat assembleDebug`。构建会先编译网页，再将模型、纹理、音乐、字体和实景照片装入 APK。安装包位于 `android/build/outputs/apk/debug/ForbiddenCityRoam-debug.apk`（相对项目根目录），使用本机 Android 调试签名，适合侧载试用。

应用支持 Android 7.0 及以上，三维漫游需要支持 WebGL 2 的 Android System WebView。核心内容可离线浏览，馆方和摄影资料链接会在系统浏览器中打开。
