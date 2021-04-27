import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export const routes = [
  {
    path: '/',
    component: () => import('../components/connect')
  },
  {
    path: '/xterm',
    name: 'xterm',
    component: () => import('../components/xterm')
  },
  {
    path: '/file',
    name: 'file',
    component: () => import('../components/FileManager')
  },
  {
    path: '/404',
    component: () => import('../components/NotFound')
  },
  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404' }
]

const createRouter = () => {
  return new Router({
    mode: 'history', // require service support
    routes
  })
}

export default createRouter()

