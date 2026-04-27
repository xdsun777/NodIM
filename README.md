# NodIM

## 简介
> NodIM 是基于 Rust 和 Vue 的局域网 P2P IM 应用，支持 Android平台。

### 技术栈

- `rustc`: "1.90.0"
- `nodejs`: "22.13.0"

- `libp2p`: "0.52.4"
- `tauri`: "2.0"

- `typescript`: "5.9.3"
- `pnpm`: "10.33.0"
- `rspack`: "1.7.7"

- `vue`: "3.5.26"
- `vue-router`: "5.0.3"
- `pinia`: "3.0.4"
- `tailwindcss`: "3.4.19"
- `idb`: "8.0.3"


### 依赖安装

```bash
`rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`

pnpm install
cargo install
cargo tauri android init
```

## 命令介绍

```bash
pnpm run dev
```
> 启动开发服务器。应用程序将可以在 http://localhost:8080 访问。

```bash
pnpm run build
```
> 构建生产版本的应用程序。

```bash
pnpm run preview
```
> 预览生产版本的应用程序。

## Android 平台命令

```
pnpm dev:android
pnpm build:android
```

## Android 平台权限
```xml
/src-tauri/gen/android/app/src/main/AndroidManifest.xml
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
    <uses-permission android:name="android.permission.INTERNET" />

```

