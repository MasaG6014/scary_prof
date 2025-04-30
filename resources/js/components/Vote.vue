<template>
  <div>
    <h1>Voting Page</h1>
    <p>Generated Keys:</p>
    <pre>{{ keys }}</pre>
    <h1>{{ state }}</h1>
    <div v-if="isStarted == 1">
      <label for="myInput">怖さ度を入力</label>
      <input id="myInput" type="text" v-model="userInput" placeholder="Input score..." />
      <button @click="handleSubmit">Submit</button>
    </div>
    <button v-if="isTallyReady == 1" @click="handleTally">Tally</button>
    <div v-if="isTallyOver == 1">
      <p>投票が終了しました</p>
      <p>result: {{ result }}</p>
    </div>
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

const userInput = ref('') // ユーザーの入力を格納する変数
let result = ref(0) // ユーザーのoutputを表示する変数
let state = ref('')
let isTallyReady = ref(0)
let isTallyOver = ref(0)

async function handleSubmit() {
  // ユーザーが入力した値を処理する関数
  try {
    let pkList = [];
    console.log("pkList", pkList);
    await axios.get('/api/vote/getPkList')
      .then(response => {pkList = response.data.pkList;console.log('successfully got pkList')})
      .catch(error => console.error(error));
    const myScore = Number(userInput.value);
    const numOfuser = pkList.length;
    const shares = getShares(myScore, numOfuser+1, PRIME);
    console.log("create shares", shares);
    let sharesList = [];
    console.log("typeof pkList[0]", typeof pkList[0]);
    console.log("pkList[0]", pkList[0]);
    for (let i = 0; i < numOfuser; i++) {
      pkList[i] = await openpgp.readKey({ armoredKey:pkList[i] });
    }
    for (let i = 0; i < numOfuser; i++) {
      const encryptedX = await encryptedMessage(shares[i+1].x.toString(), pkList[i]);
      const encryptedY = await encryptedMessage(shares[i+1].y.toString(), pkList[i]);
      const share = {
        pk: pkList[i],
        share: {
          x: encryptedX, 
          y: encryptedY
        }
      }
      sharesList.push(share);
    }
    axios.post('/api/vote/postShare', sharesList)
      .then(response => console.log('successfully sent shares'))
      .catch(error => console.error(error));

  }catch (error) {
    console.error('Error in handleSubmit:', error)
  }
}

async function handleTally() {
  let shares = [];
  await axios.post('/api/vote/getShares', {pk : keys.value.publicKey})
    .then(response => {
      shares = response.data.shares;
      console.log('successfully got shares');
    })
    .catch(error => console.error(error));
  let resultShare = {
    x:0,
    y:0
  } ;
  if (shares != []) {
    for (let i=0 ; i < shares.length; i++) {
        resultShare.x += await decryptedMessage(shares[i].share.x, keys.value.privateKey);
        resultShare.y += await decryptedMessage(shares[i].share.y, keys.value.privateKey);
    }
  }
  axios.post('/api/vote/postResultShare', {resultShare : resultShare})
    .then(response => console.log('successfully sent result share'))
    .catch(error => console.error(error));
}

let isStarted = ref(0);

async function fetchIsStarted() {
  await axios.get('/api/vote/isStarted')
    .then(response => {
        isStarted.value = response.data.isStarted;
        console.log('Vote status:', response.data);
    })
    .catch(error => {
      console.error('Error fetching vote status:', error);
    });

    if (isStarted.value == 1) {
        state.value = "投票中"
    } 
    if (isStarted.value == 0) {
        state.value = "投票準備中…"
    }
}

async function fetchIsTallyReady() {
  await axios.get('/api/vote/isTallyReady')
    .then(response => {
        isTallyReady.value = response.data.isTallyReady;
        console.log('Tally status:', response.data);
    })
    .catch(error => {
      console.error('Error fetching tally status:', error);
    });
}

async function fetchIsTallyOver() {
  await axios.get('/api/vote/isTallyOver')
    .then(response => {
        isTallyOver.value = response.data.isTallyOver;
        console.log('Tally status:', response.data);
    })
    .catch(error => {
      console.error('Error fetching tally status:', error);
    });
  if (isTallyOver.value == 1) {
    let resultShares = [];
    await axios.get('api/vote/getResultShares')
      .then(response => {
        resultShares = response.data.resultShares;
        console.log('Tally result:', response.data);
      })
      .catch(error => {
        console.error('Error fetching tally result:', error);
      });
    result.value = getSecret(resultShares, PRIME);
    console.log('Tally result:', result.value);
  }
}

let intervalIsStarted: number;
let intervalIsTallyReady: number;
let intervalIsTallyOver: number;

onMounted(async () => {
  try {

    // key gen, enc, dec
    // const message = String(myScore);
    keys = await genKeys();
    console.log("type of pk", typeof keys.publicKey);
    const accessData = {
      pk : keys.publicKey
    }
    await axios.post('/api/vote/access', accessData).then(response => console.log(response.data)).catch(error => console.error(error));
    intervalIsStarted = window.setInterval(fetchIsStarted, 1000);
    intervalIsTallyReady = window.setInterval(fetchIsTallyReady, 1000);
    intervalIsTallyOver = window.setInterval(fetchIsTallyOver, 1000);
    // // console.log("publicKey", keys.publicKey);
    // const encrypted = await encryptedMessage(message, keys.publicKey);
    // const decrypted = await decryptedMessage(encrypted, keys.privateKey);
  } catch (error) {
    console.error('vote error', error)
  }
})

onBeforeUnmount(() => {
  clearInterval(intervalIsStarted);
  clearInterval(intervalIsTallyReady);
  clearInterval(intervalIsTallyOver);
  axios.post('/api/vote/leave').then(response => console.log(response.data)).catch(error => console.error(error));
  // コンポーネントがアンマウントされる前に実行する処
  console.log('Component is about to be unmounted')
})
</script>