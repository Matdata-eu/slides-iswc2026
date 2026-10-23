<script setup lang="ts">
// A looping screen recording. The poster is what the PDF export shows.
defineProps<{ src: string, poster?: string, caption?: string }>()
</script>

<template>
  <figure class="clip">
    <video :src="src" :poster="poster" autoplay loop muted playsinline />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.clip { margin: 0; }
.clip video {
  width: 100%;
  max-height: 22rem;
  object-fit: contain;
  border-radius: .5rem;
  border: 1px solid rgba(128, 128, 128, .3);
  background: #fff;
}
.clip figcaption { font-size: .75rem; opacity: .65; margin-top: .3rem; }
</style>
