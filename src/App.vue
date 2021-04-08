<template>
  <div id="app">
    <FileManager />
  </div>
</template>

<script>
// import xterm from './components/xterm'
import FileManager from './components/FileManager'

export default {
  name: 'App',
  components: {
    FileManager
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
  display: block;
  height: 100%;
}
</style>
