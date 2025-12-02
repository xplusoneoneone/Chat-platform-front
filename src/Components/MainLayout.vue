<template>
  <div class="main-layout">
    <router-view />
    <Tabber />
  </div>
</template>

<script setup lang="ts">
import Tabber from './Tabber.vue'
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
}
</style>

