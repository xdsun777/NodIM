export {};
declare global {
  interface Window {
    __TAURI__: any; // 如果有更具体的类型，请替换 any
  }
  
}