<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useIsSlideActive, useNav } from '@slidev/client'

/**
 * One source file, one mapping file, through SPARQL Anything: the pairs appear one after another,
 * and each mapping file is a bar showing how many of its lines also appear in other mapping files.
 * Measured on the 71 mapping files of dim-etl-kg-generation (PREFIX lines and bare keywords left out).
 */
type Seg = Partial<Record<Block, number>>
type Block = 'validity' | 'designator' | 'labels' | 'level' | 'geometry' | 'location' | 'state' | 'other'
const items: { src: string; map: string; lines: number; seg: Seg }[] = [
  { src: 'balises.csv', map: 'balises.rq', lines: 108, seg: { validity: 16, designator: 12, labels: 6, level: 1, geometry: 27, location: 4, state: 3, other: 22 } },
  { src: 'hot_box_detectors.csv', map: 'hot-box-detectors.rq', lines: 91, seg: { validity: 12, designator: 10, labels: 4, level: 1, geometry: 25, location: 4, state: 3, other: 21 } },
  { src: 'akselteller.csv', map: 'axle-counter.rq', lines: 46, seg: { validity: 13, designator: 13, labels: 6, level: 1, other: 3 } },
  { src: 'rail_joints.csv', map: 'insulated-joints.rq', lines: 92, seg: { validity: 16, designator: 10, labels: 2, level: 1, geometry: 27, location: 4, state: 3, other: 14 } },
  { src: 'sporbutt.csv', map: 'bufferstop.rq', lines: 45, seg: { validity: 13, designator: 6, labels: 6, level: 1, other: 6 } },
  { src: 'operational_points_….csv', map: 'operational-points-borderpoints.rq', lines: 108, seg: { validity: 16, designator: 26, labels: 3, level: 1, geometry: 26, location: 4, state: 2, other: 24 } },
  { src: 'sporsperre.csv', map: 'derailer.rq', lines: 36, seg: { validity: 13, designator: 6, labels: 6, level: 1, other: 2 } },
  { src: 'contact_wires.csv', map: 'electrificationSection.rq', lines: 125, seg: { validity: 14, designator: 13, labels: 6, level: 1, geometry: 46, location: 6, state: 3, other: 28 } },
  { src: 'samlelas.csv', map: 'keyLock.rq', lines: 44, seg: { validity: 13, designator: 10, labels: 6, level: 1, other: 6 } },
  { src: 'bru.csv', map: 'undercrossing.rq', lines: 57, seg: { validity: 13, designator: 11, labels: 6, level: 1, other: 19 } },
  { src: 'plattformkant.csv', map: 'platformEdge.rq', lines: 69, seg: { validity: 13, designator: 5, labels: 8, level: 2, other: 16 } },
  { src: 'kjedebrudd.csv', map: 'mileage-change.rq', lines: 40, seg: { validity: 13, designator: 5, labels: 6, level: 1, other: 2 } },
]
const blocks: { key: Block; label: string; files: number | null }[] = [
  { key: 'validity', label: 'validity (time instants)', files: 45 },
  { key: 'designator', label: 'designators', files: 44 },
  { key: 'labels', label: 'labels @nb', files: 37 },
  { key: 'level', label: 'network level', files: 49 },
  { key: 'geometry', label: 'geometry · positioning', files: 31 },
  { key: 'location', label: 'net element · location', files: 27 },
  { key: 'state', label: 'element state', files: 13 },
  { key: 'other', label: 'other repeated lines', files: null },
]
const maxLines = Math.max(...items.map(i => i.lines))
const repeated = (i: (typeof items)[number]) => Object.values(i.seg).reduce((a, b) => a + (b ?? 0), 0)

const { isPrintMode } = useNav()
const isActive = useIsSlideActive()
const shown = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
function stop() { if (timer) clearInterval(timer); timer = undefined }
watch(isActive, (active) => {
  stop()
  shown.value = 0
  if (!active) return
  timer = setInterval(() => {
    shown.value++
    if (shown.value > items.length) stop()
  }, 550)
}, { immediate: true })
onUnmounted(stop)
const visible = computed(() => (isPrintMode.value ? items.length + 1 : shown.value))
</script>

