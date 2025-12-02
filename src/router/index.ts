import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/page/Login/Login.vue'
import MainLayout from '@/Components/MainLayout.vue'
import Post from '@/page/Post/Post.vue'
import Friend from '@/page/Friend/Friend.vue'
import User from '@/page/User/User.vue'
import Chat from '@/page/Chat/Chat.vue'
import AddPost from '@/page/AddPost/AddPost.vue'
import UpdateInfo from '@/page/User/UpdateInfo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/add-post',
      name: 'AddPost',
      component: AddPost
    },
    {
      path: '/user/update-info',
      name: 'UpdateInfo',
      component: UpdateInfo
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'post',
          name: 'Post',
          component: Post
        },
        {
          path: 'friend',
          name: 'Friend',
          component: Friend
        },
        {
          path: 'user',
          name: 'User',
          component: User
        },
        {
          path: 'chat',
          name: 'Chat',
          component: Chat
        }
      ]
    }
  ],
})

export default router
