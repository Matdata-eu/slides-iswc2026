<script setup lang="ts">
// A looping screen recording that starts from the beginning whenever its slide is shown.
// Exports (PDF/PNG) show the poster instead of the video.
import { ref, watch } from 'vue'
import { useIsSlideActive, useNav } from '@slidev/client'
defineProps<{ src: string, poster?: string, caption?: string, full?: boolean }>()
const { isPrintMode } = useNav()
const isActive = useIsSlideActive()
const video = ref<HTMLVideoElement>()

watch([isActive, video], ([active, el]) => {
  if (!el) return
  if (active) {
    el.currentTime = 0
    void el.play().catch(() => {})
  } else {
    el.pause()
  }
}, { immediate: true })
</script>

<template>
  <figure class="clip" :class="{ full }">
    <img v-if="isPrintMode && poster" :src="poster" alt="" />
    <video v-else ref="video" :src="src" :poster="poster" loop muted playsinline preload="auto" />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.clip { margin: 0; }
.clip video, .clip img {
  width: 100%;
  max-height: 22rem;
  object-fit: contain;
  border-radius: .5rem;
  border: 1px solid rgba(128, 128, 128, .3);
  background: #fff;
}
.clip figcaption { font-size: .75rem; opacity: .65; margin-top: .3rem; }

/* full: the recording fills the slide, the caption floats on top */
.clip.full { position: absolute; inset: 0; background: #fff; }
.clip.full video, .clip.full img { width: 100%; height: 100%; max-height: none; border: 0; border-radius: 0; }
.clip.full figcaption { position: absolute; left: 16px; bottom: 14px; margin: 0; opacity: 1; font-size: 13px;
  background: rgba(30, 40, 105, .92); color: #fff; padding: 6px 12px; border-radius: 6px;
  border-left: 4px solid var(--c-sky); max-width: 70%; }
</style>
