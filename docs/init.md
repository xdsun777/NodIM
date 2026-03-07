# 部署脚本

```bash
pnpm create rspack@latest

pnpm add vue-router@4 pinia@2

pnpm add -D tailwindcss postcss postcss-loader autoprefixer
```

```bash
avdmanager list avd

emulator -avd <name>

adb devices

cargo tauri android init
cargo tauri android dev


```

```bash
# [project]/src-tauri/gen/android/keystore.properties
keytool -genkey -v -keystore D:\devel\applib\gradle\upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload

storePassword=<password from previous step>
keyPassword=<password from previous step>
keyAlias=upload
storeFile=<密钥存储文件的位置，例如 /Users/<user name>/upload-keystore.jks 或 C:\\Users\\<user name>\\upload-keystore.jks>


# [project]/src-tauri/gen/android/app/build.gradle.kts
import java.util.Properties
import java.io.FileInputStream

signingConfigs {
    create("release") {
        val keystorePropertiesFile = rootProject.file("keystore.properties")
        val keystoreProperties = Properties()
        if (keystorePropertiesFile.exists()) {
            keystoreProperties.load(FileInputStream(keystorePropertiesFile))
        }

        keyAlias = keystoreProperties["keyAlias"] as String
        keyPassword = keystoreProperties["keyPassword"] as String
        storeFile = file(keystoreProperties["storeFile"] as String)
        storePassword = keystoreProperties["storePassword"] as String
    }
}

buildTypes {
    ...
}


buildTypes {
    getByName("release") {
        signingConfig = signingConfigs.getByName("release")
    }
}
```

```json
/// tauri.config.json

"removeUnusedCommands": true

```
