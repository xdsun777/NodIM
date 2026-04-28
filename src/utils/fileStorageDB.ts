/**
 * IndexedDB 文件存储服务
 * 用于存储和管理从 P2P 接收到的文件块数据
 */

const DB_NAME = 'NodIM-FileStorage'
const DB_VERSION = 1
const STORE_NAME = 'file-chunks'
const TRANSFER_STORE_NAME = 'file-transfers'

interface FileTransferMeta {
  id: string // peer-transferId
  peer: string
  transferId: number
  fileName: string
  totalChunks: number
  receivedChunks: number
  totalSize: number
  createdAt: number
  completedAt?: number
  status: 'transferring' | 'completed' | 'failed'
}

interface FileChunk {
  id: string // `${transferId}-${chunkIndex}`
  transferId: number
  chunkIndex: number
  data: Uint8Array
  timestamp: number
}

class FileStorageDB {
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
          console.error('IndexedDB open failed:', request.error)
          reject(new Error(`IndexedDB open failed: ${request.error}`))
        }

        request.onsuccess = () => {
          this.db = request.result
          console.log('IndexedDB initialized successfully')
          resolve(this.db!)
        }

        request.onupgradeneeded = (event) => {
          console.log('IndexedDB upgrade needed')
          try {
            const db = (event.target as IDBOpenDBRequest).result

            // 创建文件块存储
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
              objectStore.createIndex('transferId', 'transferId', { unique: false })
              objectStore.createIndex('chunkIndex', 'chunkIndex', { unique: false })
              console.log('File chunks store created')
            }

            // 创建传输元数据存储
            if (!db.objectStoreNames.contains(TRANSFER_STORE_NAME)) {
              const transferStore = db.createObjectStore(TRANSFER_STORE_NAME, { keyPath: 'id' })
              transferStore.createIndex('peer', 'peer', { unique: false })
              transferStore.createIndex('status', 'status', { unique: false })
              console.log('Transfer metadata store created')
            }
          } catch (error) {
            console.error('Error during upgrade:', error)
            reject(error)
          }
        }

        request.onblocked = () => {
          console.warn('IndexedDB open blocked - close other tabs using this site')
        }
      } catch (error) {
        console.error('Error initializing IndexedDB:', error)
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

  /**
   * 创建文件传输记录
   */
  async createTransfer(
    peer: string,
    transferId: number,
    fileName: string,
    totalSize: number,
    totalChunks: number
  ): Promise<void> {
    const db = await this.ensureDB()

    const meta: FileTransferMeta = {
      id: `${peer}-${transferId}`,
      peer,
      transferId,
      fileName,
      totalChunks,
      receivedChunks: 0,
      totalSize,
      createdAt: Date.now(),
      status: 'transferring',
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(TRANSFER_STORE_NAME, 'readwrite')
        const store = tx.objectStore(TRANSFER_STORE_NAME)
        const request = store.put(meta)

        request.onerror = () => {
          console.error('Failed to create transfer:', request.error)
          reject(request.error)
        }
        request.onsuccess = () => {
          console.log('Transfer created:', meta.id)
          resolve()
        }

        tx.onerror = () => {
          console.error('Transaction error:', tx.error)
          reject(tx.error)
        }
      } catch (error) {
        console.error('Error in createTransfer:', error)
        reject(error)
      }
    })
  }

  /**
   * 保存文件块数据
   */
  async saveChunk(
    transferId: number,
    chunkIndex: number,
    dataBase64: string
  ): Promise<void> {
    const db = await this.ensureDB()

    // 将 Base64 字符串解码为二进制
    let bytes: Uint8Array
    try {
      // 处理 URL 安全的 Base64 字符串
      let base64 = dataBase64
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      
      // 补充缺失的填充字符
      const padLength = 4 - (base64.length % 4)
      if (padLength < 4) {
        base64 += '='.repeat(padLength)
      }
      
      const binaryString = atob(base64)
      bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
    } catch (error) {
      console.error('Failed to decode Base64:', error)
      throw new Error(`Failed to decode Base64: ${error}`)
    }

    const chunk: FileChunk = {
      id: `${transferId}-${chunkIndex}`,
      transferId,
      chunkIndex,
      data: bytes,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const request = store.put(chunk)

        request.onerror = () => {
          console.error('Failed to save chunk:', request.error)
          reject(request.error)
        }
        request.onsuccess = () => {
          console.log(`Chunk saved: ${chunk.id} (${bytes.length} bytes)`)
          resolve()
        }

        tx.onerror = () => {
          console.error('Transaction error:', tx.error)
          reject(tx.error)
        }
      } catch (error) {
        console.error('Error in saveChunk:', error)
        reject(error)
      }
    })
  }

  /**
   * 更新传输进度
   */
  async updateTransferProgress(
    peer: string,
    transferId: number,
    receivedChunks: number
  ): Promise<void> {
    const db = await this.ensureDB()
    const id = `${peer}-${transferId}`

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(TRANSFER_STORE_NAME, 'readwrite')
        const store = tx.objectStore(TRANSFER_STORE_NAME)
        const request = store.get(id)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const meta = request.result as FileTransferMeta
          if (meta) {
            meta.receivedChunks = receivedChunks
            const putRequest = store.put(meta)
            putRequest.onerror = () => reject(putRequest.error)
            putRequest.onsuccess = () => resolve()
          } else {
            resolve()
          }
        }
      } catch (error) {
        console.error('Error in updateTransferProgress:', error)
        reject(error)
      }
    })
  }

  /**
   * 标记传输完成
   */
  async completeTransfer(peer: string, transferId: number): Promise<void> {
    const db = await this.ensureDB()
    const id = `${peer}-${transferId}`

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(TRANSFER_STORE_NAME, 'readwrite')
        const store = tx.objectStore(TRANSFER_STORE_NAME)
        const request = store.get(id)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const meta = request.result as FileTransferMeta
          if (meta) {
            meta.status = 'completed'
            meta.completedAt = Date.now()
            const putRequest = store.put(meta)
            putRequest.onerror = () => reject(putRequest.error)
            putRequest.onsuccess = () => {
              console.log('Transfer completed:', id)
              resolve()
            }
          } else {
            resolve()
          }
        }
      } catch (error) {
        console.error('Error in completeTransfer:', error)
        reject(error)
      }
    })
  }

  /**
   * 获取传输元数据
   */
  async getTransfer(peer: string, transferId: number): Promise<FileTransferMeta | null> {
    const db = await this.ensureDB()
    const id = `${peer}-${transferId}`

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(TRANSFER_STORE_NAME, 'readonly')
        const store = tx.objectStore(TRANSFER_STORE_NAME)
        const request = store.get(id)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result || null)
      } catch (error) {
        console.error('Error in getTransfer:', error)
        reject(error)
      }
    })
  }

  /**
   * 获取所有文件块数据（用于重新组装文件）
   */
  async getAllChunks(transferId: number): Promise<Uint8Array> {
    const db = await this.ensureDB()
    const chunks: FileChunk[] = []

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('transferId')
        const request = index.getAll(transferId)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          chunks.push(...(request.result as FileChunk[]))

          // 按块索引排序
          chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)

          // 合并所有块数据
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0)
          const combined = new Uint8Array(totalLength)

          let offset = 0
          for (const chunk of chunks) {
            combined.set(chunk.data, offset)
            offset += chunk.data.length
          }

          console.log(`All chunks combined: ${combined.length} bytes from ${chunks.length} chunks`)
          resolve(combined)
        }
      } catch (error) {
        console.error('Error in getAllChunks:', error)
        reject(error)
      }
    })
  }

  /**
   * 获取文件块数据
   */
  async getChunk(transferId: number, chunkIndex: number): Promise<Uint8Array | null> {
    const db = await this.ensureDB()
    const id = `${transferId}-${chunkIndex}`

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const request = store.get(id)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const chunk = request.result as FileChunk | undefined
          resolve(chunk?.data || null)
        }
      } catch (error) {
        console.error('Error in getChunk:', error)
        reject(error)
      }
    })
  }

  /**
   * 删除传输记录及其所有块数据
   */
  async deleteTransfer(peer: string, transferId: number): Promise<void> {
    const db = await this.ensureDB()
    const transferMetaId = `${peer}-${transferId}`

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_NAME, TRANSFER_STORE_NAME], 'readwrite')

        // 删除所有相关的块数据
        const chunkStore = tx.objectStore(STORE_NAME)
        const index = chunkStore.index('transferId')
        const deleteRequest = index.openCursor(IDBKeyRange.only(transferId))

        let chunksDeleted = 0
        deleteRequest.onerror = () => reject(deleteRequest.error)
        deleteRequest.onsuccess = () => {
          const cursor = deleteRequest.result
          if (cursor) {
            cursor.delete()
            chunksDeleted++
            cursor.continue()
          } else {
            // 删除传输元数据
            const transferStore = tx.objectStore(TRANSFER_STORE_NAME)
            const metaDeleteRequest = transferStore.delete(transferMetaId)

            metaDeleteRequest.onerror = () => reject(metaDeleteRequest.error)
            metaDeleteRequest.onsuccess = () => {
              console.log(`Transfer deleted: ${transferMetaId} (${chunksDeleted} chunks removed)`)
              resolve()
            }
          }
        }
      } catch (error) {
        console.error('Error in deleteTransfer:', error)
        reject(error)
      }
    })
  }

  /**
   * 获取所有进行中的传输
   */
  async getActiveTransfers(): Promise<FileTransferMeta[]> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(TRANSFER_STORE_NAME, 'readonly')
        const store = tx.objectStore(TRANSFER_STORE_NAME)
        const index = store.index('status')
        const request = index.getAll('transferring')

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const transfers = request.result as FileTransferMeta[]
          console.log(`Found ${transfers.length} active transfers`)
          resolve(transfers)
        }
      } catch (error) {
        console.error('Error in getActiveTransfers:', error)
        reject(error)
      }
    })
  }

  /**
   * 导出文件为 Blob（用于下载）
   */
  async exportAsBlob(transferId: number, mimeType: string = 'application/octet-stream'): Promise<Blob> {
    const data = await this.getAllChunks(transferId)
    console.log(`Exporting blob: ${data.length} bytes, type: ${mimeType}`)
    return new Blob([data], { type: mimeType })
  }

    
    



    
  /**
   * 清理数据库
   */
  async clear(): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_NAME, TRANSFER_STORE_NAME], 'readwrite')
        const chunkRequest = tx.objectStore(STORE_NAME).clear()
        const transferRequest = tx.objectStore(TRANSFER_STORE_NAME).clear()

        chunkRequest.onerror = () => reject(chunkRequest.error)
        transferRequest.onerror = () => reject(transferRequest.error)
        transferRequest.onsuccess = () => {
          console.log('Database cleared')
          resolve()
        }
      } catch (error) {
        console.error('Error in clear:', error)
        reject(error)
      }
    })
  }
}

// 导出单例
export const fileStorageDB = new FileStorageDB()

// 导出类型
export type { FileTransferMeta, FileChunk }