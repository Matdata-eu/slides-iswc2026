<script setup lang="ts">
import { computed } from 'vue'

/**
 * A minute of topology, in RailTopoModel terms, built up per click:
 * 0 net elements and net relations · 1 an operational point as an area location
 * 2 a signal as a spot location (intrinsic coordinate) · 3 the RDF path between them and the inferred shortcut.
 */
const props = withDefaults(defineProps<{ step?: number }>(), { step: 0 })
const s = computed(() => Math.max(0, Math.min(3, props.step)))

const captions = [
  ['Topology', 'Net elements (track pieces, directed 0 → 1) connected by net relations that say where a train can go.'],
  ['Operational point', 'An area location: it lists the net elements it covers (e2 and e3).'],
  ['Signal', 'A spot location: one net element plus an intrinsic coordinate (e2 at 0.8).'],
  ['"In which station is this signal?"', 'Five hops through the topology. A SHACL rule computes it once and adds a one-hop shortcut.'],
]

// geometry of the toy station (svg units)
const Y = 190
const sw1 = 300, sw2 = 700
const e2At = (i: number) => sw1 + (sw2 - sw1) * i
const signalX = e2At(0.8)
</script>

<template>
  <div class="ts">
    <div class="cap"><b>{{ captions[s][0] }}</b> <span class="sub">{{ captions[s][1] }}</span></div>

    <svg viewBox="0 62 1000 192" class="cv">
      <defs>
        <marker id="ts-ah" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" class="ah" />
        </marker>
      </defs>

      <!-- operational point area -->
      <g v-if="s >= 1" class="fade">
        <rect x="285" y="88" width="430" height="135" rx="18" class="op" />
        <text x="500" y="80" text-anchor="middle" class="oplabel">Operational point · rtm:hasAreaLocation → e2, e3</text>
      </g>

      <!-- net elements -->
      <path :d="`M 40 ${Y} L ${sw1} ${Y}`" class="ne" marker-end="url(#ts-ah)" />
      <path :d="`M ${sw1} ${Y} L ${sw2} ${Y}`" class="ne" :class="{ hl: s >= 3 }" marker-end="url(#ts-ah)" />
      <path :d="`M ${sw1} ${Y} C 340 ${Y} 340 120 400 120 L 600 120 C 660 120 660 ${Y} ${sw2} ${Y}`" class="ne" marker-end="url(#ts-ah)" />
      <path :d="`M ${sw2} ${Y} L 960 ${Y}`" class="ne" marker-end="url(#ts-ah)" />

      <text x="170" :y="Y - 12" text-anchor="middle" class="nel">e1</text>
      <text x="460" :y="Y + 24" text-anchor="middle" class="nel">e2</text>
      <text x="500" y="110" text-anchor="middle" class="nel">e3</text>
      <text x="830" :y="Y - 12" text-anchor="middle" class="nel">e4</text>

      <!-- intrinsic coordinates on e2 -->
      <g v-if="s >= 2" class="fade">
        <text :x="sw1 + 14" :y="Y + 24" class="ic">0</text>
        <text :x="sw2 - 22" :y="Y + 24" class="ic">1</text>
      </g>

      <!-- net relations at the switches -->
      <circle :cx="sw1" :cy="Y" r="7" class="nr" />
      <circle :cx="sw2" :cy="Y" r="7" class="nr" />
      <text :x="sw1 - 10" :y="Y + 52" text-anchor="end" class="nrl">net relations e1→e2, e1→e3</text>
      <text :x="sw2 + 10" :y="Y + 52" class="nrl">e2→e4, e3→e4</text>

      <!-- signal -->
      <g v-if="s >= 2" class="fade">
        <line :x1="signalX" :y1="Y" :x2="signalX" :y2="Y - 28" class="mast" />
        <circle :cx="signalX" :cy="Y - 34" r="7" class="sig" />
        <text :x="signalX - 12" :y="Y - 30" text-anchor="end" class="sigl">Signal · e2 @ 0.8</text>
      </g>
    </svg>

    <!-- the RDF path and the shortcut -->
    <div v-if="s >= 3" class="path fade">
      <span class="node sig">signal</span>
      <span class="edge">hasSpotLocation</span><span class="node">spot</span>
      <span class="edge">onNetElement</span><span class="node ne2">e2</span>
      <span class="edge back">onNetElement</span><span class="node">assoc.</span>
      <span class="edge back">hasAssociatedNetElement</span><span class="node">area</span>
      <span class="edge back">hasAreaLocation</span><span class="node opn">OP</span>
    </div>
    <div v-if="s >= 3" class="short fade">
      <span class="node sig">signal</span>
      <span class="edge inf">bno:inOperationalPoint</span>
      <span class="node opn">OP</span>
      <span class="badge">inferred, 1 hop</span>
    </div>
  </div>
</template>

<style scoped>
.ts { font-size: 13px; }
.cap { min-height: 2.6em; line-height: 1.35; }
.cap b { color: var(--c-heading); margin-right: .4em; }
.cap .sub { color: var(--c-ink-mod); }
.cv { width: 100%; height: 230px; display: block; }
.ne { fill: none; stroke: var(--c-ink); stroke-width: 5; stroke-linecap: round; opacity: .8; }
.ne.hl { stroke: var(--c-orange); opacity: 1; }
.ah { fill: var(--c-ink); }
.nel { font-size: 15px; font-weight: 700; fill: var(--c-ink); }
.ic { font-size: 12px; fill: var(--c-ink-mod); }
.nr { fill: var(--c-bg); stroke: var(--c-blue); stroke-width: 3; }
.nrl { font-size: 11px; fill: var(--c-blue); }
.op { fill: var(--c-blue-bg); stroke: var(--c-blue); stroke-width: 2; stroke-dasharray: 6 4; opacity: .9; }
.oplabel { font-size: 12px; fill: var(--c-blue); font-weight: 600; }
.mast { stroke: var(--c-ink); stroke-width: 2; }
circle.sig { fill: var(--c-red); stroke: var(--c-ink); stroke-width: 1.5; }
.sigl { font-size: 12px; font-weight: 600; fill: var(--c-red); }
.path, .short { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 4px; font-size: 10.5px; }
.short { margin-top: 8px; }
.node { padding: 1px 6px; border-radius: 6px; background: var(--c-surface); border: 1px solid var(--c-stroke); font-family: ui-monospace, monospace; }
.node.sig { border-color: var(--c-red); color: var(--c-red); }
.node.opn { border-color: var(--c-blue); color: var(--c-blue); }
.node.ne2 { border-color: var(--c-orange); color: var(--c-orange); }
.edge { color: var(--c-ink-mod); font-family: ui-monospace, monospace; }
.edge::after { content: ' →'; }
.edge.back::before { content: '← '; }
.edge.back::after { content: ''; }
.edge.inf { color: var(--c-purple); font-weight: 700; border-bottom: 2px dashed var(--c-purple); }
.badge { margin-left: 8px; padding: 1px 8px; border-radius: 10px; background: var(--c-purple); color: #fff; font-size: 11px; }
.fade { animation: ts-fade .35s ease both; }
@keyframes ts-fade { from { opacity: 0 } to { opacity: 1 } }
</style>
