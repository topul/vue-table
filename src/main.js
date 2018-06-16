import Vue from 'vue'
import App from './App.vue'
import TlTable from './components/table'

Vue.config.productionTip = false
Vue.use(TlTable)

new Vue({
  render: h => h(App)
}).$mount('#app')
