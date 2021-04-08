const config = require('./config')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, { path: '/ssh/socket.io' })
const socket = require('./socket')

server.listen(config.port)

console.log('start success')

io.on('connection', socket)
