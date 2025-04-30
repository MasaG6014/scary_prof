<template>
    <div>
      <h1>Debug Page</h1>
      <button @click="handleButton">Reset Redis value</button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted , onBeforeUnmount} from 'vue';
  import * as openpgp from 'openpgp';
  import axios from 'axios';
  import {calcPolyValue, genKeys, encryptedMessage, decryptedMessage, getSecret, getShares, point} from './utils/cryptoUtils';
  const PRIME = 10007;
  
  // 鍵生成のオプションを定義
  const keyOptions = {
    type: 'rsa',               // 鍵の種類（'rsa' や 'ecc'）
    rsaBits: 2048,             // RSA鍵の場合のビット長
    userIDs: [{ name: 'anon', email: 'anon@anon.com' }]
  }
  
  let keys = ref<any>(null);
  



  async function handleButton() {
    await axios.get('/api/manage/leave')
      .then(response => {
        console.log('Redis value reset:', response.status);
      })
      .catch(error => {
        console.error('Error resetting Redis value:', error);
      });
  }
  
  onMounted(async () => {
    try {
  
      // key gen, enc, dec
      // const message = String(myScore);
      keys.value = await genKeys();
      console.log("type of pk", typeof keys.value.publicKey);
      const accessData = {
        pk : keys.value.publicKey
      }
      await axios.post('/api/vote/access', accessData)
        .then(response => console.log("vote access ",response.data))
        .catch(error => console.error(error));
      await axios.post('/api/vote/access', accessData)
        .then(response => console.log("vote access ",response.data))
        .catch(error => console.error(error));
    } catch (error) {
      console.error('vote error', error)
    }
  })
  
  onBeforeUnmount(() => {
  })
  </script>