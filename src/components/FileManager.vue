<template>
  <div class="folder-container">
    <div class="folder-buttons">
      <Select v-model="createType" class="folder-create" placeholder="新建" prefix="ios-folder-open">
        <Option v-for="item in createList" :key="item.value" :value="item.value">{{ item.label }}</Option>
      </Select>
      <Button class="folder-refresh" icon="md-sync" @click="refresh">刷新</Button>
      <Upload :show-upload-list="false" class="file-upload" action="//jsonplaceholder.typicode.com/posts/" :before-upload="readFile">
        <Button icon="ios-cloud-upload-outline">上传</Button>
      </Upload>
    </div>
    <div class="folder-breadcrumb">
      <Breadcrumb separator=">">
        <BreadcrumbItem v-for="(item, i) in filePath" :key="i">
          <template>
            <span class="folder-bread-name" @click="jumpFolder(i)">{{ item }}</span>
          </template>
        </BreadcrumbItem>
      </Breadcrumb>
    </div>
    <Table
      ref="table"
      :loading="loading"
      :height="tableHeight"
      ellipsis
      highlight-row
      border
      disabled-hover
      :columns="fileColumns"
      :data="fileList"
      @on-row-dblclick="openFolder"
    >
      <template slot="name" slot-scope="{ row }">
        <Icon v-if="row.folder" type="ios-folder" />
        <span class="folder-name">{{ row.name }}</span>
      </template>
      <template slot="action" slot-scope="{ row }" class="test">
        <div class="options">
          <Button type="text" size="small" @click="edit(row)">编辑</Button>
          <Button v-if="!row.folder" type="text" size="small" @click="openFolder(row)">下载</Button>
          <Poptip
            transfer
            confirm
            word-wrap
            placement="top-end"
            :title="`确定删除该${row.folder?'文件夹':'文件'}吗？`"
            @on-ok="rm(row)"
          >
            <Button size="small" type="text">删除</Button>
          </Poptip>
        </div>
      </template>
    </Table>
    <Modal v-model="visible" :transfer="false" loading :title="title" @on-ok="chmod">
      <div style="border-bottom: 1px solid #c3c3c3;margin-bottom: 20px;">
        <div class="model-name" style="width: 40%">
          <Icon v-if="fileAttr.folder" type="md-folder" />
          <Icon v-else type="md-document" />
          <span>{{ fileAttr.name }}</span>
        </div>
      </div>
      <div style="border-bottom: 1px solid #c3c3c3;margin-bottom: 20px;">
        <div class="model-attr">
          <div class="model-path">
            <span>位置：</span>
            <span>{{ fileAttr.path }}</span>
          </div>
          <div class="model-path">
            <span>大小：</span>
            <span>{{ fileAttr.size }}</span>
          </div>
        </div>
      </div>
      <div class="model-permission">
        <span>权限：</span>
        <Form :model="permissions" :label-width="80">
          <FormItem label="拥有者(O)">
            <CheckboxGroup v-model="permissions.owner" @on-change="editPermission">
              <Checkbox :label="256">
                <span>R</span>
              </Checkbox>
              <Checkbox :label="128">
                <span>W</span>
              </Checkbox>
              <Checkbox :label="64">
                <span>X</span>
              </Checkbox>
              <Checkbox :label="2048">
                <span>设置UID</span>
              </Checkbox>
            </CheckboxGroup>
          </FormItem>
          <FormItem label="组(G)">
            <CheckboxGroup v-model="permissions.group" @on-change="editPermission">
              <Checkbox :label="32">
                <span>R</span>
              </Checkbox>
              <Checkbox :label="16">
                <span>W</span>
              </Checkbox>
              <Checkbox :label="8">
                <span>X</span>
              </Checkbox>
              <Checkbox :label="1024">
                <span>设置GID</span>
              </Checkbox>
            </CheckboxGroup>
          </FormItem>
          <FormItem label="其他(H)">
            <CheckboxGroup v-model="permissions.others" @on-change="editPermission">
              <Checkbox :label="4">
                <span>R</span>
              </Checkbox>
              <Checkbox :label="2">
                <span>W</span>
              </Checkbox>
              <Checkbox :label="1">
                <span>X</span>
              </Checkbox>
              <Checkbox :label="512">
                <span>粘附</span>
              </Checkbox>
            </CheckboxGroup>
          </FormItem>
          <FormItem label="八进制表">
            <Input v-model="permissions.octal" maxlength="4" @on-blur="editOctal" />
          </FormItem>
        </Form>
      </div>
    </Modal>
    <Modal v-model="pVisible" title="上传中...">
      <div style="display: flex;align-items: center;justify-content: center">
        <i-circle :percent="percent" :stroke-color="color">
          <Icon v-if="percent === 100" type="ios-checkmark" size="60" style="color:#5cb85c" />
          <span v-else style="font-size:24px">{{ percent }}%</span>
        </i-circle>
      </div>
      <template slot="footer">
        <div />
      </template>
    </Modal>
  </div>
</template>

<script>
import * as io from 'socket.io-client'
import config from '../constants/config'
import ss from 'socket.io-stream'

