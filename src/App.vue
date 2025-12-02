<script setup lang="ts"></script>

<template>
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
}

input, button, textarea {
  font-family: inherit;
  -webkit-appearance: none;
  appearance: none;
}

button {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
</style>
