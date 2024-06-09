// loggingMiddleware.js

function loggingMiddleware(req, res, next) {
    // Log the incoming request details
    console.log(`Incoming request: ${req.method} ${req.path}`);
    if (Object.keys(req.body).length !== 0) {
        console.log('Request body:', req.body);
    }

    // Reference to the original send method
    const originalSend = res.send.bind(res);

    // Override the send method to capture and log the response body
    res.send = (body) => {
        console.log('Responded with:', body);  // Log the response body
        res.send = originalSend;  // Restore the original send method
        return res.send(body);  // Send the response body
    };

    // Proceed to the next middleware or route handler
    next();
}

module.exports = loggingMiddleware;
