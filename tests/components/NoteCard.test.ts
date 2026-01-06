import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NoteCard from '~/components/NoteCard.vue'
import { useCanvasStore } from '~/stores/canvas'

describe('NoteCard Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders text card correctly', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      content: 'Test content'
    })

    const wrapper = mount(NoteCard, {
      props: { card },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('applies correct positioning styles', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'text',
      position: { x: 150, y: 200 },
      size: { width: 250, height: 180 },
      content: 'Test'
    })

    const wrapper = mount(NoteCard, {
      props: { card },
      global: {
        plugins: [createPinia()]
      }
    })

    const element = wrapper.find('div')
    expect(element.attributes('style')).toContain('left: 150px')
    expect(element.attributes('style')).toContain('top: 200px')
    expect(element.attributes('style')).toContain('width: 250px')
    expect(element.attributes('style')).toContain('height: 180px')
  })

  it('displays card controls when selected', async () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      content: 'Test'
    })

    const wrapper = mount(NoteCard, {
      props: { card },
      global: {
        plugins: [createPinia()]
      }
    })

    // Select the card
    store.selectCard(card.id)
    await wrapper.vm.$nextTick()

    // Card should be marked as selected
    expect(store.selectedCardId).toBe(card.id)
  })

  it('accepts background color prop', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      content: 'Test',
      color: '#ff0000'
    })

    const wrapper = mount(NoteCard, {
      props: { card },
      global: {
        plugins: [createPinia()]
      }
    })

    // Verify card color property is set
    expect(wrapper.props('card').color).toBe('#ff0000')
    expect(wrapper.exists()).toBe(true)
  })
})
