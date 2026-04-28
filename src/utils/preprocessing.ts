/**
 * 程序预处理模块
 * 负责初始化数据库、创建表结构、加载配置等
 * P2P 初始化已移至 @/plugins/p2pListener
 */

import { fileStorageDB } from './fileStorageDB'

// ------------------------------
// 数据库名称和版本
// ------------------------------
const DB_NAME = 'NodIM-Chat'
const DB_VERSION = 1

// ------------------------------
// 存储对象名称
// ------------------------------
const STORE_USERS = 'users'
const STORE_CHATS = 'chats'
const STORE_MESSAGES = 'messages'

// ------------------------------
// 类型定义
// ------------------------------

/**
 * 用户信息
 */
export interface User {
  id: string              // 用户ID（PeerID）
  name: string            // 用户名
  avatar?: string         // 头像URL或生成的头像
  status: 'online' | 'offline' | 'away'  // 在线状态
  lastSeen?: number       // 最后上线时间
  createdAt: number       // 创建时间
  updatedAt: number       // 更新时间
}

/**
 * 聊天会话
 */
export interface Chat {
  id: string              // 会话ID（peerId 或 'broadcast'）
  peerId: string          // 对方PeerID（广播时为 'broadcast'）
  type: 'private' | 'broadcast'  // 会话类型
  name?: string           // 会话名称（可选，优先使用对方用户名）
  avatar?: string         // 会话头像
  unreadCount: number     // 未读消息数
  lastMessage?: string    // 最后一条消息预览
  lastMessageTime?: number // 最后消息时间
  createdAt: number       // 创建时间
  updatedAt: number       // 更新时间
}

/**
 * 消息类型
 */
export type MessageType = 'text' | 'file' | 'image' | 'video' | 'audio' | 'system'

/**
 * 消息状态
 */
export type MessageStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

/**
 * 消息记录
 */
export interface Message {
  id: string              // 消息唯一ID
  chatId: string          // 所属会话ID
  from: string            // 发送者PeerID
  to: string              // 接收者PeerID（广播时为 'broadcast'）
  type: MessageType       // 消息类型
  content: string         // 消息内容（文本消息为内容，文件消息为文件ID）
  fileName?: string       // 文件名（文件消息）
  fileSize?: number       // 文件大小（文件消息）
  status: MessageStatus   // 消息状态
  timestamp: number       // 发送时间
  isSelf: boolean         // 是否是自己发送的
}

// ------------------------------
// 数据库操作类
// ------------------------------

