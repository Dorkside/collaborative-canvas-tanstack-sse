import { createRouter, createWebHistory } from 'vue-router'
import Canvas from '../components/Canvas.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/canvas/default'
    },
    {
      path: '/canvas/:canvasId',
      component: Canvas,
      name: 'canvas'
    }
  ]
})

export default router