export default {
  name: 'FileManager',
  data() {
    return {
      createType: '',
      loading: true,
      title: '',
      visible: false,
      fileAttr: {
        folder: true,
        name: '',
        size: '',
        path: ''
      },
      permissions: {
        owner: [],
        group: [],
        others: [],
        octal: '0000'
      },
      createList: [
        {
          value: 1,
          label: '文件'
        },
        {
          value: 2,
          label: '目录'
        },
        {
          value: 3,
          label: '连接'
        }
      ],
      fileColumns: [
        {
          title: '名字',
          slot: 'name',
          className: 'file-name',
          minWidth: 200
        },
        {
          title: '大小',
          key: 'size',
          align: 'right',
          width: 100
        },
        {
          title: '修改时间',
          key: 'time',
          width: 200
        },
        {
          title: '权限',
          key: 'authority',
          width: 110
        },
        {
          title: '拥有者',
          key: 'owner',
          width: 100
        },
        {
          title: '操作',
          slot: 'action',
          align: 'center',
          width: 150
        }],
      fileList: [],
      tableHeight: 450,
      filePath: [],
      pVisible: false,
      percent: 0
    }
  },
  computed: {
    color() {
      return this.percent === 100 ? '#5cb85c' : '#2db7f5'
    }
  },
  watch: {
    visible(val) {
      if (!val) {
        this.permissions = {
          owner: [],
          group: [],
          others: [],
          octal: '0000'
        }
      }
    }
  },
  mounted() {
    this.initSocket()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeTable)
    this.socket.close()
  },
  methods: {
    initSocket() {
      const query = window.opener.query
      document.title = `${query.username}@${query.host}`
      this.resizeTable()
      window.addEventListener('resize', this.resizeTable)
      this.socket = io.connect(`${config.url}:${config.port}`, {
        path: config.path,
        query
      })
      this.socket.on('fileList', (fileList) => {
        this.fileList = fileList
        this.loading = false
      })
        .on('filePath', (data) => {
          this.filePath = data
        })
      this.downloadFile()
    },
    openFolder(row) {
      if (row.folder) {
        this.loading = true
        this.fileList = []
        this.filePath.push(row.name)
        this.socket.emit('openFolder', this.filePath.join('/'))
      } else {
        this.socket.emit('download', this.filePath.join('/'), row.name)
      }
    },
    jumpFolder(index) {
      this.loading = true
      this.filePath = this.filePath.slice(0, index + 1)
      this.socket.emit('openFolder', this.filePath.join('/'))
    },
    handleFileStream(fileStream, filename = 'test') {
      const blob = new Blob([fileStream])
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      document.body.appendChild(a)
      a.download = filename
      a.click()
      document.body.removeChild(a)
    },
    downloadFile() {
      ss(this.socket).on('download', (stream, name) => {
        let binaryString = ''
        stream.on('data', (data) => {
          for (let i = 0; i < data.length; i++) {
            binaryString += String.fromCharCode(data[i])
          }
        })
        stream.on('end', () => {
          const blob = new Blob([binaryString])
          binaryString = ''
          this.handleFileStream(blob, name)
        })
      })
    },
    readFile(file) {
      if (this.socket.connect) {
        const reader = new FileReader()
        const filename = file.name
        const path = this.filePath.join('/')
        reader.readAsArrayBuffer(file)
        reader.onload = (event) => {
          const file = Buffer.from(event.target.result)
          this.pVisible = true
          this.uploadFile(file, filename, path)
        }
      }
      return false
    },
    uploadFile(file, filename, path, num = 1) {
      const blockNum = Math.ceil(file.length / config.chunk)
      const nextSize = Math.min(num * config.chunk, file.length)
      const fileChunk = file.slice((num - 1) * config.chunk, nextSize)
      this.socket.emit('upload', fileChunk, filename, path, num, file.length)
      if (num >= blockNum) {
        this.percent = 100
        this.pVisible = false
        this.socket.on('uploaded', () => {
          this.refresh()
        })
        return
      }
      new Promise(resolve => {
        this.socket.on('uploading', () => {
          this.percent = Math.ceil(num / blockNum * 100)
          resolve()
        })
      }).then(() => {
        this.uploadFile(file, filename, path, ++num)
      })
    },
    rm(row) {
      const path = this.filePath.slice()
      path.push(row.name)
      if (row.folder) {
        this.socket.emit('rmdir', path.join('/'), true)
      } else {
        this.socket.emit('rmdir', path.join('/'), false)
      }
    },
    getAuthority(authority, arr, name) {
      authority.map((item, index) => {
        if (item !== '-') {
          if (item === 's' || item === 't') {
            this.permissions[name].push(arr[arr.length - 1])
            this.permissions[name].push(arr[index])
          } else if (item === 'S' || item === 'T') {
            this.permissions[name].push(arr[arr.length - 1])
          } else {
            this.permissions[name].push(arr[index])
          }
        }
      })
    },
    edit(row) {
      this.title = row.name + '属性'
      const authority = row.authority.split('').slice(1)
      const owner = authority.slice(0, 3)
      const group = authority.slice(3, 6)
      const others = authority.slice(6, 9)
      this.getAuthority(owner, [256, 128, 64, 2048], 'owner')
      this.getAuthority(group, [32, 16, 8, 1024], 'group')
      this.getAuthority(others, [4, 2, 1, 512], 'others')
      this.editPermission()
      this.fileAttr.size = row.size ? row.size : '未知'
      this.fileAttr.name = row.name
      this.fileAttr.folder = row.folder
      this.fileAttr.path = this.filePath.join('/').substr(1)
      this.visible = true
    },
    editPermission() {
      if (this.permissions.owner.length || this.permissions.group.length || this.permissions.others.length) {
        const pArr = Array.prototype.concat(this.permissions.owner, this.permissions.group, this.permissions.others)
        const sum = pArr.reduce((total = 0, item) => {
          return total + item
        })
        const octal = sum.toString(8)
        this.permissions.octal = ('0000' + octal).slice(-4)
      } else {
        this.permissions.octal = '0000'
      }
    },
    editOctal() {
      this.permissions.octal = ('0000' + this.permissions.octal).slice(-4)
      const reg = /^[0-7]*$/g
      const map = {
        '7': [[2048, 1024, 512], [256, 128, 64], [32, 16, 8], [4, 2, 1]],
        '6': [[2048, 1024], [256, 128], [32, 16], [4, 2]],
        '5': [[2048, 512], [256, 64], [32, 8], [4, 1]],
        '4': [[2048], [256], [32], [4]],
        '3': [[1024, 512], [128, 64], [16, 8], [2, 1]],
        '2': [[1024], [128], [16], [2]],
        '1': [[512], [64], [8], [1]]
      }
      if (reg.test(this.permissions.octal)) {
        this.permissions.owner = []
        this.permissions.group = []
        this.permissions.others = []
        this.permissions.octal.split('').map((item, index) => {
          if (item === '0') {
            return
          }
          if (index === 0) {
            if (map[item][index].includes(2048)) {
              this.permissions.owner.push(2048)
            }
            if (map[item][index].includes(1024)) {
              this.permissions.group.push(1024)
            }
            if (map[item][index].includes(512)) {
              this.permissions.others.push(512)
            }
          }
          if (index === 1) {
            this.permissions.owner = Array.prototype.concat(this.permissions.owner, map[item][index])
          } else if (index === 2) {
            this.permissions.group = Array.prototype.concat(this.permissions.group, map[item][index])
          } else if (index === 3) {
            this.permissions.others = Array.prototype.concat(this.permissions.others, map[item][index])
          }
        })
      } else {
        this.$Message.error({
          background: true,
          content: this.permissions.octal + '不是有效8进制格式权限'
        })
      }
    },
    chmod() {
      new Promise(resolve => {
        this.socket.emit('chmod', this.filePath.join('/'), this.fileAttr.name, this.permissions.octal)
        this.socket.on('uploaded', () => {
          resolve()
          this.refresh()
        })
      }).then(() => {
        this.visible = false
      })
    },
    refresh() {
      this.loading = true
      this.fileList = []
      this.socket.emit('openFolder', this.filePath.join('/'))
    },
    resizeTable() {
      this.tableHeight = window.innerHeight - this.$refs.table.$el.offsetTop - 80
    }
  }
}
</script>

