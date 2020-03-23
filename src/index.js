#!/usr/bin/env node

'use strict';

const net = require('net');
const path = require('path');
const process = require('process');

const server = net.createServer((c) => {
  // 'connection' listener
  console.log('client connected');
  
  c.on('data', function (data) {
    console.log('data: ', data)
  });

  c.on('end', () => {
    console.log('end, client disconnected');
    process.exit(0);
  });

  c.on('close', () => {
    console.log('close, client disconnected');
    process.exit(0);
  });

  c.on('error', error => {
    console.log('error, client disconnected', error);
    process.exit(0);
  });
});

server.on('error', (err) => {
  throw err;
});

const args = process.argv.slice(2);
const pipeName = args[0];
const pipePath = path.join('\\\\.\\pipe\\', 'chrome.' + pipeName);

server.listen(pipePath, () => {
  console.log('server bound');
});