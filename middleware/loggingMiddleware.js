
// Middleware for handling exceptions inside of async express routes
function asyncHandler(handler) {
    return async (req, res, next) => {
        try {
            console.log(`Incoming request: ${req.method} ${req.path}`);
            console.log(req.body)

            // Create a reference to the original send method
            const originalSend = res.send.bind(res);

            // Override the send method to capture the response body
            res.send = (body) => {
                console.log('Responded:', body);  // Log the response body
                res.send = originalSend;  // Restore original send method
                return res.send(body);  // Send the response body
            };

            await handler(req, res, next);
        } catch (error) {
            console.error(`Error handling request ${req.method} ${req.path}: ${error.message}`);
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    };
}

module.exports = asyncHandler