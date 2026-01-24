<template>
  <svg class="absolute inset-0 pointer-events-none" style="z-index: 500;" :width="10000" :height="10000">
    <!-- Draw connections as curved arrows -->
    <g v-for="connection in connections" :key="connection.id">
      <defs>
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

      <path
        :d="getConnectionPath(connection)"
        :stroke="connection.color"
        :stroke-width="connection.width"
        fill="none"
        stroke-linecap="round"
        :marker-end="`url(#arrowhead-${connection.id})`"
      />
    </g>

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

const getConnectionPath = (connection: Connection): string => {
  if (!canvasStore.currentBoard) return ''

  const fromCard = canvasStore.currentBoard.cards.find(c => c.id === connection.fromCardId)
  const toCard = canvasStore.currentBoard.cards.find(c => c.id === connection.toCardId)

  if (!fromCard || !toCard) return ''

  let x1, y1, x2, y2

  // For mindmap nodes, connect from right side of parent to left side of child
  if (fromCard.type === 'mindmap' && toCard.type === 'mindmap') {
    // Right edge of parent (right side, vertical center)
    x1 = fromCard.position.x + fromCard.size.width
    y1 = fromCard.position.y + fromCard.size.height / 2

    // Left edge of child (left side, vertical center)
    x2 = toCard.position.x
    y2 = toCard.position.y + toCard.size.height / 2
  } else {
    // Default: center points for non-mindmap connections
    x1 = fromCard.position.x + fromCard.size.width / 2
    y1 = fromCard.position.y + fromCard.size.height / 2
    x2 = toCard.position.x + toCard.size.width / 2
    y2 = toCard.position.y + toCard.size.height / 2
  }

  if (connection.style === 'curved') {
    // Bezier curve for smooth connections
    const controlX = (x1 + x2) / 2
    const controlY = (y1 + y2) / 2
    return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`
  } else {
    // Straight line
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }
}

defineExpose({ connectionPreview })
</script>
