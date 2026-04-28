import { createAvatar } from '@dicebear/core'
import { avataaars } from '@dicebear/collection'  


export function avatar(seed: string) {
    // 相同种子 = 相同头像
    return createAvatar(avataaars, {
    seed, 
    size: 128,
    backgroundColor: ['ffffff'],
  }).toDataUri()
}