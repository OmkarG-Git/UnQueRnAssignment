const AppError = require("../utils/AppError");

let ioInstance = null;

module.exports = {
    setIo: (io) => {
        ioInstance = io

        io.engine.on('connection_error', (err) => {
            console.log('Socket connection error:', err.message);
            console.log('Error code:', err.code);
        });
    },

    getIo: () => {
        if(!ioInstance) {
            throw new AppError('Socket.IO instance not initialized')
        }

        return ioInstance;
    }
}