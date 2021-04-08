<template>
  <div ref="container" class="terminal-container">
    <div ref="xterm" class="terminal" />
    <div class="bottom">
      <Dropdown placement="top-end" trigger="click" @on-click="handleMenu">
        <a style="color:white;">
          <Icon type="md-reorder" />
          Menu
        </a>
        <DropdownMenu slot="list">
          <DropdownItem v-if="success" name="load">
            <Icon type="ios-pie" />
            负载情况
          </DropdownItem>
          <DropdownItem v-if="success" name="folder">
            <Icon type="ios-folder" />
            文件管理
          </DropdownItem>
          <DropdownItem name="reAuth">
            <Icon type="md-git-commit" />
            重新登录
          </DropdownItem>
          <DropdownItem name="logout">
            <Icon type="ios-radio-button-on" />
            退出登录
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <div>
        {{ address }}
      </div>
      <div :class="{'succeed': success, 'failed': !success}">
        {{ status }}
      </div>
    </div>
    <Modal v-model="visible" :transfer="false" draggable title="负载情况">
      <div ref="memoryModel" style="width:245px;height:260px;" />
      <div ref="cpuModel" style="width:245px;height:260px;" />
      <div slot="footer">
        <Button type="success" size="large" long @click="()=>visible=false">确定</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import 'xterm/css/xterm.css'
import {Terminal} from 'xterm'
import {FitAddon} from 'xterm-addon-fit'
import * as io from 'socket.io-client'
import * as echarts from 'echarts/core'
import {LegendComponent, TitleComponent, TooltipComponent} from 'echarts/components'
import {PieChart} from 'echarts/charts'
import {SVGRenderer} from 'echarts/renderers'
import {commonOptions} from '../constants/echarts'
import status from '../constants/status'
import config from '../constants/config'
import {deepAssign, deepClone} from '../utils'

