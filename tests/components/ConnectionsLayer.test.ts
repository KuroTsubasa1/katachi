import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import ConnectionsLayer from '~/components/ConnectionsLayer.vue'
import { useCanvasStore } from '~/stores/canvas'

describe('ConnectionsLayer', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders an arrowhead on hierarchy links but not on graph cross-links', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const root = store.addMindMapNode({ x: 0, y: 0 })
    const a = store.addMindMapChild(root.id)! // hierarchy connection root -> a
    const b = store.addMindMapChild(root.id)! // hierarchy connection root -> b
    store.createMindMapLink(a.id, b.id)        // graph cross-link a <-> b

    const wrapper = mount(ConnectionsLayer, { global: { plugins: [pinia] } })

    const visible = wrapper.findAll('path.connection-visible')
    expect(visible.length).toBe(3)

    const withArrow = visible.filter(p => p.attributes('marker-end'))
    const withoutArrow = visible.filter(p => !p.attributes('marker-end'))

    expect(withArrow.length).toBe(2) // both hierarchy links have arrowheads
    expect(withoutArrow.length).toBe(1) // the cross-link has none
    expect(withArrow[0]!.attributes('marker-end')).toContain('arrowhead')
  })
})
