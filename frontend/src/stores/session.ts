import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  state: () => ({
    token: '',
    userName: '',
    role: '',
  }),
  actions: {
    setSession(token: string, userName: string, role: string) {
      this.token = token
      this.userName = userName
      this.role = role
    },
    clearSession() {
      this.token = ''
      this.userName = ''
      this.role = ''
    },
  },
})

