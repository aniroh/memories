import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

dotenv.config()
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

  // app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose schemas (Media, Memory) – simple example:
const MediaSchema = new mongoose.Schema({
  key: String,
  original: String,
  preview: String,
  thumbnail: String,
  metadata: Object
});
const Media = mongoose.model('Media', MediaSchema);

const MemorySchema = new mongoose.Schema({
  title: String,
  happenedAt: Date,
  coverMedia: String,   // reference to a Media key or URL
  media: [String],      // list of Media keys
  tags: [String],
  description: String
});
const Memory = mongoose.model('Memory', MemorySchema);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// List memories (stub)
app.get('/api/memories', async (req, res) => {
  const memories = await Memory.find().limit(20);
  res.json(memories);
});

// Create memory (stub)
app.post('/api/memories', async (req, res) => {
  // In a real app, extract fields from req.body, validate, etc.
  const mem = new Memory(req.body);
  await mem.save();
  res.status(201).json(mem);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));