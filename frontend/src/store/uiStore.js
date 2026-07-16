import { create } from 'zustand'

const useUiStore = create((set) => ({
  isLoading: false,
  modalOpen: false,
  modalContent: null,
  toast: null,
  sidebarOpen: true,
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),
  
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open })
}))

export default useUiStore