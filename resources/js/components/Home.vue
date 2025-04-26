<template>
  <div>
    <h1>Home</h1>
    <button @click="goVote">Go to Vote</button>
    <button @click="goManage">Go to Manage</button>
  </div>
</template>

<script>
export default {
  methods: {
      goVote() {
          this.$router.push('/vote');
      },
      goManage() {
          this.$router.push('/manage');
      }
  }
}
</script>