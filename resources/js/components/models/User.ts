
import * as openpgp from 'openpgp';
import axios from 'axios';
import {calcPolyValue, genKeys, encryptedMessage, decryptedMessage, getSecret, getShares, point} from '../utils/cryptoUtils';
const PRIME = 10007;
  
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
                .then(response => console.log("vote access ",response.data))
                .catch(error => console.error(error));


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
        try {
            let shares:{x: string, y: string}[] = [];
            await axios.post('/api/vote/tally', {pk : this.keys.publicKey})
                .then(response => {
                    shares = response.data.shares;
                    console.log(this.name, 'successfully got shares');
                })
                .catch(error => console.error(this.name, 'getShares error:', error));
            return shares;
        } catch (error) {
            console.error(this.name, 'tally error:', error);
            return [];
        }
    }

    async getResult(){
        let resultShares:{x:number, y:number}[] = [];
        const shares = await this.tally();
        if (shares.length > 0) {
            for (let i=0 ; i < shares.length; i++) {
                const x = await decryptedMessage(shares[i].x, this.sk);
                const y = await decryptedMessage(shares[i].y, this.sk);
                resultShares.push({x: parseInt(x), y: parseInt(y)});
            }
        }
        const result = getSecret(resultShares, PRIME);
        console.log(this.name, 'getResult success', result);
        return result;
    }
    
  }