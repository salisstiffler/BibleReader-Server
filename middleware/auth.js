const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
