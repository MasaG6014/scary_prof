<template>
    <div>
        <h1>Managing page</h1>
        <p>manage your vote</p>
        <p>number of voter : {{ voterNum }}</p>
        <p>number of ballot: {{ ballotNum }} </p>
        <buttongroup>
            <button @click="startVote"> Start</button>
            <button @click="tally"> Tally</button>
            <button @click="resetNum"> Reset</button>
        </buttongroup>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
const voterNum = ref(0);
const ballotNum = ref(0);

function fetchVoterNum() {
    axios.get('/api/vote/count')
        .then(response => {
            voterNum.value = response.data.count;
        })
        .catch(error => {
            console.error('Error fetching voter number:', error);
        });
}

function fetchBallotNum() {
    axios.get('/api/manage/tallyReady')
        .then(response => {
            ballotNum.value = response.data.tallyReady;
        })
        .catch(error => {
            console.error('Error fetching ballot number:', error);
        });
}

function startVote() {
    axios.post('/api/manage/start')
        .then(response => {
            console.log('Vote started:', response.data);
            fetchVoterNum();
        })
        .catch(error => {
            console.error('Error starting vote:', error);
        }); 
}

function tally() {
    axios.post('/api/manage/tally')
        .then(response => {
            console.log('Tally started:', response.data);
            fetchVoterNum();
        })
        .catch(error => {
            console.error('Error starting tally:', error);
        });
}

function resetNum() {
    axios.post('/api/manage/reset')
        .then(response => {
            console.log('Voter number reset:', response.data);
            fetchVoterNum();
        })
        .catch(error => {
            console.error('Error resetting voter number:', error);
        });
}

onMounted(async() => {
    fetchVoterNum();
    setInterval(fetchVoterNum, 1000);
    setInterval(fetchBallotNum, 1000);
});
</script>