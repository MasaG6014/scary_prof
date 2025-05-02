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
      <p v-if="submitFlag">投票完了！</p>
      <button v-if="!submitFlag" @click="handleSubmit">Submit</button>
    </div>
    <div v-if="state == 'tallyDone'">
      <p>投票が終了しました</p>
      <h3>result: {{ result }}</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { User } from './models/User';

const userInput = ref(''); // ユーザーの入力を格納する変数
let result = ref(0); // ユーザーのoutputを表示する変数
let state = ref('waiting');
const user = new User('ANON', 0); // ユーザーのインスタンスを作成




const submitFlag = ref(false); // submitFlagを初期化
async function handleSubmit() {
  try {
    if (submitFlag.value) {
      console.log('Already submitted');
      return;
    }
    const score = parseInt(userInput.value, 10);
    if (isNaN(score)) {
      console.error('Invalid score input');
      return;
    }
    if (score < 0 || score > 100) {
      console.error('Score must be between 0 and 100');
      return;
    }
    user.setScore(score);
    await user.sendScore();
    submitFlag.value = true; // 送信後にフラグを立てる
    console.log('Score sent successfully');
  } catch (error) {
    console.error('Error sending score:', error);
  }
}


async function fetchState() {
  try {
    const response = await axios.get('/api/vote/getState');
    state.value = response.data.state;
    console.log('Current state:', state.value);
  } catch (error) {
    console.error('Error fetching state:', error);
  }
}


let intervalUserAction: number;
let actionFlag = false; // actionFlagを初期化 
let tallySentFlag = false; // tallSentFlagを初期化
async function userAction () {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        fetchState();
        console.log('State:', state.value);
        switch(state.value) {
          case 'waiting':
            break;
          case 'voting':
            break;
          case 'tallying':
            if (!tallySentFlag) {
              await user.tally();
              tallySentFlag = true; // 送信後にフラグを立てる
            }
            break;
          case 'tallyDone':
            result.value = await user.getResult();
            console.log('Result:', result.value);
            actionFlag = true; // actionFlagを立てる
            break;
          default:
            console.error('Unknown state:', state.value);
        }
      } catch (error) {
        console.error('Error in onMounted:', error);
      }}

onMounted(async () => {
  try {
    user.accessPage();
    intervalUserAction = window.setInterval(userAction, 1000);
    // while (true) {
    //   if (actionFlag) {
    //     console.log('Action completed, breaking the loop');
    //     clearInterval(intervalUserAction);
    //     break;
    //   }
    // }
  } catch (error) {
    console.error('vote error', error);
  }
});

onBeforeUnmount(() => {
  clearInterval(intervalUserAction);
  axios
    .post('/api/vote/leave')
    .then((response) => console.log(response.data))
    .catch((error) => console.error(error));
  console.log('Component is about to be unmounted');
});
</script>