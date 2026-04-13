export { };
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __TAURI__: any; // 如果有更具体的类型，请替换 any

  }
}
