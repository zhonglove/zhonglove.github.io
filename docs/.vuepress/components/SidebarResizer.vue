<template>
  <div class="sidebar-resizer" @mousedown.prevent="startDrag"></div>
</template>

<script setup>
import { onMounted } from 'vue'

const MIN = 200
const MAX = 500
const STORAGE_KEY = 'sidebar-width'

function startDrag(e) {
  const startX = e.clientX
  const startWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width')) || 260

  function onMove(e) {
    const w = Math.min(MAX, Math.max(MIN, startWidth + e.clientX - startX))
    document.documentElement.style.setProperty('--sidebar-width', w + 'px')
  }

  function onUp() {
    const w = parseInt(document.documentElement.style.getPropertyValue('--sidebar-width')) || 260
    localStorage.setItem(STORAGE_KEY, String(w))
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    document.documentElement.style.setProperty('--sidebar-width', saved + 'px')
  }
})
</script>

<style>
.sidebar-resizer {
  position: fixed;
  left: var(--sidebar-width, 16rem);
  top: var(--navbar-height, 3.6rem);
  bottom: 0;
  width: 4px;
  z-index: 100;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
}
.sidebar-resizer:hover,
.sidebar-resizer:active {
  background: var(--c-brand, #3eaf7c);
}
</style>
