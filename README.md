# NodIM project

## Setup

Install the dependencies:
```bash
`rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`

pnpm install
cargo install
cargo tauri android init
```

## Get started

Start the dev server, and the app will be available at <http://localhost:8080>.

```bash
pnpm run dev
```

Build the app for production:

```bash
pnpm run build
```

Preview the production build locally:

```bash
pnpm run preview
```

## For Android

```
pnpm dev:android
pnpm build:android

```

src-tauri/gen/android/app/src/main/AndroidManifest.xml
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
    <uses-permission android:name="android.permission.INTERNET" />

