import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { P2PRequestConfig, P2PResponse, PeerInfo, P2PEvent } from './types';

/**
 * 仿Axios的 P2P 请求客户端
 * 单例模式，全局唯一P2P节点
 */
export class P2PRequest {
  private static _instance: P2PRequest;
  private _initialized = false;
  private _localPeerId = '';
  private _eventListeners: Map<P2PEvent, UnlistenFn[]> = new Map();

  private constructor() {}

  /** 获取单例 */
  public static getInstance(): P2PRequest {
    if (!P2PRequest._instance) {
      P2PRequest._instance = new P2PRequest();
    }
    return P2PRequest._instance;
  }

  /** 本地节点ID */
  public get localPeerId(): string {
    return this._localPeerId;
  }

  /** 是否已初始化 */
  public get isInitialized(): boolean {
    return this._initialized;
  }

  // ==============================================
  // 核心：初始化 P2P 节点（必须先调用）
  // ==============================================
  public async init(): Promise<string> {
    if (this._initialized) return this._localPeerId;

    try {
      // 调用Rust后端启动P2P节点
      this._localPeerId = await invoke<string>('start_p2p_node');
      this._initialized = true;
      console.log('✅ P2P节点启动成功:', this._localPeerId);
      return this._localPeerId;
    } catch (err) {
      console.error('❌ P2P初始化失败:', err);
      throw err;
    }
  }

  // ==============================================
  // 核心：通用请求（对标 axios.request）
  // ==============================================
  public async request<T = unknown>(config: P2PRequestConfig): Promise<P2PResponse<T>> {
    this.checkInitialized();

    // 数据编码
    const encoder = new TextEncoder();
    const payload = encoder.encode(JSON.stringify(config.data));

    // 调用Rust发送P2P请求
    const resBytes = await invoke<number[]>('send_p2p_request', {
      peerId: config.peerId,
      data: Array.from(payload),
    });

    // 数据解码
    const decoder = new TextDecoder();
    const resData = JSON.parse(decoder.decode(new Uint8Array(resBytes))) as T;

    return {
      data: resData,
      peerId: config.peerId,
      success: true,
    };
  }

  // ==============================================
  // 快捷方法：发送文本消息
  // ==============================================
  public async send<T = unknown>(peerId: string, data: unknown): Promise<P2PResponse<T>> {
    return this.request<T>({ peerId, data, type: 'text' });
  }

  // ==============================================
  // 获取局域网所有已发现节点
  // ==============================================
  public async getDiscoveredPeers(): Promise<PeerInfo[]> {
    this.checkInitialized();
    return invoke<PeerInfo[]>('get_discovered_peers');
  }

  // ==============================================
  // 事件监听（节点发现/消息接收）
  // ==============================================
  public on<T = unknown>(event: P2PEvent, callback: (data: T) => void): UnlistenFn {
    const unlisten = listen<T>(event, (payload) => {
      callback(payload.payload);
    });

    // 保存监听函数，用于组件销毁时清理
    const listeners = this._eventListeners.get(event) || [];
    unlisten.then((ul) => {
      listeners.push(ul);
      this._eventListeners.set(event, listeners);
    });

    return unlisten;
  }

  // ==============================================
  // 工具：销毁所有事件监听（Vue组件卸载时调用）
  // ==============================================
  public destroyListeners(): void {
    this._eventListeners.forEach((listeners) => {
      listeners.forEach((ul) => ul());
    });
    this._eventListeners.clear();
  }

  // ==============================================
  // 私有：校验初始化状态
  // ==============================================
  private checkInitialized(): void {
    if (!this._initialized) {
      throw new Error('请先调用 p2p.init() 初始化P2P节点');
    }
  }
}