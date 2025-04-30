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
  
  const PRIME = 10007;
  
  // 鍵生成のオプションを定義
  const keyOptions = {
    type: 'rsa',               // 鍵の種類（'rsa' や 'ecc'）
    rsaBits: 2048,             // RSA鍵の場合のビット長
    userIDs: [{ name: 'anon', email: 'anon@anon.com' }]
  }
  
  let keys = ref(null)
  
  class point {
      constructor(x, y) {
          this.x = x
          this.y = y
      }
  }
  
  function calcPolyValue(x: number, coefficients: number[], prime: number) : number {
      let res = 0
      let base = 1;
      for (let i = 0; i < coefficients.length; i++) {
          res += coefficients[i] * base;
          base *= x;
          base = base % prime;
          res = res % prime;
      }
      return res % prime
  }
  
  function getShares(myScore: number, numOfuser: number, prime: number) : point[] {
      let coefficients = [myScore];
      for (let i = 1; i < numOfuser; i++) {
        coefficients.push(Math.floor(Math.random() * prime));
      }
      let points = [new point(0, myScore)];
      for (let i = 1; i < numOfuser; i++) {
        points.push(new point(i, calcPolyValue(i, coefficients,prime)));
      }
      return points;
  }
  
  function getSecret(points: point[], prime: number) : number {
      let secret = 0;
      for (let i = 0; i < points.length; i++) {
          const x_i = points[i].x;
          const y_i = points[i].y;
          let base = 1;
          for (let ii = 0; ii < points.length; ii++) {
              if (i !== ii) {
                  // 常に正の剰余にするため、mod() を使う
                  base *= (prime-points[ii].x) * modInverse(x_i - points[ii].x, prime);
                  base %= prime;
              }
          }
          secret += y_i * base;
          secret %= prime ;
      }
      return secret % prime;
  }
  
  function modInverse(a: number, p: number) : number {
      if (a < 0) a += p;
      let m0 = p, t, q;
      let x0 = 0, x1 = 1;
      if (p == 1) return 0;
      while (a > 1) {
          q = Math.floor(a / p);
          t = p;
          p = a % p, a = t;
          t = x0;
          x0 = x1 - q * x0;
          x1 = t;
      }
      if (x1 < 0) x1 += m0;
      return x1;
  }
  
  async function genKeys() {
      const generatedKeys = await openpgp.generateKey(keyOptions);
      keys.value = generatedKeys;
      // console.log("Generated keys:", typeof keys.value);
      return keys.value;
  }
  
  async function encryptedMessage(message: string, publicKey: openpgp.PublicKey) {
      const options = {
          message: await openpgp.createMessage({ text: message }), // plaintext as Message object
          encryptionKeys: await openpgp.readKey({ armoredKey: publicKey }) // for encryption
      }
      const cipher = await openpgp.encrypt(options);
      // console.log("Encrypted message:", cipher);
      return cipher
  }
  
  async function decryptedMessage(cipher: string, privateKey: openpgp.PrivateKey) {
      const options = {
          message: await openpgp.readMessage({ armoredMessage: cipher }), // parse encrypted message
          decryptionKeys: await openpgp.readKey({ armoredKey: privateKey }) // for decryption
      }
      const plain = await openpgp.decrypt(options);
      // console.log("Decrypted message:", plain);
      return plain;
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
  
  onMounted(async () => {
    try {
  
      // key gen, enc, dec
      // const message = String(myScore);
      keys = await genKeys();
      console.log("type of pk", typeof keys.publicKey);
      const accessData = {
        pk : keys.publicKey
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