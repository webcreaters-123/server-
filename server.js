const app = require('express')();
const http = require('http');

const httServer =  http.createServer(app);

module.exports = {expressApp:app, httServer:httServer }