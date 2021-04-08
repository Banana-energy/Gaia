<template>
  <Modal :value="propertyActive" :mask-closable="false" width="500" @on-visible-change="close">`
    <p slot="header">
      <span>{{ row.name ? `${row.name}属性` : '新建会话' }}</span>
    </p>
    <div class="connect-header">
      <div class="connect-container">
        <div class="connect-container-tree">
          <Tree :data="titles" />
        </div>
        <Form v-show="titles[0].selected" ref="property" :model="property" :rules="rules" :label-width="80">
          <FormItem label="名称">
            <Input v-model="property.name" />
          </FormItem>
          <FormItem prop="host" label="主机">
            <Input v-model="property.host" />
          </FormItem>
          <FormItem label="协议">
            <Select v-model="property.agreement">
              <Option value="1">SSH</Option>
            </Select>
          </FormItem>
          <FormItem label="端口号">
            <Input v-model="property.port" type="number" />
          </FormItem>
          <FormItem label="说明">
            <Input v-model="property.desc" type="textarea" />
          </FormItem>
        </Form>
        <Form v-show="titles[0].children[0].selected" ref="identity" :model="property" :rules="rules" :label-width="80">
          <FormItem label="方法">
            <Select v-model="property.method">
              <Option value="1">Password</Option>
              <Option value="2">Public Key</Option>
            </Select>
          </FormItem>
          <FormItem prop="username" label="用户名">
            <Input v-model="property.username" :disabled="!isPassword" />
          </FormItem>
          <FormItem prop="password" label="密码">
            <Input v-model="property.password" type="password" password :disabled="!isPassword" />
          </FormItem>
          <FormItem label="公钥">
            <Input v-model="property.publicKey" :disabled="isPassword" />
          </FormItem>
        </Form>
      </div>
    </div>
    <div slot="footer">
      <Button type="primary" @click="submit">确定</Button>
      <Button @click="close(false)">取消</Button>
    </div>
  </Modal>
</template>

<script>

export default {
  name: 'NewConnect',
  props: {
    propertyActive: {
      type: Boolean,
      default: false
    },
    row: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      isPassword: true,
      rules: {
        host: [{
          required: true,
          message: '请输入主机名',
          trigger: 'blur'
        }],
        username: [{
          required: true,
          message: '请输入用户名',
          trigger: 'blur'
        }],
        password: [{
          required: true,
          message: '请输入密码',
          trigger: 'blur'
        }]
      },
      property: {
        name: '',
        host: '',
        agreement: '1',
        port: 22,
        desc: '',
        method: '1',
        username: '',
        password: '',
        publicKey: ''
      },
      titles: [{
        title: '连接',
        expand: true,
        selected: true,
        children: [{
          title: '用户身份验证',
          selected: false
        }]
      }]
    }
  },
  watch: {
    'property.agreement': function(val) {
      switch (val) {
        case '1':
          this.property.port = 22
          break
      }
    },
    'property.method': function(val) {
      switch (val) {
        case '1':
          this.rules.username[0].required = this.rules.password[0].required = this.isPassword = true
          break
        case '2':
          this.rules.username[0].required = this.rules.password[0].required = this.isPassword = false
          break
      }
    },
    row: function(val) {
      this.property = val
    }
    // titles: function(val, oldVal) {
    //   if (!val[0].children.selected) {
    //     this.$refs['property'].validate((valid) => {
    //       if (!valid) {
    //         this.$Message.error('Fail!')
    //         this.titles = oldVal
    //       }
    //     })
    //   }
    // }
  },
  methods: {
    close(state) {
      if (state === false) { this.$emit('update:property-active', false) }
    },
    submit() {
      if (this.titles[0].selected) {
        this.$refs['property'].validate((valid) => {
          if (valid) {
            if (!this.property.name) { this.property.name = this.property.host }
            this.$setItem(`mxb-${this.property.name}`, JSON.stringify(this.property))
            this.$emit('update:property-active', false)
          } else {
            this.$Message.error('请输入主机名!')
          }
        })
      } else if (this.titles[0].children[0].selected) {
        this.$refs['identity'].validate((valid) => {
          if (valid) {
            if (this.property.host) {
              if (!this.property.name) { this.property.name = `${this.property.host}@${this.property.username}` }
              this.$setItem(`mxb-${this.property.host}`, JSON.stringify(this.property))
              this.$emit('update:property-active', false)
            } else {
              this.$Message.error('请输入主机名!')
            }
          }
        })
      }
    }
  }
}
</script>

<style scoped>
.connect-header {
  margin-bottom: 10px;
}

.connect-container {
  display: flex;
  justify-content: space-evenly;
}

.connect-container-tree {
  padding: 5px 10px;
  height: 310px;
  border: 1px solid #d4d4d4;
}
</style>
