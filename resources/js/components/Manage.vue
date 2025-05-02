<template>
    <div>
        <h1>Managing page</h1>
        <p>progress : {{ state }}</p>
        <p>number of voter : {{ voterNum }}</p>
        <p>number of ballot: {{ ballotNum }}</p>
        <buttongroup>
            <button @click="startVote"> Start</button>
            <button @click="tally"> Tally</button>
            <button @click="reset"> Reset</button>
        </buttongroup>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { Host } from './models/Host';

const host = new Host();

const voterNum = ref(0);
const ballotNum = ref(0);
const state = ref('waiting'); // 初期状態を設定

let intervalVoter: number;
let intervalBallot: number;

async function fetchVoterNum() {
    await axios.get('/api/vote/getCount')
        .then(response => {
            console.log('Voter number fetched:', response.data.count);
            voterNum.value = response.data.count;
        })
        .catch(error => {
            console.error('Error fetching voter number:', error);
        });
}

async function fetchBallotNum() {
    await axios.get('/api/manage/getTallyReady')
        .then(response => {
            ballotNum.value = response.data.tallyReady;
        })
        .catch(error => {
            console.error('Error fetching ballot number:', error);
        });
}

let intervalState: number;
async function fetchState() {
    await axios.get('/api/vote/getState')
        .then(response => {
            console.log('Current state:', response.data.state);
            state.value = response.data.state;
        })
        .catch(error => {
            console.error('Error fetching state:', error);
        });
}

async function startVote() {
    await host.start()
        .then(() => {
            console.log('Vote started');
        })
        .catch(error => {
            console.error('Error starting vote:', error);
        });
}

async function tally() {
    await host.tally()
        .then(() => {
            console.log('Tally completed');
        })
        .catch(error => {
            console.error('Error during tally:', error);
        });
}

async function reset() {
    await axios.get('/api/manage/leave')
        .then(response => {
        console.log('Redis value reset:', response.status);
        })
        .catch(error => {
        console.error('Error resetting Redis value:', error);
        });
}

onMounted(() => {
    fetchVoterNum();
    intervalState = window.setInterval(fetchState, 1000);
    intervalVoter = window.setInterval(fetchVoterNum, 500);
    intervalBallot = window.setInterval(fetchBallotNum, 500);
});

onUnmounted(() => {
    clearInterval(intervalState);
    clearInterval(intervalVoter);
    clearInterval(intervalBallot);
    axios.get('/api/manage/leave')
        .then(response => {
            console.log('Left manage page:', response.data);
        })
        .catch(error => {
            console.error('Error leaving manage page:', error);
        });
});
</script>