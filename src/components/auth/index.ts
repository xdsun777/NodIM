import { authenticate } from '@tauri-apps/plugin-biometric';

const options = {
    // 如果你希望用户能够使用手机密码进行身份验证，请设为 true
    allowDeviceCredential: true,
    cancelTitle: "如果取消将无法使用",

    // 仅 iOS 平台的功能
    fallbackTitle: '抱歉，身份验证失败',

    // 仅 Android 平台的功能
    title: 'NodIM',
    subtitle: '请使用生物识别解锁应用',
    confirmationRequired: true,
};

export async function authApp() {
    try {
        await authenticate('应用已锁定', options);
        console.log(
            '应用已解锁'
        );
    } catch (err) {
        console.log('解锁失败： ' + err.message);
    }
}
