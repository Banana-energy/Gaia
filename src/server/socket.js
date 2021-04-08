const dayjs = require('dayjs')
const config = require('./config')

const SSH = require('ssh2').Client

module.exports = function(socket) {
  if (!socket.handshake.query) {
    socket.emit('ssherror', '401 UNAUTHORIZED')
    console.log('SOCKET: No Query / REJECTED')
    socket.disconnect(true)
    return
  }
  const { host, port = 22, username, password } = socket.handshake.query
  let termCols, termRows
  const ssh = new SSH()
  socket.on('geometry', (cols, rows) => {
    termCols = cols
    termRows = rows
  })
  ssh.on('ready', () => {
    socket.emit('footer', `ssh://${username}@${host}:${port}`)
    socket.emit('status', 'SSH CONNECTION ESTABLISHED')
    ssh.sftp((error, sftp) => {
      if (error) {
        SSHError('SFTP ERROR' + error)
      }
      ssh.exec('pwd', (error, stream) => {
        if (error) {
          console.error(error)
          SSHError('EXEC ERROR' + error)
          ssh.end()
          return
        }
        stream.on('data', (data) => {
          sftp.readdir(data.toString().trim(), sftpCallback)
          const path = []
          data.toString().trim().split('/').map((item) => {
            if (item === '') {
              path.push('/')
            } else {
              path.push(item)
            }
          })
          socket.emit('filePath', path)
        })
      })
      socket.on('openFolder', (data) => {
        sftp.readdir(data.toString().trim(), sftpCallback)
      })
    })
    ssh.shell({
      term: config.term,
      cols: termCols,
      rows: termRows
    }, (error, stream) => {
      if (error) {
        console.error(error)
        SSHError('EXEC ERROR' + error)
        ssh.end()
        return
      }
      socket.on('data', (data) => {
        stream.write(data)
      })
        .on('resize', (data) => {
          stream.setWindow(data.rows, data.cols)
        })
        .on('disconnecting', (reason) => {
          console.log('SOCKET DISCONNECTING: ' + reason)
        })
        .on('disconnect', (reason) => {
          console.log('SOCKET DISCONNECTING: ' + reason)
          const err = { message: reason }
          SSHError('CLIENT SOCKET DISCONNECT', err)
          ssh.end()
        })
        .on('error', (error) => {
          console.log('SOCKET DISCONNECTING: ' + error)
          SSHError('SOCKET ERROR', error)
          ssh.end()
        })
        .on('memory', () => {
          ssh.exec('cat /proc/meminfo', (error, stream) => {
            if (error) {
              console.error(error)
              SSHError('EXEC ERROR' + error)
              ssh.end()
              return
            }
            stream.on('data', (data) => {
              const aData = data.toString().split('\n')
              const reg = /[0-9]/g
              let totalMemory = parseInt(aData[0].match(reg).join(''))
              let freeMemory = parseInt(aData[1].match(reg).join(''))
              let usedMemory = totalMemory - freeMemory
              totalMemory = unitTransfer(totalMemory)
              freeMemory = unitTransfer(freeMemory)
              usedMemory = unitTransfer(usedMemory)
              // TODO 单位
              socket.emit('memory', { usedMemory, totalMemory, freeMemory })
            })
          })
        })
        .on('cpu', () => {
          ssh.exec('cat /proc/stat', (error, stream) => {
            if (error) {
              console.error(error)
              SSHError('EXEC ERROR' + error)
              ssh.end()
              return
            }
            stream.on('data', (data) => {
              const aData = data.toString()
                .split('\n')[0]
                .split(' ')
                .filter((item) => {
                  return !!item
                })
              const total = aData.reduce((total, item, index) => {
                if (index !== 0 && index !== 8 && index !== 9) {
                  return total + +item
                }
                return total
              }, 0)
              const used = aData.reduce((total, item, index) => {
                if (index !== 0 && index !== 8 && index !== 9 && index !== 5 && index !== 4) {
                  return total + +item
                }
                return total
              }, 0)
              const free = total - used
              const reg = /^cpu\d/
              const totalCpu = data.toString()
                .split('\n')
                .filter((item) => {
                  return reg.test(item)
                }).length
              socket.emit('cpu', { used, totalCpu, free })
            })
          })
        })
      stream.on('data', (data) => {
        socket.emit('data', data.toString())
      })
        .on('close', () => {
          socket.disconnect(true)
          ssh.end()
        })
    })
  })
    .on('end', (error) => {
      SSHError('CONN END BY HOST', error)
    })
    .on('close', (error) => {
      SSHError('CONN CLOSE', error)
    })
    .on('error', (error) => {
      SSHError('CONN ERROR', error)
    })
  if (username && password && host) {
    ssh.connect({
      host,
      port,
      username,
      password,
      readyTimeout: config.readyTimeout,
      keepaliveInterval: config.keepaliveInterval,
      keepaliveCountMax: config.keepaliveCountMax
    })
  } else {
    console.error('Attempt to connect without username/password' + ' ' + JSON.stringify(socket.handshake))
    socket.emit('ssherror', 'Attempt to connect without username/password')
    socket.disconnect(true)
    ssh.end()
  }

  function SSHError(reason, error) {
    let err
    if (error) {
      err = error ? ': ' + error.message : ''
    }
    socket.emit('ssherror', 'SSH' + reason + err)
    socket.disconnect(true)
  }

  function unitTransfer(size) {
    if (size >= 1024 * 1024 * 10) {
      size = size / (1024 * 1024)
    } else {
      size = size / 1024
    }
    return Math.round(size)
  }

  function sftpCallback(error, list) {
    if (error) {
      SSHError('SFTP ERROR' + error)
    }
    const fileList = []
    list.map((item) => {
      const attr = item.longname.split(' ').filter((item) => !!item)
      const reg = /^d/g
      const folder = reg.test(attr[0])
      const file = {
        folder,
        name: item.filename,
        size: folder ? '' : item.attrs.size + ' b',
        time: dayjs.unix(item.attrs.mtime).format('YYYY/D/M HH:mm:ss'),
        authority: attr[0],
        owner: attr[2]
      }
      fileList.push(file)
    })
    socket.emit('fileList', fileList.sort((a, b) => {
      if (b.folder === a.folder) {
        return a.name.localeCompare(b.name, 'en')
      }
      return b.folder - a.folder
    }))
  }
}
