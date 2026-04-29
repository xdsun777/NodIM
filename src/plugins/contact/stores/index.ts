import { defineStore } from 'pinia';
import { chatDB } from '@/utils/preprocessing';

export interface User {
  id: string;              // 用户ID（PeerID），主键
  name: string;            // 用户名
  status: 'online' | 'offline' | 'away';  // 在线状态
  avatar?: string;         // 头像URL或生成的头像
  lastSeen?: number;       // 最后上线时间戳
  createdAt: number;       // 创建时间
  updatedAt: number;       // 更新时间
}

export const useContactStore = defineStore('contact', {
  state: () => ({
    contacts: [] as User[],
    isLoading: false,
  }),
  getters: {
    // 获取在线好友列表
    onlineFriends: (state) => {
      return state.contacts.filter((user) => user.status === 'online');
    },
    // 获取离线好友列表
    offlineFriends: (state) => {
      return state.contacts.filter((user) => user.status !== 'online');
    },
    // 获取所有好友（按在线状态排序）
    sortedFriends: (state) => {
      return [...state.contacts].sort((a, b) => {
        // 在线状态优先级：online > away > offline
        const statusOrder = { online: 0, away: 1, offline: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
    },
  },
  actions: {
    // 初始化联系人列表
    async initContacts() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      try {
        // 从数据库获取所有用户
        const users = await chatDB.getAllUsers();
        
        if (users && users.length > 0) {
          this.contacts = users.map((user) => ({
            id: user.id,
            name: user.name || user.id.slice(0, 8),
            status: (user.status as User['status']) || 'offline',
            avatar: user.avatar,
            lastSeen: user.lastSeen,
            createdAt: user.createdAt || Date.now(),
            updatedAt: user.updatedAt || Date.now(),
          }));
        } else {
          // 如果数据库中没有数据，使用模拟数据
            console.log('没有');
            
        }
      } catch (error) {
        console.error('Failed to load contacts:', error);
        // 加载失败时使用模拟数据
      } finally {
        this.isLoading = false;
      }
    },


    // 添加联系人
    async addContact(user: Omit<User, 'createdAt' | 'updatedAt'>) {
      const now = Date.now();
      const newUser: User = {
        ...user,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await chatDB.putUser(newUser);
        // 如果已存在则更新，否则添加
        const existingIndex = this.contacts.findIndex((c) => c.id === user.id);
        if (existingIndex >= 0) {
          this.contacts[existingIndex] = newUser;
        } else {
          this.contacts.push(newUser);
        }
      } catch (error) {
        console.error('Failed to add contact:', error);
        throw error;
      }
    },

    // 更新联系人状态
    async updateContactStatus(peerId: string, status: User['status']) {
      const contact = this.contacts.find((c) => c.id === peerId);
      if (contact) {
        contact.status = status;
        contact.updatedAt = Date.now();
        if (status === 'offline') {
          contact.lastSeen = Date.now();
        }

        try {
          await chatDB.putUser(contact);
        } catch (error) {
          console.error('Failed to update contact status:', error);
        }
      }
    },

    // 删除联系人
    async removeContact(peerId: string) {
      try {
        await chatDB.deleteUser(peerId);
        this.contacts = this.contacts.filter((c) => c.id !== peerId);
      } catch (error) {
        console.error('Failed to remove contact:', error);
        throw error;
      }
    },

    // 获取单个联系人
    getContact(peerId: string): User | undefined {
      return this.contacts.find((c) => c.id === peerId);
    },
  },
});