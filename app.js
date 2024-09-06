const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/job_board', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define schemas
const jobSchema = new mongoose.Schema({
    title: String,
    description: String,
    company: String,
    location: String,
    postedDate: { type: Date, default: Date.now },
});

const applicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    candidateName: String,
    resume: String,
    appliedDate: { type: Date, default: Date.now },
});

const Job = mongoose.model('Job', jobSchema);
const Application = mongoose.model('Application', applicationSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// File upload setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});

const upload = multer({ storage: storage });

// Route for home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to post a job
app.post('/job', async (req, res) => {
    const { title, description, company, location } = req.body;
    const job = new Job({ title, description, company, location });
    await job.save();
    res.send('Job posted successfully!');
});

// Route to get all jobs
app.get('/jobs', async (req, res) => {
    const jobs = await Job.find();
    res.json(jobs);
});

// Route to apply for a job
app.post('/apply', upload.single('resume'), async (req, res) => {
    const { jobId, candidateName } = req.body;
    const application = new Application({ jobId, candidateName, resume: req.file.path });
    await application.save();
    res.send('Application submitted successfully!');
});

// Route to get applications for a specific job
app.get('/applications/:jobId', async (req, res) => {
    const applications = await Application.find({ jobId: req.params.jobId });
    res.json(applications);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
