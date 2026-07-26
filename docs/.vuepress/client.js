import { defineClientConfig } from 'vuepress/client'
import SidebarResizer from './components/SidebarResizer.vue'
import RightToc from './components/RightToc.vue'
import './styles/index.css'

export default defineClientConfig({
  rootComponents: [SidebarResizer, RightToc],
})
