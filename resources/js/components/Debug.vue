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
  let keys = ref<any>(null);
  
  class User {
    name: string;
    score: number;
    pk: openpgp.PublicKey;

    constructor(name: string , score: number) {
        this.name = name;
        this.score = score;
    }

    async accessPage(){
        try {
            const pk = await genKeys();
            this.pk = await openpgp.readKey({ armoredKey: pk.publicKey });
            console.log("pk", this.pk);
            console.log("pk type", typeof this.pk);
            const accessData = {
                pk : keys.value.publicKey
            };
            await axios.post('/api/vote/access', accessData)
                .then(response => console.log("vote access ",response.data))
                .catch(error => console.error(error));
            console.log(this.name,' accessPage success');
        } catch (error) {
            console.error(this.name,' accessPage fail ', error);
        }
    }

    async getPkList(): Promise<openpgp.PublicKey[]> {
        try {
            const response = await axios.get('/api/vote/getPkList');
            const pkList = response.data.pkList;
            console.log(this.name, 'successfully got pkList', pkList);
            return pkList;
        } catch (error) {
            console.error(this.name, 'getPkList error:', error);
            return [];
        }
    }

    async sendScore(){
        const pkList = await this.getPkList();
        const shares:point[] = getShares(this.score, pkList.length, PRIME);
        let sharesList: { pk: openpgp.PublicKey; share: { x: string; y: string } }[] = [];
        for (let i = 0; i < pkList.length; i++) {
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
        await axios.post('/api/vote/postShare', sharesList)
            .then(response => console.log(this.name, 'successfully sent shares'))
            .catch(error => console.error(this.name, 'sendScore error:', error));
        console.log(this.name, 'sendScore success');
        try{}catch (error) {
            console.error(this.name, 'sendScore error:', error);
        }
    }

    async tally(){
        let shares:{share: {x: string, y: string}}[] = [];
        await axios.post('/api/vote/tally', {pk : keys.value.publicKey})
            .then(response => {
                shares = response.data.shares;
                console.log(this.name, 'successfully got shares');
            })
            .catch(error => console.error(this.name, 'getShares error:', error));
        return shares;
    }

    async getResultShare(){
        let resultShare = {
            x:0,
            y:0
        } ;
        const shares = await this.tally();
        if (shares.length > 0) {
            for (let i=0 ; i < shares.length; i++) {
                resultShare.x += await decryptedMessage(shares[i].share.x, keys.value.privateKey);
                resultShare.y += await decryptedMessage(shares[i].share.y, keys.value.privateKey);
            }
        }
        return resultShare;
    }
    
  }

  class Host {
    constructor() {
    }

    async start() {
        try{
            await axios.post('/api/manage/start')
                .then(response => {
                    console.log('Vote started:', response.data);
                })
                .catch(error => {
                    console.error('Error starting vote:', error);
                });
        }catch (error) {
            console.error('Host start error:', error);
        }
    }

    async tally() {
        try{
            await axios.post('/api/manage/tally')
                .then(response => {
                    console.log('Tally started:', response.data);
                })
                .catch(error => {
                    console.error('Error starting tally:', error);
                });
        }catch (error) {
            console.error('Host tally error:', error);
        }
        
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
  
  onMounted(async () => {
        const host = new Host();
        const user1 = new User("1",10);
        const user2 = new User("2",20);
        const user3 = new User("3",30);
  });
  
  onBeforeUnmount(() => {
  })
  </script>