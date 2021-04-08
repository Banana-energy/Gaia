<template>
  <div>
    <connect :list-active="true" />
  </div>
</template>

<script>
import connect from '@/components/connect'

export default {
  name: 'Index',
  components: {
    connect
  }
}
</script>

<style scoped>

</style>
