import { authenticate } from '@tauri-apps/plugin-biometric';

const options = {
    // 如果你希望用户能够使用手机密码进行身份验证，请设为 true
    allowDeviceCredential: true,
    cancelTitle: "如果取消将无法使用",

    // 仅 iOS 平台的功能
    fallbackTitle: '抱歉，身份验证失败',

    // 仅 Android 平台的功能
    title: '解锁 NodIM',
    subtitle: '请使用生物识别解锁应用',
    confirmationRequired: true,
};

export function authApp(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        authenticate('应用已锁定', options)
            .then(() => {
                resolve(true);
            })
            .catch((err) => {
                const errorMessage = err instanceof Error 
                    ? err.message 
                    : typeof err === 'string' 
                        ? err 
                        : JSON.stringify(err, null, 2);
                console.log('解锁失败:', errorMessage);
                reject(err);
            });
    });
}