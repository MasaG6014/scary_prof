  import * as openpgp from 'openpgp';
  const PRIME = 10007;
  const keyOptions: openpgp.GenerateKeyOptions & { format: "armored" } = {
    type: 'rsa',               // 鍵の種類（'rsa' や 'ecc'）
    rsaBits: 2048,             // RSA鍵の場合のビット長
    userIDs: [{ name: 'anon', email: 'anon@anon.com' }],
    format: "armored"          // 指定されたフォーマット
  }
  export class point {
    x: number;
    y: number;
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

export  function calcPolyValue(x: number, coefficients: number[], prime: number) : number {
    let res = 0
    let base = 1;
    for (let i = 0; i < coefficients.length; i++) {
        res += coefficients[i] * base;
        base *= x;
        base = base % prime;
        res = res % prime;
    }
    return res % prime
}export

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
}export

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
}export

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

export async function genKeys() {
    const generatedKeys = await openpgp.generateKey(keyOptions);
    // console.log("Generated keys:", typeof keys.value);
    return generatedKeys;
}

export async function encryptedMessage(message: string, publicKey: openpgp.PublicKey) {
    const options = {
        message: await openpgp.createMessage({ text: message }), // plaintext as Message object
        encryptionKeys: await openpgp.readKey({ armoredKey: publicKey.armor() }) // for encryption
    }
    const cipher = await openpgp.encrypt(options);
    // console.log("Encrypted message:", cipher);
    return cipher
}

export async function decryptedMessage(cipher: string, privateKey: openpgp.PrivateKey) {
    const options: openpgp.DecryptOptions = {
        message: await openpgp.readMessage({ armoredMessage: cipher }), // parse encrypted message
        decryptionKeys: await openpgp.readPrivateKey({ armoredKey: privateKey.armor() }) // for decryption
    }
    const plain = await openpgp.decrypt(options);
    // console.log("Decrypted message:", plain);
    return plain;
}