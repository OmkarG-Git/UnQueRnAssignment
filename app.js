require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors')
const errorMiddleware = require('./middleware/error.middleware');
const leadRoute = require('./routes/lead.routes');
const webHook = require('./routes/metaWebhook.routes');
const { Server } = require('socket.io');
const { setIo } = require('./socketConnection/socketInstance');

app.use(cors({
    origin:['http://localhost:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:8081'],
        methods: ["GET", "POST"],
        credentials: true
    },

    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
       maxDisconnectionDuration: 2 * 60 * 1000,
       skipMiddlewares: true,
    },
    allowEIO3: true,
});

setIo(io);

app.use('/api/webhook/leads', express.json({
    verify: (req, res, buffer) => {
        req.rawBody = Buffer.from(buffer);
    }
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.use('/api/leads', leadRoute);
app.use('/api/webhook/leads', webHook);

app.use(errorMiddleware);

module.exports = server;