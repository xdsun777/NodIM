#[cfg(any(target_os = "android", target_os = "ios"))]
use tauri_plugin_biometric::{AuthOptions, BiometricExt};

#[cfg(any(target_os = "android", target_os = "ios"))]
pub fn bio_auth(app_handle: tauri::AppHandle) {
    let options = AuthOptions {
        // 如果你希望用户能够使用手机密码进行身份验证，请设为 true
        allow_device_credential: true,
        cancel_title: Some("Feature won't work if Canceled".to_string()),

        // 仅 iOS 平台的功能
        fallback_title: Some("Sorry, authentication failed".to_string()),

        // 仅 Android 平台的功能
        title: Some("需要身份验证".to_string()),
        subtitle: Some("使用生物识别解锁应用".to_string()),
        confirmation_required: Some(true),
    };

    // 如果认证成功，函数返回 Result::Ok()
    // 否则返回 Result::Error()
    match app_handle
        .biometric()
        .authenticate("This feature is locked".to_string(), options)
    {
        Ok(_) => {
            println!(
                "Hooray! Successfully Authenticated! We can now perform the locked Tauri function!"
            );
        }
        Err(e) => {
            println!("Oh no! Authentication failed because : {e}");
        }
    }
}

// 在非移动平台上提供空实现
#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub fn bio_auth(_app_handle: tauri::AppHandle) {
    // 非移动平台不支持生物识别，不做任何操作
    println!("平台不支持生物识别认证");
}
