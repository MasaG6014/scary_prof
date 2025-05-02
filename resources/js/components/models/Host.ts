import { ref, onMounted , onBeforeUnmount} from 'vue';
import * as openpgp from 'openpgp';
import axios from 'axios';
import {calcPolyValue, genKeys, encryptedMessage, decryptedMessage, getSecret, getShares, point} from '../utils/cryptoUtils';
import { PRIME } from '../utils/constants';

  export class Host {
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
