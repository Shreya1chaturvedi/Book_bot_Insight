const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const dbURI = 'mongodb://localhost:27017/bookbot';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Schema and Model
const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, default: null },
    pdfPath: { type: String, default: null },
}, { timestamps: true });

const Question = mongoose.model('Question', QuestionSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const fileExt = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;
        if (fileExt !== '.pdf' || mimeType !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'), false);
        }
        cb(null, true);
    },
});

// Routes
app.get('/', (req, res) => res.send('Welcome to BookBot API!'));

// Add a new question
app.post('/questions', async (req, res) => {
    try {
        const newQuestion = await Question.create({ question: req.body.question });
        res.status(201).json(newQuestion);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch all questions
app.get('/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.status(200).json(questions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a question with an answer
app.put('/questions/:id', async (req, res) => {
    try {
        const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, { answer: req.body.answer }, { new: true });
        if (!updatedQuestion) return res.status(404).json({ error: 'Question not found' });
        res.status(200).json(updatedQuestion);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload a PDF and associate it with a question
app.post('/questions/:id/upload', upload.single('pdf'), async (req, res) => {
    try {
        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            { pdfPath: `/uploads/${req.file.filename}` },
            { new: true }
        );
        if (!updatedQuestion) return res.status(404).json({ error: 'Question not found' });
        res.status(200).json(updatedQuestion);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
