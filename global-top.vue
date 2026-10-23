<script setup lang="ts">
import { useNav } from '@slidev/client'
const { currentLayout, currentPage, total } = useNav()
</script>

<template>
  <div v-if="currentLayout !== 'cover' && currentLayout !== 'end'" class="abs-tr mt-4 mr-6 md-logo">
    <img src="/assets/matdata.png" class="h-7" alt="Matdata" />
  </div>
  <div v-if="currentLayout !== 'cover'" class="abs-br mb-3 mr-6 md-page">
    {{ currentPage }} / {{ total }}
  </div>
</template>

<style>
.md-page { font-size: 11px; letter-spacing: .04em; opacity: .55; }
.md-logo { opacity: .9; }
</style>
