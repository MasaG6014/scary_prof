<template>
    <div>
        <h1>Managing page</h1>
        <p>manage your vote</p>
        <p>number of voter : {{ voterNum }}</p>
        <button @click="resetNum">Reset</button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
const voterNum = ref(0);

function fetchVoterNum() {
    axios.get('/api/vote/count')
        .then(response => {
            voterNum.value = response.data.count;
        })
        .catch(error => {
            console.error('Error fetching voter number:', error);
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
});
</script>