<template>
  <div class="cp">
    <div class="grid">
      <div class="hub" :style="{ gridRow: `1 / span ${items.length}` }">
        <span>SPARQL<br>Anything</span>
      </div>
      <template v-for="(it, k) in items" :key="it.map">
        <div class="src" :class="{ on: k < visible }" :style="{ gridRow: k + 1 }">{{ it.src }}</div>
        <div class="arr" :class="{ on: k < visible }" :style="{ gridRow: k + 1, gridColumn: 2 }" />
        <div class="arr" :class="{ on: k < visible }" :style="{ gridRow: k + 1, gridColumn: 4 }" />
        <div class="map" :class="{ on: k < visible }" :style="{ gridRow: k + 1 }">
          <span class="name">{{ it.map }}</span>
          <span class="bar" :style="{ width: `${(it.lines / maxLines) * 100}%` }">
            <span v-for="b in blocks" :key="b.key" v-show="it.seg[b.key]" :class="['seg', b.key]"
              :style="{ flexGrow: it.seg[b.key] ?? 0 }" />
            <span class="seg own" :style="{ flexGrow: it.lines - repeated(it) }" />
          </span>
          <span class="pct">{{ Math.round((repeated(it) / it.lines) * 100) }}%</span>
        </div>
      </template>
    </div>

    <div class="sum" :class="{ on: visible > items.length }">
      <div class="big"><b>71</b> mapping files · <b>63%</b> of their lines also appear in another mapping file</div>
      <div class="legend">
        <span v-for="b in blocks" :key="b.key"><i :class="['seg', b.key]" />{{ b.label }}<em v-if="b.files">{{ b.files }} files</em></span>
        <span><i class="seg own" />specific to this file</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cp { font-size: 11px; }
.grid { display: grid; grid-template-columns: 190px 34px 96px 34px 1fr; grid-auto-rows: 21px; row-gap: 3px; align-items: center; }
.src, .map, .arr { opacity: 0; transform: scale(.6); transition: opacity .25s, transform .3s cubic-bezier(.3, 1.6, .5, 1); }
.on { opacity: 1 !important; transform: none !important; }
.src { grid-column: 1; justify-self: end; font-family: ui-monospace, monospace; font-size: 10px; background: var(--c-surface);
  border: 1px solid var(--c-stroke); border-radius: 5px; padding: 1px 6px; white-space: nowrap; }
.arr { height: 2px; background: var(--c-ink-subtle); position: relative; }
.arr::after { content: ''; position: absolute; right: -1px; top: -3px; border: 4px solid transparent; border-left: 6px solid var(--c-ink-subtle); }
.hub { grid-column: 3; align-self: stretch; display: flex; align-items: center; justify-content: center; text-align: center;
  background: var(--c-navy); color: #fff; border-radius: 14px; font-weight: 700; font-size: 13px; line-height: 1.2;
  border: 3px solid var(--c-sky); }
.map { grid-column: 5; display: flex; align-items: center; gap: 6px; min-width: 0; }
.name { width: 200px; flex: none; font-family: ui-monospace, monospace; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar { display: flex; height: 13px; border-radius: 3px; overflow: hidden; border: 1px solid var(--c-stroke); }
.pct { font-weight: 700; color: var(--c-orange); }
.seg { display: inline-block; height: 100%; }
i.seg { width: 11px; height: 11px; border-radius: 2px; vertical-align: -1px; margin-right: 4px; }
.validity { background: #2f6fd6; }
.designator { background: #7b3fc4; }
.labels { background: #00838f; }
.level { background: #5b6b8c; }
.geometry { background: #c99200; }
.location { background: #d9620b; }
.state { background: #c2185b; }
.other { background: #9aa3b5; }
.own { background: var(--c-bg); }
i.own { border: 1px solid var(--c-ink-subtle); }
.sum { margin-top: 10px; opacity: 0; transition: opacity .5s; }
.sum.on { opacity: 1; }
.big { font-size: 15px; color: var(--c-heading); }
.big b { color: var(--c-orange); }
.legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 5px; color: var(--c-ink-mod); }
.legend em { margin-left: 4px; font-style: normal; color: var(--c-ink); font-weight: 600; }
</style>