export default {
  props: {
    query: {
      type: Object,
      default: () => {
        return {
          host: '192.168.1.129',
          port: 22,
          username: 'root',
          password: '123456'
        }
      }
    }
  },
  data() {
    return {
      address: '',
      status: '',
      success: false,
      term: '',
      fitAddon: '',
      visible: false,
      title: '',
      cpuEchart: null,
      memoryEchart: null,
      cpuData: [{
        name: '已使用',
        value: 0,
        label: {
          show: true,
          formatter: '{b}: {d}%',
          fontSize: '16'
        },
        itemStyle: {
          color: '#91CC75'
        }
      }, {
        name: '空闲',
        value: 0,
        itemStyle: {
          color: '#999999'
        }
      }],
      memoryData: [{
        name: '已使用',
        value: 0,
        label: {
          show: true,
          formatter: '{b}: {d}%',
          fontSize: '16'
        },
        itemStyle: {
          color: '#91CC75'
        }
      }, {
        name: '空闲',
        value: 0,
        itemStyle: {
          color: '#999999'
        }
      }]
    }
  },
  computed: {
    common() {
      return this.deepClone(commonOptions)
    }
  },
  watch: {
    visible(val) {
      let time = null
      this.socket.emit('memory')
      this.socket.emit('cpu')
      if (val) {
        time = setInterval(() => {
          this.socket.emit('memory')
        }, 2000)
        this.$nextTick(() => {
          this.drawEcharts()
        })
      } else {
        clearInterval(time)
        echarts.dispose(this.$refs.memoryModel)
        echarts.dispose(this.$refs.cpuModel)
      }
    }
  },
  mounted() {
    this.initSocket()
    echarts.use([TitleComponent, TooltipComponent, LegendComponent, PieChart, SVGRenderer])
    window.addEventListener('resize', this.resizeScreen, false)
  },
  beforeDestroy() {
    this.destroySocket()
  },
  methods: {
    initTerm() {
      const term = new Terminal()
      const fitAddon = new FitAddon()
      this.term = term
      this.fitAddon = fitAddon
      term.loadAddon(fitAddon)
      term.open(this.$refs.xterm)
      document.getElementsByClassName('xterm')[0].style.height = '100%'
      term.focus()
      fitAddon.fit()
    },
    initSocket() {
      this.socket = io.connect(`${config.url}:${config.port}`, {
        path: config.path,
        query: this.query
      })
      this.initTerm()
      this.term.onData((data) => {
        this.socket.emit('data', data)
      })
      this.socket.on('data', (data) => {
        this.term.write(data)
      })
        .on('connect', () => {
          this.socket.emit('geometry', this.term.cols, this.term.rows)
          document.title = `${this.query.username}@${this.query.host}`
        })
        .on('footer', (data) => {
          this.address = data
        })
        .on('status', (data) => {
          this.success = data.indexOf(status.success) !== -1
          this.status = data
        })
        .on('memory', (data) => {
          this.memoryData[0].value = data.usedMemory
          this.memoryData[1].value = data.freeMemory
          this.memoryData[2] = data.totalMemory
          this.memoryEchart.setOption({
            title: [{
              subtext: `${this.memoryData[0].value}/${this.memoryData[2]}(MB)`
            }],
            series: [{
              data: this.memoryData.slice(0, 2)
            }]
          })
        })
        .on('cpu', (data) => {
          this.cpuData[0].value = data.used
          this.cpuData[1].value = data.free
          this.cpuData[2] = data.totalCpu
          this.cpuEchart.setOption({
            title: [{
              subtext: `${this.cpuData[2]}核心`
            }],
            series: [{
              data: this.cpuData.slice(0, 2)
            }]
          })
        })
        .on('ssherror', (data) => {
          this.status = data
          this.success = false
        })
        .on('disconnect', (error) => {
          this.status = 'WEBSOCKET SERVER DISCONNECTED: ' + error
          this.success = false
          this.socket.io.reconnection(false)
          // TODO 跳登录页
        })
    },
    resizeScreen() {
      this.fitAddon.fit()
      this.socket.emit('resize', { cols: this.term.cols, rows: this.term.rows })
    },
    handleMenu(name) {
      switch (name) {
        case 'logout':
          this.destroySocket()
          // TODO 跳登录
          break
        case 'reAuth':
          this.destroySocket()
          this.initSocket()
          this.visible = false
          break
        case 'load':
          this.visible = true
      }
    },
    drawEcharts() {
      const memoryOption = {
        title: [{}, {
          subtext: '内存使用率'
        }],
        series: [{
          name: '内存使用率',
          data: this.memoryData
        }]
      }
      const cpuOption = {
        title: [{}, {
          subtext: 'CPU使用率'
        }],
        tooltip: {
          formatter: '{b}: {d}%'
        },
        series: [{
          name: 'CPU使用率',
          data: this.cpuData
        }]
      }
      this.memoryEchart = this.createEcharts('memoryModel', memoryOption)
      this.cpuEchart = this.createEcharts('cpuModel', cpuOption)
    },
    createEcharts(ref, option) {
      const el = this.$refs[ref]
      const eChart = echarts.init(el, null, { renderer: 'svg' })
      const options = this.deepAssign(option, this.common)
      options && eChart.setOption(options)
      eChart.resize()
      return eChart
    },
    destroySocket() {
      this.socket.close()
      this.term.dispose()
    },
    deepAssign,
    deepClone
  }
}
</script>

<style lang="scss" scoped>
.terminal-container {
  height: 100%;
}

.terminal {
  background-color: #000000;
  color: #fafafa;
  padding: 2px;
  height: calc(100% - 19px);
}

.bottom {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  color: white;
  position: fixed;
  width: 100%;
  background-color: rgb(50, 50, 50);
  border-color: white;
  white-space: nowrap;
  border-style: solid none none none;
  border-width: 1px;
  z-index: 99;
  height: 19px;

  > div {
    padding: 0 10px;
    font-size: 16px;
    border-color: white;
    border-style: none solid none solid;
    border-width: 1px;
    line-height: 19px;
  }
}

.succeed {
  background-color: green;
}

.failed {
  background-color: red;
}

::v-deep .ivu-modal-body {
  display: flex;
}

::v-deep .ivu-icon-md-reorder {
  font-size: 21px;
}
</style>
