<template>
  <aside v-if="headers.length" class="right-toc">
    <div class="right-toc-title">大纲</div>
    <ul class="right-toc-list">
      <li v-for="h in flattenHeaders" :key="h.slug" :class="['toc-item', `level-${h.level}`, { active: activeId === h.slug }]">
        <a :href="'#' + h.slug" @click.prevent="scrollTo(h.slug)">{{ h.title }}</a>
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { usePageData, useRouter } from 'vuepress/client'

const pageData = usePageData()
const router = useRouter()
const activeId = ref('')

const headers = computed(() => pageData.value.headers || [])

function flatten(hs, level = 2) {
  const result = []
  for (const h of hs) {
    result.push({ slug: h.slug, title: h.title, level })
    if (h.children) result.push(...flatten(h.children, level + 1))
  }
  return result
}

const flattenHeaders = computed(() => flatten(headers.value))

function scrollTo(slug) {
  const el = document.getElementById(slug)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onScroll() {
  let current = ''
  for (const h of flattenHeaders.value) {
    const el = document.getElementById(h.slug)
    if (el && el.getBoundingClientRect().top <= 80) current = h.slug
  }
  activeId.value = current
}

watch(() => router.currentRoute.value.path, () => {
  activeId.value = ''
})

onMounted(() => {
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style>
.right-toc {
  position: fixed;
  top: 100px;
  right: 24px;
  width: 200px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  z-index: 50;
  font-size: 13px;
  line-height: 1.6;
  border-left: 1px solid var(--c-border, #eaecef);
  padding-left: 12px;
}
.right-toc-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--c-text, #2c3e50);
}
.right-toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.toc-item {
  margin: 2px 0;
}
.toc-item a {
  color: var(--c-text-quote, #999);
  text-decoration: none;
  display: block;
  padding: 2px 0;
  border-left: 2px solid transparent;
  padding-left: 8px;
  transition: all 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.toc-item a:hover {
  color: var(--c-brand, #3eaf7c);
}
.toc-item.active a {
  color: var(--c-brand, #3eaf7c);
  border-left-color: var(--c-brand, #3eaf7c);
}
.toc-item.level-2 { padding-left: 0; }
.toc-item.level-3 { padding-left: 12px; }
.toc-item.level-4 { padding-left: 24px; }
.toc-item.level-5 { padding-left: 36px; }
.toc-item.level-6 { padding-left: 48px; }
</style>
