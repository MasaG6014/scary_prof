<template>
  <div>
    <h1>Voting Page</h1>
    <p>Generated Keys:</p>
    <pre>{{ keys }}</pre>
    <p>scores</p>
    <h1>Text Field Example</h1>
    <label for="myInput">Your Input:</label>
    <input id="myInput" type="text" v-model="userInput" placeholder="Type something..." />
    <button @click="handleSubmit">Submit</button>
    <p>You entered: {{ userOutput }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted , onBeforeUnmount} from 'vue';
import * as openpgp from 'openpgp';
import axios from 'axios';

// 鍵生成のオプションを定義
const keyOptions = {
  type: 'rsa',               // 鍵の種類（'rsa' や 'ecc'）
  rsaBits: 2048,             // RSA鍵の場合のビット長
  userIDs: [{ name: 'anon', email: 'anon@anon.com' }]
}

const keys = ref(null)

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
const userOutput = ref('') // ユーザーのoutputを表示する変数

function handleSubmit() {
  // ユーザーが入力した値を処理する関数
  try {
    const myScore = Number(userInput.value);
    const numOfuser = 10;
    const prime = 10007;
    const shares = getShares(myScore, numOfuser, prime);
    console.log("shares", shares);
    const secret = getSecret(shares, prime);
    console.log("secret", secret);
    userOutput.value = [shares, secret] // 入力値をoutputに表示
    console.log('Submitted:', userOutput.value)
  }catch (error) {
    console.error('Error in handleSubmit:', error)
  }
}

onMounted(async () => {
  axios.post('/api/vote/access').then(response => console.log(response.data)).catch(error => console.error(error));
  try {
    userOutput.value = '0'

    // key gen, enc, dec
    // const message = String(myScore);
    const keys = await genKeys();
    // // console.log("publicKey", keys.publicKey);
    // const encrypted = await encryptedMessage(message, keys.publicKey);
    // const decrypted = await decryptedMessage(encrypted, keys.privateKey);
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