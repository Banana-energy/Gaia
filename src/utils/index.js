import Vue from 'vue'

Vue.prototype.$setItem = (key, data) => {
  const storageEvent = document.createEvent('StorageEvent')
  const storage = {
    setItem: (k, val) => {
      localStorage.setItem(k, val)
      // 初始化创建的事件
      storageEvent.initStorageEvent('setItem', false, false, k, null, val, null, null)
      // 派发对象
      window.dispatchEvent(storageEvent)
    }
  }
  return storage.setItem(key, data)
}
Vue.prototype.$removeItem = (key) => {
  const storageEvent = document.createEvent('StorageEvent')
  // 创建一个StorageEvent事件
  const storage = {
    removeItem: (k) => {
      localStorage.removeItem(k)
      // 初始化创建的事件
      storageEvent.initStorageEvent('removeItem', false, false, k, null, null, null, null)
      // 派发对象
      window.dispatchEvent(storageEvent)
    }
  }
  return storage.removeItem(key)
}

export function deepClone(obj) {
  // 传递进来的如果不是对象，则无需处理，直接返回原始的值即可（一般Symbol和Function也不会进行处理的）
  if (obj === null) return null
  if (typeof obj !== 'object') return obj
  // 过滤掉特殊的对象（正则对象或者日期对象）：直接使用原始值创建当前类的一个新的实例即可，这样克隆后的是新的实例，但是值和之前一样
  if (obj instanceof RegExp) return new RegExp(obj)
  if (obj instanceof Date) return new Date(obj)
  // 如果传递的是数组或者对象，我们需要创建一个新的数组或者对象，用来存储原始的数据
  // obj.constructor 获取当前值的构造器（Array/Object）
  const cloneObj = new obj.constructor()
  for (const key in obj) {
    // 循环原始数据中的每一项，把每一项赋值给新的对象
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = this.deepClone(obj[key])
    } else {
      break
    }
  }
  return cloneObj
}

export function deepAssign(sObj, eObj) {
  const obj = this.deepClone(sObj)
  // 再拿OBJ2替换OBJ中的每一项
  for (const key in eObj) {
    if (eObj.hasOwnProperty(key)) {
      const v2 = eObj[key]
      const v1 = obj[key]
      // 如果OBJ2遍历的当前项是个对象，并且对应的OBJ这项也是一个对象，此时不能直接替换，需要把两个对象重新合并一下，合并后的最新结果赋值给新对象中的这一项
      if (typeof v1 === 'object' && typeof v2 === 'object') {
        obj[key] = this.deepAssign(v1, v2)
        continue
      }
      obj[key] = v2
    }
  }
  return obj
}
