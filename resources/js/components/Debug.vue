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
import {calcPolyValue, genKeys, encryptedMessage, decryptedMessage, getSecret, getShares, point, getCoefficients} from './utils/cryptoUtils';
import axios from 'axios';
import { User } from './models/User';
import { Host } from './models/Host';
import { DELAY } from './utils/constants';
import { PRIME } from './utils/constants';;
let keys = ref<any>(null);
let stopFlag = ref(false);  

async function testFunc() {
  console.log('***testFunc called');
    try {
        // const testUser = new User("0",77);
        // console.log('testUser type of pk', typeof testUser.pk);
        // await testUser.accessPage();
        // await testUser.sendScore();
        const value1  = 77;
        const num= 3;
        const coeffeocients1 = getCoefficients(value1, num, PRIME);
        console.log('coefficients:', coeffeocients1);
        const shares1 = getShares(value1, num, coeffeocients1,PRIME);
        // shares.shift();
        console.log('shares:1', shares1);
        const value2 = 88;
        const coeffeocients2 = getCoefficients(value2, num, PRIME);
        console.log('coefficients2:', coeffeocients2);
        const shares2 = getShares(value2, num, coeffeocients2,PRIME);
        console.log('shares:2', shares2);

        const value3 = 99;
        const coeffeocients3 = getCoefficients(value3, num, PRIME);
        console.log('coefficients3:', coeffeocients3);
        const shares3 = getShares(value3, num, coeffeocients3,PRIME);
        console.log('shares:3', shares3);

        let res: point[]= [];
        
        for (let i=0; i < num; i++) {
          const temp = new point(
            i+1,
         ( shares1[i].y+ shares2[i].y+ shares3[i].y)%PRIME
        );
            res.push(temp);
        }
        console.log('res:', res);
        const secret = getSecret(res,PRIME);
        console.log('secret:', secret);
      
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
  console.log('\nRunning debug...\n');
    stopFlag.value = false; // stopFlagをfalseに設定
    const numOfUser = 3;
    const host = new Host();
    const user1 = new User("1",10);
    const user2 = new User("2",20);
    const user3 = new User("3",30);
    await user1.accessPage();
    await new Promise(resolve => setTimeout(resolve, DELAY));
    await user2.accessPage();
    await new Promise(resolve => setTimeout(resolve, DELAY));
    await user3.accessPage();
    await new Promise(resolve => setTimeout(resolve, DELAY));
    
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
          await new Promise(resolve => setTimeout(resolve, DELAY));
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
                await new Promise(resolve => setTimeout(resolve, DELAY));
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
  
              user1.setScore(40);
              user2.setScore(50);
              user3.setScore(60);
  
              await user1.sendScore();
              await new Promise(resolve => setTimeout(resolve, DELAY));
              await user2.sendScore();
              await new Promise(resolve => setTimeout(resolve, DELAY));
              await user3.sendScore();
              await new Promise(resolve => setTimeout(resolve, DELAY));
  
              const resonse_tallyReady = await axios.get('/api/manage/getTallyReady');
              if (!resonse_tallyReady) {
                console.log('TallyReady is not set yet');
                await new Promise(resolve => setTimeout(resolve, DELAY));
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
              await new Promise(resolve => setTimeout(resolve, DELAY));
              await user2.tally();
              await new Promise(resolve => setTimeout(resolve, DELAY));
              await user3.tally();
              await new Promise(resolve => setTimeout(resolve, DELAY));
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
              await new Promise(resolve => setTimeout(resolve, DELAY));
              await user2.getResult();
              await new Promise(resolve => setTimeout(resolve, DELAY));
              await user3.getResult();
              await new Promise(resolve => setTimeout(resolve, DELAY));
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
  
        await new Promise(resolve => setTimeout(resolve, DELAY));
      } catch (error) {
        console.error('Error caught in runDebug, exiting loop:', error);
        break; // エラーが発生したらwhileループを抜ける
      }
    }
    console.log('Debug finished.');
  }
  
  onMounted(() => {
    // 必要ならonMountedでrunDebugを呼ぶとか
  });
  
  onBeforeUnmount(() => {
  })
  </script>