<!--
 * @Author: 徐佳德 1404577549@qq.com
 * @Date: 2025-11-30 16:37:48
 * @LastEditors: 徐佳德 1404577549@qq.com
 * @LastEditTime: 2025-11-30 16:57:15
 * @FilePath: \chat\src\Components\Tabber.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="tabber">
    <router-link
      v-for="tab in leftTabs"
      :key="tab.path"
      :to="tab.path"
      class="tab-item"
      :class="{ active: $route.path === tab.path }"
    >
      <div class="tab-icon">{{ tab.icon }}</div>
      <div class="tab-label">{{ tab.label }}</div>
    </router-link>
    <button @click="goToAddPost" ref="addButtonRef" class="add-btn">
      <div class="add-icon">+</div>
    </button>
    <router-link
      v-for="tab in rightTabs"
      :key="tab.path"
      :to="tab.path"
      class="tab-item"
      :class="{ active: $route.path === tab.path }"
    >
      <div class="tab-icon">{{ tab.icon }}</div>
      <div class="tab-label">{{ tab.label }}</div>
    </router-link>
  </div>
  
  <Teleport to="body">
    <Transition name="expand">
      <div v-if="isAnimating" class="animation-overlay" ref="overlayRef">
        <div class="expanded-button" ref="expandedButtonRef">
          <div class="add-icon-large">+</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const addButtonRef = ref<HTMLElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)
const expandedButtonRef = ref<HTMLElement | null>(null)
const isAnimating = ref(false)

const leftTabs = [
  { path: '/post', label: '动态', icon: '📝' },
  { path: '/friend', label: '好友', icon: '👥' },
]

const rightTabs = [
  { path: '/chat', label: '聊天', icon: '💬' },
  { path: '/user', label: '我的', icon: '👤' },
]

const goToAddPost = async () => {
  if (!addButtonRef.value) return
  
  // 获取按钮位置
  const buttonRect = addButtonRef.value.getBoundingClientRect()
  
  // 开始动画
  isAnimating.value = true
  
  await nextTick()
  
  if (!expandedButtonRef.value || !overlayRef.value) return
  
  const button = expandedButtonRef.value
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const maxDimension = Math.max(screenWidth, screenHeight)
  const finalSize = maxDimension * 2
  
  // 设置初始位置和大小
  const startX = buttonRect.left + buttonRect.width / 2
  const startY = buttonRect.top + buttonRect.height / 2
  const startSize = buttonRect.width
  
  button.style.left = `${startX}px`
  button.style.top = `${startY}px`
  button.style.width = `${startSize}px`
  button.style.height = `${startSize}px`
  button.style.transform = 'translate(-50%, -50%) rotate(0deg)'
  button.style.transition = 'none'
  
  // 等待一帧确保初始样式已应用
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!button) return
      // 设置动画过渡
      button.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
      // 向上移动到屏幕中心并放大，同时旋转
      button.style.left = '50%'
      button.style.top = '50%'
      button.style.width = `${finalSize}px`
      button.style.height = `${finalSize}px`
      button.style.transform = 'translate(-50%, -50%) rotate(180deg)'
      
      // 同时放大图标
      const icon = button.querySelector('.add-icon-large') as HTMLElement
      if (icon) {
        icon.style.transition = 'font-size 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        icon.style.fontSize = `${finalSize * 0.1}px`
      }
      
      // 动画完成后跳转
      setTimeout(() => {
        router.push('/add-post').then(() => {
          // 跳转完成后关闭动画
          setTimeout(() => {
            isAnimating.value = false
            // 重置样式
            if (button) {
              button.style.transition = 'none'
              button.style.transform = 'translate(-50%, -50%) rotate(0deg)'
            }
            if (icon) {
              icon.style.transition = 'none'
              icon.style.fontSize = ''
            }
          }, 100)
        })
      }, 600)
    })
  })
}
</script>

<style scoped>
.tabber {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #666;
  transition: color 0.2s;
  padding: 4px 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  max-width: 25%;
}

.tab-item.active {
  color: #667eea;
}

.tab-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
}

.tab-item:active {
  opacity: 0.7;
}

.add-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 auto;
  transition: transform 0.2s, box-shadow 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.add-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.add-icon {
  font-size: 32px;
  font-weight: 300;
  color: black;
  line-height: 1;
}

.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 9999;
  pointer-events: none;
}

.expanded-button {
  position: absolute;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
}

.add-icon-large {
  font-size: 32px;
  font-weight: 300;
  color: black;
  line-height: 1;
  transition: font-size 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-enter-active .expanded-button {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-enter-active .add-icon-large {
  transition: font-size 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-enter-from {
  opacity: 0;
}

.expand-enter-to {
  opacity: 1;
}

.expand-leave-active {
  transition: opacity 0.3s;
}

.expand-leave-from {
  opacity: 1;
}

.expand-leave-to {
  opacity: 0;
}
</style>

