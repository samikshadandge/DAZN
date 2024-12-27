const express = require('express');
const Movie = require('../models/Movie');
const NodeCache = require('node-cache');

const movieCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const router = express.Router();

// Middleware for admin role check (for POST, PUT, DELETE)
const adminMiddleware = (req, res, next) => {
  const userRole = req.headers['role']; // Assuming role is passed in headers for simplicity
  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// List all movies
router.get('/', async (req, res) => {
  const cacheKey = 'moviesList';
  const cachedMovies = movieCache.get(cacheKey);

  if (cachedMovies) {
    return res.json(cachedMovies);
  }

  try {
    const movies = await Movie.find();
    movieCache.set(cacheKey, movies);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching movies', error: err });
  }
});

// Search for movies by title or genre
router.get('/search', async (req, res) => {
  const query = req.query.q || '';
  try {
    const movies = await Movie.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { genre: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Error searching movies', error: err });
  }
});

// Add a new movie (admin only)
router.post('/', adminMiddleware, async (req, res) => {
  const { title, genre, rating, streamingLink } = req.body;

  try {
    const newMovie = new Movie({ title, genre, rating, streamingLink });
    await newMovie.save();
    res.status(201).json(newMovie);
  } catch (err) {
    res.status(500).json({ message: 'Error adding movie', error: err });
  }
});

// Update an existing movie (admin only)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { title, genre, rating, streamingLink } = req.body;
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      { title, genre, rating, streamingLink },
      { new: true }
    );
    if (!updatedMovie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(updatedMovie);
  } catch (err) {
    res.status(500).json({ message: 'Error updating movie', error: err });
  }
});

// Delete a movie (admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    if (!deletedMovie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting movie', error: err });
  }
});

module.exports = router;
