<template>
  <div class="folder-container">
    <div class="folder-buttons">
      <Select v-model="createType" class="folder-create" placeholder="新建" prefix="ios-folder-open">
        <Option v-for="item in createList" :key="item.value" :value="item.value">{{ item.label }}</Option>
      </Select>
      <Button class="folder-refresh" icon="md-sync">刷新</Button>
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
    <Table ref="table" :height="tableHeight" ellipsis highlight-row border disabled-hover :columns="fileColumns" :data="fileList" @on-row-dblclick="openFolder">
      <template slot="name" slot-scope="{ row }">
        <Icon v-if="row.folder" type="ios-folder" />
        <span class="folder-name">{{ row.name }}</span>
      </template>
    </Table>
  </div>
</template>

<script>
import * as io from 'socket.io-client'
import config from '../constants/config'

export default {
  name: 'FileManager',
  data() {
    return {
      createType: '',
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
          className: 'file-size',
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
          width: 200
        },
        {
          title: '拥有者',
          key: 'owner',
          width: 100
        }],
      fileList: [],
      tableHeight: 450,
      filePath: []
    }
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.tableHeight = window.innerHeight - this.$refs.table.$el.offsetTop - 160
    })
    this.tableHeight = window.innerHeight - this.$refs.table.$el.offsetTop - 160
    this.socket = io.connect(`${config.url}:${config.port}`, {
      path: config.path,
      query: {
        host: '192.168.1.129',
        port: 22,
        username: 'root',
        password: '123456'
      }
    })
    this.socket.on('fileList', (fileList) => {
      this.fileList = fileList
    })
      .on('filePath', (data) => {
        this.filePath = data
      })
  },
  methods: {
    openFolder(row) {
      if (row.folder) {
        this.fileList = []
        this.filePath.push(row.name)
        this.socket.emit('openFolder', row.name)
      }
    },
    jumpFolder(index) {
      this.filePath = this.filePath.slice(0, index + 1)
      this.socket.emit('openFolder', this.filePath.join(''))
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
        border-right: none;
        &:hover {
          border-right: 1px solid #57a3f3;
        }
        &-focused {
          border-right: 1px solid #57a3f3;
        }
      }
    }
    .folder-refresh {
      border-radius: 0;
    }
  }
  .folder-breadcrumb {
    padding: 10px 5px;
  }
}
::v-deep .ivu-icon-ios-folder-open {
  font-size: 16px;
}

::v-deep .folder-bread-name {
  cursor: pointer;
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
  .file-size {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .ivu-icon {
    font-size: 16px;
  }
  .folder-name {
    padding: 0 5px;
  }
}

</style>
