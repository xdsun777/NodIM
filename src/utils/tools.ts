import { createAvatar } from '@dicebear/core'
import { adventurer     } from '@dicebear/collection'  


export function avatar(seed: string) {
    // 相同种子 = 相同头像
    return createAvatar(adventurer    , {
    seed, 
    size: 128,
    backgroundColor: ['ffffff'],
  }).toDataUri()
}