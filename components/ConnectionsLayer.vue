<template>
  <svg class="absolute inset-0 pointer-events-none" style="z-index: 500; overflow: visible;" :width="10000" :height="10000">
    <!-- Draw connections. Cross-links (graph links between mind-map nodes that
         aren't parent/child) render dashed, muted and without an arrowhead. -->
    <g
      v-for="connection in connections"
      :key="connection.id"
      class="connection-group"
    >
      <defs v-if="!isCrossLink(connection)">
        <marker
          :id="`arrowhead-${connection.id}`"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" :fill="connection.color" />
        </marker>
      </defs>

      <!-- Invisible wide hit area so the thin line is easy to click to delete -->
      <path
        class="connection-hit"
        :d="getConnectionPath(connection)"
        stroke="transparent"
        stroke-width="14"
        fill="none"
        @click="canvasStore.removeConnection(connection.id)"
      />

      <path
        class="connection-visible"
        :d="getConnectionPath(connection)"
        :stroke="connection.color"
        :stroke-width="connection.width"
        fill="none"
        stroke-linecap="round"
        :marker-end="isCrossLink(connection) ? undefined : `url(#arrowhead-${connection.id})`"
      />
    </g>

    <!-- Preview while dragging a new mind-map cross-link -->
    <path
      v-if="linkPreviewPath"
      :d="linkPreviewPath"
      stroke="#94A3B8"
      stroke-width="2"
      fill="none"
      stroke-dasharray="6,5"
      stroke-linecap="round"
    />

    <!-- Draw shapes -->
    <g v-for="shape in shapes" :key="shape.id">
      <!-- Rectangle -->
      <rect
        v-if="shape.type === 'rectangle'"
        :x="shape.position.x"
        :y="shape.position.y"
        :width="shape.size.width"
        :height="shape.size.height"
        :stroke="shape.color"
        :stroke-width="shape.width"
        :fill="shape.fill ? shape.color : 'none'"
        :fill-opacity="shape.fill ? 0.2 : 0"
      />

      <!-- Circle -->
      <ellipse
        v-else-if="shape.type === 'circle'"
        :cx="shape.position.x + shape.size.width / 2"
        :cy="shape.position.y + shape.size.height / 2"
        :rx="shape.size.width / 2"
        :ry="shape.size.height / 2"
        :stroke="shape.color"
        :stroke-width="shape.width"
        :fill="shape.fill ? shape.color : 'none'"
        :fill-opacity="shape.fill ? 0.2 : 0"
      />

      <!-- Line -->
      <line
        v-else-if="shape.type === 'line'"
        :x1="shape.position.x"
        :y1="shape.position.y"
        :x2="shape.position.x + shape.size.width"
        :y2="shape.position.y + shape.size.height"
        :stroke="shape.color"
        :stroke-width="shape.width"
        stroke-linecap="round"
      />

      <!-- Arrow -->
      <g v-else-if="shape.type === 'arrow'">
        <defs>
          <marker
            :id="`arrowhead-shape-${shape.id}`"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" :fill="shape.color" />
          </marker>
        </defs>
        <line
          :x1="shape.position.x"
          :y1="shape.position.y"
          :x2="shape.position.x + shape.size.width"
          :y2="shape.position.y + shape.size.height"
          :stroke="shape.color"
          :stroke-width="shape.width"
          stroke-linecap="round"
          :marker-end="`url(#arrowhead-shape-${shape.id})`"
        />
      </g>
    </g>

    <!-- Preview connection while dragging -->
    <path
      v-if="connectionPreview"
      :d="connectionPreview"
      stroke="#3B82F6"
      stroke-width="2"
      fill="none"
      stroke-dasharray="5,5"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { Connection, Shape } from '~/types'

const canvasStore = useCanvasStore()
const connectionPreview = ref<string | null>(null)

const connections = computed(() => canvasStore.currentBoard?.connections || [])
const shapes = computed(() => canvasStore.currentBoard?.shapes || [])

const findCard = (id: string) =>
  canvasStore.currentBoard?.cards.find(c => c.id === id)

// A cross-link is a connection between two mind-map nodes that are NOT in a
// parent/child relationship (i.e. a user-drawn graph edge, not the hierarchy).
const isCrossLink = (connection: Connection): boolean => {
  const fromCard = findCard(connection.fromCardId)
  const toCard = findCard(connection.toCardId)
  if (!fromCard || !toCard) return false
  if (fromCard.type !== 'mindmap' || toCard.type !== 'mindmap') return false
  const parentChild =
    fromCard.mindMapData?.childIds?.includes(toCard.id) ||
    toCard.mindMapData?.childIds?.includes(fromCard.id)
  return !parentChild
}

const getConnectionPath = (connection: Connection): string => {
  const fromCard = findCard(connection.fromCardId)
  const toCard = findCard(connection.toCardId)
  if (!fromCard || !toCard) return ''

  const crossLink = isCrossLink(connection)
  const hierarchy =
    fromCard.type === 'mindmap' && toCard.type === 'mindmap' && !crossLink

  const cy = (c: typeof fromCard) => c.position.y + c.size.height / 2

  if (hierarchy) {
    // Leftward layout: parent's LEFT edge -> child's RIGHT edge, with a smooth
    // cubic curve using horizontal control handles.
    const x1 = fromCard.position.x
    const y1 = cy(fromCard)
    const x2 = toCard.position.x + toCard.size.width
    const y2 = cy(toCard)
    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40)
    return `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`
  }

  if (crossLink) {
    // Graph links: same smooth curve, anchored on the LEFT edge of both nodes
    // (matching the link handles), bulging out to the left.
    const x1 = fromCard.position.x
    const y1 = cy(fromCard)
    const x2 = toCard.position.x
    const y2 = cy(toCard)
    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60)
    return `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }

  // Non-mindmap connections: center -> center.
  const x1 = fromCard.position.x + fromCard.size.width / 2
  const y1 = cy(fromCard)
  const x2 = toCard.position.x + toCard.size.width / 2
  const y2 = cy(toCard)
  if (connection.style === 'curved') {
    return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2} ${x2} ${y2}`
  }
  return `M ${x1} ${y1} L ${x2} ${y2}`
}

// Dashed preview line from the source node center to the cursor while dragging.
const linkPreviewPath = computed<string | null>(() => {
  const drag = canvasStore.linkDrag
  if (!drag) return null
  const fromCard = findCard(drag.fromId)
  if (!fromCard) return null
  const x1 = fromCard.position.x
  const y1 = fromCard.position.y + fromCard.size.height / 2
  return `M ${x1} ${y1} L ${drag.x} ${drag.y}`
})

defineExpose({ connectionPreview })
</script>

<style scoped>
/* The SVG itself is pointer-events:none; re-enable hits on the wide hit path
   so a connection can be clicked to delete, without blocking canvas panning. */
.connection-hit {
  pointer-events: stroke;
  cursor: pointer;
}

.connection-visible {
  pointer-events: none;
  transition: stroke-width 0.1s ease;
}

.connection-group:hover .connection-visible {
  stroke-width: 4;
}
</style>
