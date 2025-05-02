<template>
  <div>
    <h1>Voting Page</h1>
    <h1>{{ state }}</h1>
    <div v-if="state == 'waiting'">
      <h2>投票準備中…</h2>
    </div>
    <div v-if="state == 'voting'">
      <h2>投票中…</h2>
      <label for="myInput">怖さ度を入力</label>
      <input id="myInput" type="text" v-model="userInput" placeholder="Input score..." />
      <button @click="handleSubmit">Submit</button>
    </div>
    <button v-if="state == 'tallying'" @click="handleTally">Tally</button>
    <div v-if="state == 'tallyDone'">
      <p>投票が終了しました</p>
      <p>result: {{ result }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted , onBeforeUnmount} from 'vue';
import axios from 'axios';
import { User } from './models/User';


const userInput = ref('') // ユーザーの入力を格納する変数
let result = ref(0) // ユーザーのoutputを表示する変数
let state = ref('')
const user = new User("ANON", 0); // ユーザーのインスタンスを作成

async function handleSubmit() {
  // ユーザーが入力した値を処理する関数
  try {

  }catch (error) {
    console.error('Error in handleSubmit:', error)
  }
}

async function handleTally() {
}


onMounted(async () => {
  try {
    user.accessPage(); 
  } catch (error) {
    console.error('vote error', error)
  }
})

onBeforeUnmount(() => {
  axios.post('/api/vote/leave').then(response => console.log(response.data)).catch(error => console.error(error));
  // コンポーネントがアンマウントされる前に実行する処
  console.log('Component is about to be unmounted')
})
</script>