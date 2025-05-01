import * as openpgp from 'openpgp';
import axios from 'axios';
import {calcPolyValue,getCoefficients, genKeys, encryptedMessage, decryptedMessage, getSecret, getShares, point} from '../utils/cryptoUtils';
import { PRIME } from '../utils/constants';
  
export class User {
    name: string;
    score: number;
    keys: openpgp.SerializedKeyPair<string> & {
        revocationCertificate: string;
    };
    pk: openpgp.PublicKey;
    sk: openpgp.PrivateKey;

    constructor(name: string , score: number) {
        this.name = name;
        this.score = score;
    }

    async getPkInfo(){
        try {
            await axios.post('/api/vote/getPkInfo', {pk: this.pk.armor()})
            .then(response => console.log(this.name, 'pkInfo', response.data.info))
            .catch(error => console.error(this.name, 'getPkInfo error:', error));
            console.log(this.name, 'getPkInfo success');
        } catch (error) {
            console.error(this.name, 'getPkInfo error:', error);
        }
    }

    async accessPage(){
        try {
            // generate keys
            this.keys = await genKeys();
            this.pk = await openpgp.readKey({ armoredKey: this.keys.publicKey });
            this.sk = await openpgp.readPrivateKey({ armoredKey: this.keys.privateKey });
            console.log("pk", this.pk);
            console.log("pk type", typeof this.pk);

            // send pk to server
            const accessData = {
                pk : this.pk.armor(),
            };
            await axios.post('/api/vote/access', accessData)
                .then(response => console.log(this.name,"vote access ",response.data))
                .catch(error => console.error(error));


            // await this.getPkInfo();
            console.log(this.name,' accessPage success');
        
        } catch (error) {
            console.error(this.name,' accessPage fail ', error);
        }
    }

    setScore(score: number){
        this.score = score;
        console.log(this.name, 'setScore', this.score);
    };

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
        const pkListRaw = await this.getPkList();
        // pkListRawがstringなら、openpgp.PublicKeyに変換する
        console.log(this.name, 'sendScore pkListRaw', pkListRaw);
        const pkList: openpgp.PublicKey[] = await Promise.all(
          pkListRaw.map(async (item: any) => {
            if(typeof item === 'string'){
              return await openpgp.readKey({ armoredKey: item });
            }
            return item;
          })
        );
        // console.log(this.name, 'sendScore typeof pkList[0]', typeof pkList[0]);

        const coefficients: number[] = getCoefficients(this.score, pkList.length, PRIME);
        const shares: point[] = getShares(this.score, pkList.length,coefficients, PRIME);
        console.log(this.name, 'sendScore shares', shares);

        let sharesList: { pk: string; share: { x: string; y: string } }[] = [];
        for (let i = 0; i < pkList.length; i++) {
            const encryptedX = await encryptedMessage(shares[i].x.toString(), pkList[i]);
            const encryptedY = await encryptedMessage(shares[i].y.toString(), pkList[i]);
            const share = {
                pk: pkList[i].armor(),
                share: { x: encryptedX, y: encryptedY }
            }
            sharesList.push(share);
        }
        console.log(this.name, 'sendScore sharesList', sharesList);

        await axios.post('/api/vote/postShares', {shares:sharesList})
            .then(response => console.log(this.name, 'successfully sent shares'))
            .catch(error => console.error(this.name, 'sendScore error:', error));
        // await this.getPkInfo();

        console.log(this.name, 'sendScore success');
    }

    async tally(){
        try {
            // await this.getPkInfo();
            const response  = await axios.post('/api/vote/tally', {pk : this.pk.armor()})
            if (!response) {
                console.error(this.name, 'tally error: no response');
            }
            const shares = response.data.shares; 
            if (!shares) {
                console.error(this.name, 'tally error: no shares');
            }
            console.log(this.name, 'tally shares', shares);

            let resultShare: {x:number, y:number} = {x: 0, y: 0};
            resultShare.x = await decryptedMessage(shares[0].x, this.sk);
            if (shares.length > 0) {
                for (let i=0 ; i < shares.length; i++) {
                    resultShare.y += await decryptedMessage(shares[i].y, this.sk);
                    resultShare.y %= PRIME;
                    console.log(this.name, 'tally decrypted y', resultShare.y);
                }
            }

            console.log(this.name, 'tally resultShares', resultShare);
            await axios.post('/api/vote/postResultShares', {resultShares:resultShare})
                .then(response => console.log(this.name, 'successfully sent resultShare'))
                .catch(error => console.error(this.name, 'tally error:', error));
            console.log(this.name, 'tally success');
        } catch (error) {
            console.error(this.name, 'tally error:', error);
            return [];
        }
    }

    async getResult(){
        const response = await axios.get('/api/vote/getResultShares');
        if (!response) {
            console.error(this.name, 'getResult error: no response');
            return [];
        }
        const resultShares = response.data.resultShares;
        console.log(this.name, 'getResult resultShares', resultShares);
        const result = getSecret(resultShares, PRIME);
        console.log(this.name, 'getResult success', result);
        return result;
    }
    
  }