class ChatDatabase {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  /**
   * 初始化数据库
   */
  public async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
          console.error('Chat database open failed:', request.error)
          reject(new Error(`Chat database open failed: ${request.error}`))
        }

        request.onsuccess = () => {
          this.db = request.result
          console.log('Chat database initialized successfully')
          resolve(this.db!)
        }

        request.onupgradeneeded = (event) => {
          console.log('Chat database upgrade needed')
          try {
            const db = (event.target as IDBOpenDBRequest).result

            // 创建用户表
            if (!db.objectStoreNames.contains(STORE_USERS)) {
              const userStore = db.createObjectStore(STORE_USERS, { keyPath: 'id' })
              userStore.createIndex('status', 'status', { unique: false })
              userStore.createIndex('updatedAt', 'updatedAt', { unique: false })
              console.log('Users store created')
            }

            // 创建会话表
            if (!db.objectStoreNames.contains(STORE_CHATS)) {
              const chatStore = db.createObjectStore(STORE_CHATS, { keyPath: 'id' })
              chatStore.createIndex('peerId', 'peerId', { unique: true })
              chatStore.createIndex('type', 'type', { unique: false })
              chatStore.createIndex('updatedAt', 'updatedAt', { unique: false })
              console.log('Chats store created')
            }

            // 创建消息表
            if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
              const msgStore = db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' })
              msgStore.createIndex('chatId', 'chatId', { unique: false })
              msgStore.createIndex('from', 'from', { unique: false })
              msgStore.createIndex('to', 'to', { unique: false })
              msgStore.createIndex('timestamp', 'timestamp', { unique: false })
              msgStore.createIndex('status', 'status', { unique: false })
              console.log('Messages store created')
            }
          } catch (error) {
            console.error('Error during chat database upgrade:', error)
            reject(error)
          }
        }

        request.onblocked = () => {
          console.warn('Chat database open blocked - close other tabs using this site')
        }
      } catch (error) {
        console.error('Error initializing chat database:', error)
        reject(error)
      }
    })

    return this.initPromise
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }
    return this.initDB()
  }

  // ==================== 用户表操作 ====================

  /**
   * 添加或更新用户
   */
  async putUser(user: User): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USERS, 'readwrite')
      const store = tx.objectStore(STORE_USERS)
      const request = store.put(user)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  /**
   * 获取用户
   */
  async getUser(userId: string): Promise<User | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USERS, 'readonly')
      const store = tx.objectStore(STORE_USERS)
      const request = store.get(userId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  /**
   * 获取所有用户
   */
  async getAllUsers(): Promise<User[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USERS, 'readonly')
      const store = tx.objectStore(STORE_USERS)
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  /**
   * 获取在线用户
   */
  async getOnlineUsers(): Promise<User[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USERS, 'readonly')
      const store = tx.objectStore(STORE_USERS)
      const index = store.index('status')
      const request = index.getAll('online')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_USERS, 'readwrite')
      const store = tx.objectStore(STORE_USERS)
      const request = store.delete(userId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // ==================== 会话表操作 ====================

  /**
   * 添加或更新会话
   */
  async putChat(chat: Chat): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHATS, 'readwrite')
      const store = tx.objectStore(STORE_CHATS)
      const request = store.put(chat)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  /**
   * 获取会话
   */
  async getChat(chatId: string): Promise<Chat | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHATS, 'readonly')
      const store = tx.objectStore(STORE_CHATS)
      const request = store.get(chatId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  /**
   * 获取所有会话（按更新时间排序）
   */
  async getAllChats(): Promise<Chat[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHATS, 'readonly')
      const store = tx.objectStore(STORE_CHATS)
      const index = store.index('updatedAt')
      const request = index.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const chats = request.result || []
        // 按更新时间降序排列
        chats.sort((a, b) => b.updatedAt - a.updatedAt)
        resolve(chats)
      }
    })
  }

  /**
   * 删除会话（同时删除相关消息）
   */
  async deleteChat(chatId: string): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CHATS, STORE_MESSAGES], 'readwrite')
      
      // 删除消息
      const msgStore = tx.objectStore(STORE_MESSAGES)
      const msgIndex = msgStore.index('chatId')
      const deleteRequest = msgIndex.openCursor(IDBKeyRange.only(chatId))
      
      deleteRequest.onerror = () => reject(deleteRequest.error)
      deleteRequest.onsuccess = () => {
        const cursor = deleteRequest.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          // 删除会话
          const chatStore = tx.objectStore(STORE_CHATS)
          const chatDeleteRequest = chatStore.delete(chatId)
          chatDeleteRequest.onerror = () => reject(chatDeleteRequest.error)
          chatDeleteRequest.onsuccess = () => resolve()
        }
      }
    })
  }

  // ==================== 消息表操作 ====================

  /**
   * 添加或更新消息
   */
  async putMessage(message: Message): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite')
      const store = tx.objectStore(STORE_MESSAGES)
      const request = store.put(message)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  /**
   * 获取消息
   */
  async getMessage(messageId: string): Promise<Message | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly')
      const store = tx.objectStore(STORE_MESSAGES)
      const request = store.get(messageId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  /**
   * 获取会话的消息（支持分页）
   * @param chatId 会话ID
   * @param offset 偏移量（可选）
   * @param limit 每页数量（可选）
   */
  async getMessagesByChat(chatId: string, offset?: number, limit?: number): Promise<Message[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly')
      const store = tx.objectStore(STORE_MESSAGES)
      const index = store.index('chatId')
      const request = index.getAll(IDBKeyRange.only(chatId))
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        let messages = request.result || []
        messages.sort((a, b) => a.timestamp - b.timestamp)
        
        // 应用分页
        if (offset !== undefined && offset > 0) {
          messages = messages.slice(offset)
        }
        if (limit !== undefined && messages.length > limit) {
          messages = messages.slice(0, limit)
        }
        
        resolve(messages)
      }
    })
  }

  /**
   * 获取最新的N条消息
   * @param chatId 会话ID
   * @param count 获取的消息数量
   */
  async getLatestMessages(chatId: string, count: number): Promise<Message[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly')
      const store = tx.objectStore(STORE_MESSAGES)
      const index = store.index('chatId')
      const request = index.getAll(IDBKeyRange.only(chatId))
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        let messages = request.result || []
        messages.sort((a, b) => a.timestamp - b.timestamp)
        
        if (messages.length > count) {
          messages = messages.slice(-count)
        }
        
        resolve(messages)
      }
    })
  }

  /**
   * 获取消息总数
   */
  async getMessageCount(chatId: string): Promise<number> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly')
      const store = tx.objectStore(STORE_MESSAGES)
      const index = store.index('chatId')
      const request = index.count(IDBKeyRange.only(chatId))
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result || 0)
      }
    })
  }

  /**
   * 更新消息状态
   */
  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite')
      const store = tx.objectStore(STORE_MESSAGES)
      const getRequest = store.get(messageId)
      
      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const message = getRequest.result as Message
        if (message) {
          message.status = status
          const putRequest = store.put(message)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          resolve()
        }
      }
    })
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: string): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite')
      const store = tx.objectStore(STORE_MESSAGES)
      const request = store.delete(messageId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 获取未读消息数
   */
  async getUnreadCount(chatId: string): Promise<number> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly')
      const store = tx.objectStore(STORE_MESSAGES)
      
      // 使用复合索引查询：chatId + status = 'pending'
      // 由于IndexedDB不支持复合索引的直接查询，我们先获取所有消息再过滤
      const index = store.index('chatId')
      const request = index.getAll(IDBKeyRange.only(chatId))
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const messages = request.result as Message[] || []
        const count = messages.filter(m => m.status === 'pending' || m.status === 'sent' || m.status === 'delivered').length
        resolve(count)
      }
    })
  }

  // ==================== 工具方法 ====================

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_USERS, STORE_CHATS, STORE_MESSAGES], 'readwrite')
      const userRequest = tx.objectStore(STORE_USERS).clear()
      const chatRequest = tx.objectStore(STORE_CHATS).clear()
      const msgRequest = tx.objectStore(STORE_MESSAGES).clear()
      
      userRequest.onerror = () => reject(userRequest.error)
      chatRequest.onerror = () => reject(chatRequest.error)
      msgRequest.onerror = () => reject(msgRequest.error)
      msgRequest.onsuccess = () => resolve()
    })
  }
}

