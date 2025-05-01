<template>
    <div>
      <h1>Debug Page</h1>
      <button @click="handleButton">Reset Redis value</button>
      <button @click="runDebug">Run Debug</button>
      <button @click="stopDebug">Stop Debug</button>
      <button @click="testFunc">test Function</button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted , onBeforeUnmount} from 'vue';
import * as openpgp from 'openpgp';
import {calcPolyValue, genKeys, encryptedMessage, decryptedMessage, getSecret, getShares, point} from './utils/cryptoUtils';
import axios from 'axios';
import { User } from './models/User';
import { Host } from './models/Host';
const PRIME = 10007;
let keys = ref<any>(null);
let stopFlag = ref(false);  

async function testFunc() {
    try {
        const testUser = new User("0",77);
        console.log('testUser type of pk', typeof testUser.pk);
        await testUser.accessPage();
        await testUser.sendScore();
    } catch (error) {
        console.error('Error calling test API:', error);
    }
}

async function handleButton() {
await axios.get('/api/manage/leave')
    .then(response => {
    console.log('Redis value reset:', response.status);
    })
    .catch(error => {
    console.error('Error resetting Redis value:', error);
    });
}
  
function stopDebug() {
    console.log('Stopping debug...');
    stopFlag.value = true; // stopFlagをtrueに設定
    // ここで必要なクリーンアップ処理を行う
}

async function runDebug() {
    stopFlag.value = false; // stopFlagをfalseに設定
    const numOfUser = 3;
    const host = new Host();
    const user1 = new User("1",10);
    const user2 = new User("2",20);
    const user3 = new User("3",30);
    await user1.accessPage();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await user2.accessPage();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await user3.accessPage();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    outer:
    while(true) {
        if (stopFlag.value) {
            console.log('Debug stopped.');
            break; // stopFlagがtrueならループを抜ける
        }
      try {
        const response = await axios.get('/api/vote/getState');
        if (!response) {
          console.log('State is not set yet');
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
  
        const state = response.data.state;
  
  
        switch (state) {
          case 'waiting':
            try {
              console.log('State is waiting');
              const respnse = await axios.get('/api/vote/getCount');
              if (!respnse) {
                console.log('Count is not set yet');
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              const count = respnse.data.count;
              console.log('Count:', count);
              if (count == numOfUser) {
                console.log('Count is equal to numOfUser');
                await host.start();
                console.log('Vote started');
              }
            } catch (error) {
              console.error('Error in waiting state:', error);
              throw error; // エラー発生時、上位のcatchへ投げてループ終了
              break outer; // ループを抜ける
            }
            break;
  
          case 'voting':
            console.log('State is voting');
            try {
              await user1.getPkList();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await user2.getPkList();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await user3.getPkList();
              await new Promise(resolve => setTimeout(resolve, 1000));
  
              user1.setScore(40);
              user2.setScore(50);
              user3.setScore(60);
  
              await user1.sendScore();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await user2.sendScore();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await user3.sendScore();
              await new Promise(resolve => setTimeout(resolve, 1000));
  
              const resonse_tallyReady = await axios.get('/api/manage/getTallyReady');
              if (!resonse_tallyReady) {
                console.log('TallyReady is not set yet');
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              const tallyReady = resonse_tallyReady.data.tallyReady;
              console.log('TallyReady:', tallyReady);
  
              if (tallyReady == numOfUser) {
                console.log('TallyReady is equal to numOfUser');
                await host.tally();
              }
            } catch (error) {
              console.error('Error in voting state:', error);
              throw error;
              break outer; // ループを抜ける
            }
            break;
  
          case 'tallying':
            console.log('State is tallying');
            try {
              await user1.tally();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await user2.tally();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await user3.tally();
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error('Error in tallying state:', error);
              throw error;
              break outer; // ループを抜ける
            }
            break;
  
          case 'tallyDone':
            console.log('State is done');
            try {
              await user1.getResult();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await user2.getResult();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await user3.getResult();
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error('Error in done state:', error);
              throw error;
              break outer; // ループを抜ける
            }
            break outer;
  
          default:
            console.log('Unknown state:', state);
            break outer;
        }
  
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error caught in runDebug, exiting loop:', error);
        break; // エラーが発生したらwhileループを抜ける
      }
    }
  }
  
  onMounted(() => {
    // 必要ならonMountedでrunDebugを呼ぶとか
  });
  
  onBeforeUnmount(() => {
  })
  </script>