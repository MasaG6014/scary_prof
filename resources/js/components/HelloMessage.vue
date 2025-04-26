<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const message = ref('Hello World') // デフォルトのメッセージ

const fetchHello = async () => {
  try {
    const res = await axios.get('/api/hello')
    message.value = res.data.message
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchHello()
})
</script>

<template>
  <div>{{ message }}</div>
</template>