const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const containerRoutes = require('./routes/containerRoutes');
const driverRoutes = require('./routes/driverRoutes');
const chassisRoutes = require('./routes/chassisRoutes');
const yardRoutes = require('./routes/yardRoutes');

const envPath = fs.existsSync(path.join(__dirname, '..', '.env'))
  ? path.join(__dirname, '..', '.env')
  : path.join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 8080;
const mongoUri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ message: 'OK' }));

app.use('/api/auth', authRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/chassis', chassisRoutes);
app.use('/api/yards', yardRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

const start = async () => {
  if (!mongoUri) {
    console.error('MONGODB_URI is not set. Please configure it in your environment.');
    process.exit(1);
  }

  try {
    await connectDB(mongoUri);
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
};

start();
