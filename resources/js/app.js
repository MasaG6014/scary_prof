import { createApp } from 'vue'
import App from './components/App.vue'
import { createRouter, createWebHistory } from 'vue-router'


const routes = [
    { path: '/', component: () => import('./components/Home.vue') },
    { path: '/vote', component: () => import('./components/Vote.vue') },
    { path: '/manage', component: () => import('./components/Manage.vue') },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

createApp(App).use(router).mount('#app')