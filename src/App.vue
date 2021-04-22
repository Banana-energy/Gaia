<template>
  <div id="app">
    <xterm />
  </div>
</template>

<script>
import xterm from './components/xterm'
// import FileManager from './components/FileManager'

export default {
  name: 'App',
  components: {
    xterm
  }
}
</script>

<style>
html, body {
  background-color: #000;
  height: 100%;
  margin: 0;
}

#app {
  height: 100%;
}
</style>
