const express = require('express');
const mongoose = require('mongoose');
const movieRoutes = require('./routes/movieRoutes');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/movielobby', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Use routes
app.use('/movies', movieRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
