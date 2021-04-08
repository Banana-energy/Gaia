const mixin = {
  mounted() {
    const reg = /^mxb*/
    window.addEventListener('setItem', () => {
      this.list = []
      for (let i = 0; i < localStorage.length; i++) {
        if (reg.test(localStorage.key(i))) {
          this.list.push(JSON.parse(localStorage.getItem(localStorage.key(i))))
        }
      }
    })
    window.addEventListener('removeItem', () => {
      this.list = []
      for (let i = 0; i < localStorage.length; i++) {
        if (reg.test(localStorage.key(i))) {
          this.list.push(JSON.parse(localStorage.getItem(localStorage.key(i))))
        }
      }
    })
  }
}

export default mixin
