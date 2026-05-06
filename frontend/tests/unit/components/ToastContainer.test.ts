import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ToastContainer from '@/components/ToastContainer.vue'
import { useToastStore } from '@/stores/toasts'

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders no toasts when store is empty', () => {
    const wrapper = mount(ToastContainer)
    expect(wrapper.findAll('.animate-slide-in').length).toBe(0)
  })

  it('renders toasts from the store', async () => {
    const store = useToastStore()
    store.addToast('Migration started', 'success')
    store.addToast('Preflight warning', 'warning')

    const wrapper = mount(ToastContainer)
    expect(wrapper.text()).toContain('Migration started')
    expect(wrapper.text()).toContain('Preflight warning')
  })

  it('applies success class for success toasts', () => {
    const store = useToastStore()
    store.addToast('ok', 'success')

    const wrapper = mount(ToastContainer)
    const toast = wrapper.find('.bg-emerald-900\\/80')
    expect(toast.exists()).toBe(true)
  })

  it('applies error class for error toasts', () => {
    const store = useToastStore()
    store.addToast('fail', 'error')

    const wrapper = mount(ToastContainer)
    const toast = wrapper.find('.bg-red-900\\/80')
    expect(toast.exists()).toBe(true)
  })

  it('applies warning class for warning toasts', () => {
    const store = useToastStore()
    store.addToast('warn', 'warning')

    const wrapper = mount(ToastContainer)
    const toast = wrapper.find('.bg-amber-900\\/80')
    expect(toast.exists()).toBe(true)
  })

  it('auto-dismisses toast after 5 seconds', () => {
    const store = useToastStore()
    store.addToast('will dismiss', 'info')

    expect(store.toasts.length).toBe(1)

    vi.advanceTimersByTime(5000)

    expect(store.toasts.length).toBe(0)
  })

  it('removeToast removes toast on button click', async () => {
    const store = useToastStore()
    store.addToast('click me', 'info')

    const wrapper = mount(ToastContainer)
    expect(wrapper.text()).toContain('click me')

    await wrapper.find('button').trigger('click')
    expect(store.toasts.length).toBe(0)
  })

  it('displays correct toast count when multiple added', () => {
    const store = useToastStore()
    store.addToast('one', 'info')
    store.addToast('two', 'success')
    store.addToast('three', 'error')

    const wrapper = mount(ToastContainer)
    expect(wrapper.findAll('.animate-slide-in').length).toBe(3)
  })

  it('each toast has unique id', () => {
    const store = useToastStore()
    store.addToast('a', 'info')
    store.addToast('b', 'info')

    const ids = store.toasts.map(t => t.id)
    expect(new Set(ids).size).toBe(2)
  })
})
