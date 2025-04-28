<template>
  <div>
    <h1>Home</h1>
    <p>{{ message }}</p>
    <button @click="goVote">Go to Vote</button>
    <button @click="goManage">Go to Manage</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

function goVote() {
  router.push('/vote');
}
function goManage() {
  router.push('/manage');
}

const message = ref('');

onMounted(async () => {
  try {
    const response = await axios.get('/api/hello');
    // Axios は既に JSON パース済みの response.data を返すので、response.data.message を直接利用
    message.value = response.data.message;
    console.log('Fetched message:', message.value);
  } catch (error) {
    console.error('Error fetching message:', error);
  }
});
</script>