<style lang="scss" scoped>
.folder-container {
  padding: 10px;
  .folder-buttons {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .folder-create {
      width: 100px;
      ::v-deep .ivu-select-selection {
        border-radius: 0;
      }
    }
    .folder-refresh {
      border-radius: 0;
      margin-left: -1px;
      &:hover {
        z-index: 1;
      }
    }
    .file-upload {
      ::v-deep .ivu-btn {
        border-radius: 0;
        margin-left: -1px;
      }
    }
  }
  .folder-breadcrumb {
    padding: 10px 5px;
  }
}
::v-deep .ivu-icon-ios-folder-open {
  font-size: 16px;
}

.model-name {
  width: 40%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
}

.model-attr {
  width: 40%;
  padding-bottom: 20px;
  .model-path {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.model-permission {
  display: flex;
  width: 90%;
  justify-content: space-between;
}

::v-deep .ivu-modal-footer {
  border: none;
}

::v-deep .folder-bread-name {
  cursor: pointer;
}

::v-deep .ivu-icon-md-folder {
  font-size: 40px;
}

::v-deep .ivu-icon-md-document {
  font-size: 40px;
}

::v-deep .ivu-table {
  td {
    border-bottom: none;
  }
  th {
    background-color: inherit;
    border-bottom: none;
  }
  &:before {
    background-color: inherit;
  }
  .file-name {
    &:hover {
      background-color: #ebf7ff;
    }
    .ivu-table-cell {
      cursor: default;
    }
  }
  .ivu-icon {
    font-size: 16px;
  }
  .folder-name {
    padding: 0 5px;
  }
  .options {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

::v-deep .ivu-btn-text {
  color: #007cff;
}

</style>
