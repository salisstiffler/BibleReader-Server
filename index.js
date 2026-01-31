require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Holy Server running on http://localhost:${PORT}`);
});
