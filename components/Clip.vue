<script setup lang="ts">
// A looping screen recording that starts from the beginning whenever its slide is shown.
// Videos are paused off-slide; GIFs are restarted by giving the <img> a fresh blob URL.
// Exports (PDF/PNG) show the poster instead of the video.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useIsSlideActive, useNav } from '@slidev/client'
const props = defineProps<{ src: string, poster?: string, caption?: string, full?: boolean }>()
const { isPrintMode } = useNav()
const isActive = useIsSlideActive()
const video = ref<HTMLVideoElement>()
const isGif = computed(() => props.src.toLowerCase().endsWith('.gif'))

let blob: Promise<Blob> | undefined
const gifUrl = ref<string>()
async function restartGif() {
  blob ??= fetch(props.src).then(r => r.blob())
  const url = URL.createObjectURL(await blob)
  if (gifUrl.value) URL.revokeObjectURL(gifUrl.value)
  gifUrl.value = url
}
onBeforeUnmount(() => { if (gifUrl.value) URL.revokeObjectURL(gifUrl.value) })

watch([isActive, video], ([active, el]) => {
  if (isGif.value) {
    if (active && !isPrintMode.value) void restartGif().catch(() => {})
    return
  }
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
    <img v-else-if="isGif" :src="gifUrl ?? src" alt="" />
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