// ------------------------------
// 导出实例和类型
// ------------------------------

export const chatDB = new ChatDatabase()

// ------------------------------
// 预处理函数
// ------------------------------

/**
 * 初始化所有数据库
 */
export async function initDatabases(): Promise<void> {
  console.log('Initializing databases...')
  
  try {
    // 初始化聊天数据库
    await chatDB.initDB()
    console.log('✓ Chat database initialized')
    
    // 初始化文件存储数据库
    await fileStorageDB.initDB()
    console.log('✓ File storage database initialized')
    
    console.log('All databases initialized successfully')
  } catch (error) {
    console.error('Failed to initialize databases:', error)
    throw error
  }
}



/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取或创建会话ID
 */
export function getChatId(peerId: string, type: 'private' | 'broadcast'): string {
  if (type === 'broadcast') {
    return 'broadcast'
  }
  return peerId
}





/**
 * 应用启动预处理
 * P2P 初始化已移至 @/plugins/p2pListener
 */
export async function preprocess(): Promise<void> {
  console.log('开始预处理...')
  
  try {
    // 初始化数据库
    await initDatabases()
    console.log('✓ 数据库初始化完成')
    
    console.log('预处理完成')
  } catch (error) {
    console.error('预处理失败:', error)
    throw error
  }
}