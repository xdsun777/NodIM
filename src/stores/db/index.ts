import { openDB, IDBPDatabase } from 'idb'

type StoreName = string

class ChainDB {
  private db: Promise<IDBPDatabase>
  private currentStore: string = ''

  constructor(dbName: string, version: number, stores: string[]) {
    this.db = openDB(dbName, version, {
      upgrade(db) {
        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' })
          }
        })
      }
    })
  }

  // 选择数据表，开启链式
  table(storeName: StoreName): this {
    this.currentStore = storeName
    return this
  }

  // 新增
  async add<T>(data: T) {
    const db = await this.db
    await db.add(this.currentStore, data)
    return this
  }

  // 更新 / 覆盖写入
  async put<T>(data: T) {
    const db = await this.db
    await db.put(this.currentStore, data)
    return this
  }

  // 根据 id 查询单条
  async get<T>(id: string | number): Promise<T | undefined> {
    const db = await this.db
    return db.get(this.currentStore, id)
  }

  // 查询全部
  async list<T>(): Promise<T[]> {
    const db = await this.db
    return db.getAll(this.currentStore)
  }

  // 删除单条
  async remove(id: string | number) {
    const db = await this.db
    await db.delete(this.currentStore, id)
    return this
  }

  // 清空整张表
  async clear() {
    const db = await this.db
    await db.clear(this.currentStore)
    return this
  }

  // 自定义过滤查询（IM 聊天必备：按会话id筛选消息）
  async filter<T>(fn: (item: T) => boolean): Promise<T[]> {
    const all = await this.list<T>()
    return all.filter(fn)
  }
}

// 初始化你的 IM 数据库
export const db = new ChainDB('nod_im_db', 1, [
  'message',
  'session',
  'user'
])

// // 链式新增多条消息
// await db.table('message')
//   .add({ id:'1', content:'hello' })
//   .add({ id:'2', content:'hi' })

// // 更新消息
// await db.table('message').put({ id:'1', content:'修改内容' })

// // 删除
// await db.table('message').remove('1')

// // 查询当前会话所有聊天记录
// const records = await db
//   .table('message')
//   .filter(item => item.sessionId === 'xxx')