import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'
import { scan,Format } from "@tauri-apps/plugin-barcode-scanner";


export function avatar(seed: string) {
  // 相同种子 = 相同头像
  return createAvatar(adventurer, {
    seed,
    size: 128,
    backgroundColor: ['ffffff'],
  }).toDataUri()
}

export function scanQRCode() {
  // 扫描二维码

  scan({
    windowed: false,
    formats: [Format.QRCode]
  }).then(resp => {
    console.log(`扫码内容: ${resp.content}`);
  })
}