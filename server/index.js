const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', require('./routes/master'));
app.use('/api/student', require('./routes/student'));
app.use('/api/principal', require('./routes/principal'));
app.use('/api/exam-officer', require('./routes/examOfficer'));
app.use('/api/payment', require('./routes/payment'));

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
