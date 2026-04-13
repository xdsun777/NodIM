<template>
  <div class="bg-gray-50">
    <!-- [MODULE] a1b_响应式布局容器 -->
    <div class="flex flex-col h-screen">
      <!-- [MODULE] 3b4_头部区域 -->
      <header
        class="bg-white px-4 py-3 flex justify-between items-center md:hidden"
      >
        <h1 class="text-xl font-bold">Nodim</h1>
        <button class="text-purple-600">
          <i class="fas fa-expand-alt text-xl"> </i>
        </button>
      </header>
      <!-- [/MODULE] 3b4_头部区域 -- 包含应用名称和分享按钮，仅在移动端显示 -->
      <!-- 桌面端三列布局容器 -->
      <div class="flex flex-1">
        <!-- [MODULE] 9e0_侧边/底部导航栏 -->
        <nav
          class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:static md:w-24 md:h-full md:border-t-0 md:border-r md:flex md:flex-col md:justify-start md:items-center"
          id="main-nav"
        >
          <div class="flex justify-around md:flex-col md:space-y-8 md:pt-6">
            <button class="flex flex-col items-center py-2">
              <i class="fas fa-comment text-purple-600 text-xl"> </i>
              <span class="text-xs text-purple-600 mt-1"> 消息 </span>
            </button>
            <button class="flex flex-col items-center py-2">
              <i class="fas fa-address-book text-gray-500 text-xl"> </i>
              <span class="text-xs text-gray-500 mt-1"> 联系人 </span>
            </button>
            <button class="flex flex-col items-center py-2">
              <img
                alt="我的"
                class="w-6 h-6 rounded-full"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/52d98e00ac78c4d56bfdad9a73a84493.png"
              />
              <span class="text-xs text-gray-500 mt-1"> 我的 </span>
            </button>
          </div>
        </nav>
        <!-- [/MODULE] 9e0_侧边/底部导航栏 -- 移动端为底部导航，桌面端为侧边导航，包含消息、联系人、我的三个导航按钮 -->
        <!-- [MODULE] c3d_列表栏区域 -->
        <main
          id="chat-list"
          class="overflow-y-auto md:w-80 md:border-r md:border-gray-200 pt-0 pb-20 md:pb-0"
        >
          <!-- [MODULE] 5c6_搜索栏 -->
          <div class="px-4 py-3">
            <div class="relative">
              <input
                class="w-full bg-gray-100 rounded-full py-3 px-10 text-gray-700 focus:outline-none"
                placeholder="搜索"
                type="text"
              />
              <i
                class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
              </i>
            </div>
          </div>
          <!-- [/MODULE] 5c6_搜索栏 -- 搜索输入框 -->
          <!-- [MODULE] 7d8_聊天列表 -->
          <div class="px-4">
            <!-- 聊天项1 -->
            <div
              class="flex items-center py-3 border-b border-gray-100 chat-item"
            >
              <img
                alt="头像"
                class="w-12 h-12 rounded-full object-cover"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/26ebd0648627ebe777a64ce2b00380e9.png"
              />
              <div class="ml-3 flex-1">
                <div class="flex justify-between">
                  <h3 class="font-semibold">后期软件中文交流群</h3>
                  <span class="text-xs text-gray-500"> 下午1:18 </span>
                </div>
                <p class="text-sm text-gray-600 truncate">
                  春满大地：随着科技的迅猛发展，智慧城市建设已成...
                </p>
              </div>
              <div
                class="ml-2 bg-purple-600 text-white text-xs rounded-full px-2 py-1"
              >
                99+
              </div>
            </div>
            <!-- 聊天项2 -->
            <div
              class="flex items-center py-3 border-b border-gray-100 chat-item"
            >
              <img
                alt="头像"
                class="w-12 h-12 rounded-full object-cover"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/5b8ba534c935d4b5b077c7447ad690ae.png"
              />
              <div class="ml-3 flex-1">
                <div class="flex justify-between">
                  <h3 class="font-semibold">秋风文化员工群</h3>
                  <span class="text-xs text-gray-500"> 上午10:18 </span>
                </div>
                <p class="text-sm text-gray-600 truncate">
                  小Q：本市将启动新一轮的数字化基础设施升级项目...
                </p>
              </div>
              <div
                class="ml-2 bg-purple-600 text-white text-xs rounded-full px-2 py-1"
              >
                36
              </div>
            </div>
            <!-- 聊天项3 -->
            <div
              class="flex items-center py-3 border-b border-gray-100 chat-item"
            >
              <img
                alt="头像"
                class="w-12 h-12 rounded-full object-cover"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/8b706c46abbcb29c56978cae282f08b9.png"
              />
              <div class="ml-3 flex-1">
                <div class="flex justify-between">
                  <h3 class="font-semibold">幸福一家人</h3>
                  <span class="text-xs text-gray-500"> 昨天 上午9:22 </span>
                </div>
                <p class="text-sm text-gray-600 truncate">
                  姐姐：旨在打破信息孤岛，构建万物互联的智能感知...
                </p>
              </div>
              <div
                class="ml-2 bg-purple-600 text-white text-xs rounded-full px-2 py-1"
              >
                2
              </div>
            </div>
            <!-- 聊天项4 -->
            <div
              class="flex items-center py-3 border-b border-gray-100 chat-item"
            >
              <img
                alt="头像"
                class="w-12 h-12 rounded-full object-cover"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/dc6367577e9cde48914c80c13c7ecccb.png"
              />
              <div class="ml-3 flex-1">
                <div class="flex justify-between">
                  <h3 class="font-semibold">12334游戏建模</h3>
                  <span class="text-xs text-gray-500"> 星期二 </span>
                </div>
                <p class="text-sm text-gray-600 truncate">我不是大佬：大家好</p>
              </div>
              <div
                class="ml-2 bg-purple-600 text-white text-xs rounded-full px-2 py-1"
              >
                8
              </div>
            </div>
            <!-- 聊天项5 -->
            <div
              class="flex items-center py-3 border-b border-gray-100 chat-item"
            >
              <img
                alt="头像"
                class="w-12 h-12 rounded-full object-cover"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/9c3b1629fb53628b3c66b2388d334709.png"
              />
              <div class="ml-3 flex-1">
                <div class="flex justify-between">
                  <h3 class="font-semibold">王小姐</h3>
                  <span class="text-xs text-gray-500"> 02/06 </span>
                </div>
                <p class="text-sm text-gray-600 truncate">不好意思。</p>
              </div>
              <div
                class="ml-2 bg-purple-600 text-white text-xs rounded-full px-2 py-1"
              >
                1
              </div>
            </div>
            <!-- 聊天项6 -->
            <div
              class="flex items-center py-3 border-b border-gray-100 chat-item"
            >
              <img
                alt="头像"
                class="w-12 h-12 rounded-full object-cover"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/694471680a436a8f9cd2c4694f1240ef.png"
              />
              <div class="ml-3 flex-1">
                <div class="flex justify-between">
                  <h3 class="font-semibold">张胖</h3>
                  <span class="text-xs text-gray-500"> 2025/12/11 </span>
                </div>
                <p class="text-sm text-gray-600 truncate">来了来了</p>
              </div>
            </div>
            <!-- 聊天项7 -->
            <div
              class="flex items-center py-3 border-b border-gray-100 chat-item"
            >
              <img
                alt="头像"
                class="w-12 h-12 rounded-full object-cover"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/d46083a56c5e18044d590f31629d9aac.png"
              />
              <div class="ml-3 flex-1">
                <div class="flex justify-between">
                  <h3 class="font-semibold">小丽</h3>
                  <span class="text-xs text-gray-500"> 2025/11/01 </span>
                </div>
                <p class="text-sm text-gray-600 truncate">[图片]</p>
              </div>
            </div>
          </div>
          <!-- [/MODULE] 7d8_聊天列表 -- 显示所有聊天会话，包含头像、名称、消息预览、时间、未读数 -->
        </main>
        <!-- [/MODULE] c3d_列表栏区域 -- 包含搜索栏和聊天列表 -->
        <!-- [MODULE] e5f_聊天内容区域 -->
        <section
          id="chat-content"
          class="hidden md:flex flex-1 border-l border-gray-200 flex flex-col h-full"
        >
          <!-- 聊天头部 -->
          <div class="border-b border-gray-200 p-4 bg-white">
            <div class="flex items-center">
              <button id="back-to-list" class="md:hidden mr-3">
                <i class="fas fa-arrow-left text-gray-600"> </i>
              </button>
              <img
                alt="聊天对象头像"
                class="w-10 h-10 rounded-full object-cover"
                src="https://design.gemcoder.com/staticResource/echoAiSystemImages/44a43039eb131b560d93f4cd2f21381b.png"
              />
              <h3 class="ml-3 font-semibold">后期软件中文交流群</h3>
            </div>
          </div>
          <!-- 聊天消息列表 -->
          <div class="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div class="flex justify-start mb-4">
              <div class="bg-white rounded-lg px-4 py-2 max-w-[70%] shadow-sm">
                <p class="text-sm">随着科技的迅猛发展，智慧城市建设已成...</p>
                <p class="text-xs text-gray-500 mt-1">下午1:17</p>
              </div>
            </div>
            <div class="flex justify-end mb-4">
              <div
                class="bg-purple-600 text-white rounded-lg px-4 py-2 max-w-[70%] shadow-sm"
              >
                <p class="text-sm">确实，数字化转型是必然趋势</p>
                <p class="text-xs text-gray-500 mt-1">下午1:18</p>
              </div>
            </div>
          </div>
          <!-- 消息输入区域 -->
          <div class="border-t border-gray-200 p-3 bg-white">
            <div class="flex items-center">
              <button class="text-gray-500 mr-3">
                <i class="fas fa-smile"> </i>
              </button>
              <input
                type="text"
                placeholder="输入消息..."
                class="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button class="ml-3 text-purple-600">
                <i class="fas fa-paper-plane"> </i>
              </button>
            </div>
          </div>
        </section>
        <!-- [/MODULE] e5f_聊天内容区域 -- 包含聊天头部、消息列表和输入区域，移动端默认隐藏 -->
      </div>
    </div>
    <!-- [/MODULE] a1b_响应式布局容器 -- 移动端垂直布局，桌面端水平三列布局 -->
    <!-- [JSMOD] f4g_响应式布局处理 -->
    <script id="responsive-layout-script">
      function adjustLayout() {
        var mainNav = document.getElementById('main-nav');
        var chatList = document.getElementById('chat-list');
        var chatContent = document.getElementById('chat-content');
        if (window.innerWidth >= 768) {
          // 桌面端三列布局
          mainNav.classList.remove('fixed', 'bottom-0', 'left-0', 'right-0');
          mainNav.classList.add('static', 'w-24', 'h-full');
          chatList.classList.remove('hidden');
          chatContent.classList.remove('hidden');
          chatContent.classList.add('flex');
        } else {
          // 移动端布局
          mainNav.classList.remove('static', 'w-24', 'h-full');
          mainNav.classList.add('fixed', 'bottom-0', 'left-0', 'right-0');

          // 移动端默认显示列表，隐藏内容
          if (!chatContent.classList.contains('hidden')) {
            chatList.classList.remove('hidden');
            chatContent.classList.add('hidden');
            chatContent.classList.remove('flex');
          }
        }
      }
      // 初始化布局
      window.addEventListener('load', adjustLayout);
      // 监听窗口大小变化
      window.addEventListener('resize', adjustLayout);
    </script>
    <!-- [/JSMOD] f4g_响应式布局处理 -- 监听窗口大小变化，动态调整导航栏和内容区域的布局样式 -->
    <!-- [JSMOD] g7h_聊天页面切换逻辑 -->
    <script id="chat-switch-script">
      document.addEventListener('DOMContentLoaded', function () {
        // 聊天列表项点击事件
        document.querySelectorAll('.chat-item').forEach(function (item) {
          item.addEventListener('click', function () {
            if (window.innerWidth < 768) {
              var chatList = document.getElementById('chat-list');
              var chatContent = document.getElementById('chat-content');

              // 切换显示状态
              chatList.classList.add('hidden');
              chatContent.classList.remove('hidden');
              chatContent.classList.add('flex');
            }
          });
        });

        // 返回列表按钮事件
        document.getElementById('back-to-list').addEventListener('click', function () {
          var chatList = document.getElementById('chat-list');
          var chatContent = document.getElementById('chat-content');
          chatList.classList.remove('hidden');
          chatContent.classList.add('hidden');
          chatContent.classList.remove('flex');
        });
      });
    </script>
    <!-- [/JSMOD] g7h_聊天页面切换逻辑 -- 实现移动端聊天列表和内容区域的切换，以及返回列表功能 -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 响应式变量：当前主题、下拉面板可见性
const currentTheme = ref('light');
const panelVisible = ref(false);

// 1. 获取本地存储的主题（记忆用户选择）
const getSavedTheme = () => {
  return localStorage.getItem('theme') || 'light';
};

// 2. 设置主题（核心方法）
const setTheme = (theme) => {
  currentTheme.value = theme;
  // 切换html根元素的dark类
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  // 保存到本地存储
  localStorage.setItem('theme', theme);
  // 关闭下拉面板
  panelVisible.value = false;
};

// 3. 切换明暗主题（点击图标）
const toggleTheme = () => {
  setTheme(currentTheme.value === 'light' ? 'dark' : 'light');
};

// 4. 切换下拉面板显示/隐藏
const togglePanel = () => {
  panelVisible.value = !panelVisible.value;
};

// 5. 点击页面其他地方，关闭下拉面板
onMounted(() => {
  // 初始化主题
  setTheme(getSavedTheme());

  // 监听页面点击事件
  document.addEventListener('click', (e) => {
    const themeTrigger = document.querySelector('.theme-trigger');
    if (themeTrigger && !themeTrigger.contains(e.target)) {
      panelVisible.value = false;
    }
  });
});
</script>

<style scoped></style>