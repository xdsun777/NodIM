<template>
  <div class="h-full flex flex-col">
    <!-- 聊天头部 -->
    <div class="border-b border-gray-200 bg-white p-4">
      <div class="flex items-center">
        <button class="mr-3 md:hidden">
          <i class="fas fa-arrow-left text-gray-600"></i>
        </button>
        <img
          src="https://design.gemcoder.com/staticResource/echoAiSystemImages/44a43039eb131b560d93f4cd2f21381b.png"
          class="h-10 w-10 rounded-full object-cover"
          alt="avatar"
        />
        <h3 class="ml-3 font-semibold">后期软件中文交流群</h3>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div class="mb-4 flex justify-start">
        <div class="max-w-[70%] rounded-lg bg-white px-4 py-2 shadow-sm">
          <p class="text-sm">随着科技的迅猛发展，智慧城市建设已成...</p>
          <p class="mt-1 text-xs text-gray-500">下午1:17</p>
        </div>
      </div>
      <div class="mb-4 flex justify-end">
        <div class="max-w-[70%] rounded-lg bg-purple-600 px-4 py-2 text-white shadow-sm">
          <p class="text-sm">确实，数字化转型是必然趋势</p>
          <p class="mt-1 text-xs text-gray-500">下午1:18</p>
        </div>
      </div>
    </div>

    <!-- 输入框 -->
    <div class="border-t border-gray-200 bg-white p-3">
      <div class="flex items-center">
        <button class="mr-3 text-gray-500">
          <i class="fas fa-smile"></i>
        </button>
        <input
          type="text"
          placeholder="输入消息..."
          class="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button class="ml-3 text-purple-600">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</template>