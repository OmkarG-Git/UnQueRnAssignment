const errorMiddleware = (err, req, res, next) => {
    console.log("check my error", err.message)
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message:  statusCode === 500
                ? 'Internal server error'
                : err.message,
    });
}

module.exports = errorMiddleware;