// 切换主题
export function changeTheme(theme: 'light' | 'dark' | 'blue') {
  const html = document.documentElement;
  
  // 先移除所有主题
  html.classList.remove('light', 'dark', 'blue');
  
  // 添加新主题
  html.classList.add(theme);
  
  // 可选：保存到本地存储
    localStorage.setItem('theme', theme);
    console.log("theme:",theme);
    
}

// 初始化时读取主题
export function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  changeTheme(saved as any);
}