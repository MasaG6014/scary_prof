<script setup>
import axios from 'axios'

const fetchHello = async () => {
  const res = await axios.get('/api/hello')
  console.log(res.data.message)
}
</script>