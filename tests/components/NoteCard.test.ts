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

  it('displays delete button when selected', async () => {
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

    // Initially not selected
    expect(wrapper.find('button').exists()).toBe(false)

    // Select the card
    store.selectCard(card.id)
    await wrapper.vm.$nextTick()

    // Should show controls
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })

  it('applies background color', () => {
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

    const element = wrapper.find('div')
    expect(element.attributes('style')).toContain('background-color: rgb(255, 0, 0)')
  })
})
