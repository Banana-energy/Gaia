<template>
  <div>
    <Modal v-model="listActive" :mask-closable="false" width="720">
      <p slot="header">
        <span>会话</span>
      </p>
      <div class="connect-header">
        <Button size="large" type="text" @click="newConnect">
          <span class="iconfont iconpeizhi" />
          新建
        </Button>
        <Button :disabled="disabled" size="large" type="text" @click="deleteConnect">
          <span class="iconfont iconchuyidong" />
          删除
        </Button>
        <Button :disabled="disabled" size="large" type="text" @click="viewConnect">
          <span class="iconfont iconshuxing" />
          属性
        </Button>
      </div>
      <Table
        ref="connectTable"
        highlight-row
        :columns="header"
        :data="list"
        @on-row-click="select"
        @on-row-dblclick="connect"
      />
      <div slot="footer">
        <Button type="primary" :disabled="disabled" :loading="loading" @click="connect">连接</Button>
        <Button @click="close">取消</Button>
      </div>
    </Modal>
    <new-connect :row="row" :property-active.sync="propertyActive" />
  </div>
</template>

<script>
import newConnect from '@/components/NewConnect'
import mixin from '@/mixins'

export default {
  name: 'Connect',
  components: {
    newConnect
  },
  mixins: [mixin],
  props: {
    listActive: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: false,
      disabled: true,
      propertyActive: false,
      isAdd: true,
      list: [],
      row: {},
      header: [{
        title: '名称',
        key: 'name'
      }, {
        title: '主机',
        key: 'host'
      }, {
        title: '端口',
        key: 'port'
      }, {
        title: '用户名',
        key: 'username'
      }, {
        title: '说明',
        key: 'desc'
      }]
    }
  },
  mounted() {
    this.getConnectList()
  },
  methods: {
    getConnectList() {
      const reg = /^mxb*/
      for (let i = 0; i < localStorage.length; i++) {
        if (reg.test(localStorage.key(i))) {
          this.list.push(JSON.parse(localStorage.getItem(localStorage.key(i))))
        }
      }
    },
    connect(row, index) {
      if (index) {
        // 双击
      } else {
        this.loading = true
        setTimeout(async() => {
          await this.$router.push({ name: 'xterm', params: { row: this.row }})
          this.loading = false
        }, 500)
      }
    },
    select(row) {
      this.disabled = false
      this.row = row
    },
    newConnect() {
      this.row = {
        name: '',
        host: '',
        agreement: '1',
        port: 22,
        desc: '',
        method: '1',
        username: '',
        password: '',
        publicKey: ''
      }
      this.$refs.connectTable.clearCurrentRow()
      this.disabled = true
      this.propertyActive = true
    },
    viewConnect() {
      this.propertyActive = true
    },
    close() {

    },
    deleteConnect() {
      this.$removeItem(`mxb-${this.row.host}`)
      this.row = {}
      this.disabled = true
    }
  }
}
</script>

<style scoped>
.iconpeizhi {
  font-size: 14px;
}

.connect-header {
  margin-bottom: 10px;
}

::v-deep .ivu-btn:focus {
  box-shadow: none;
}
</style>
