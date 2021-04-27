import Vue from 'vue'
import App from './App.vue'
import ViewUI from 'view-design'
import router from './router'
import 'view-design/dist/styles/iview.css'
import '@/assets/main.scss'
import '@/utils/index'

Vue.config.productionTip = false
Vue.use(ViewUI)
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
