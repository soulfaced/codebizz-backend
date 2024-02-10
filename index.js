// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(cors());

// Set up body-parser middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://padwekarsanchit:dUBNsiLzMAHudtq5@ac-7oecq9v-shard-00-00.rbnawca.mongodb.net:27017,ac-7oecq9v-shard-00-01.rbnawca.mongodb.net:27017,ac-7oecq9v-shard-00-02.rbnawca.mongodb.net:27017/?ssl=true&replicaSet=atlas-cdxk99-shard-0&authSource=admin&retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define schemas
const studentSchema = new mongoose.Schema({
    name: String,
    department: String,
    rollNumber: String,
    email: String,
    phoneNumber: String,
    clubs: [mongoose.Schema.Types.ObjectId]
});

const professorSchema = new mongoose.Schema({
    name: String,
    department: String,
    approvedEvents: [mongoose.Schema.Types.ObjectId],
    pendingApprovalEvents: [mongoose.Schema.Types.ObjectId],
    image: String,
});

const clubSchema = new mongoose.Schema({
    name: String,
    professorInCharge: String,
    numberOfStudents: Number,
    image: String,
});

const eventSchema = new mongoose.Schema({
    name: String,
    date: Date,
    time: String,
    venue: String,
    club: String,
    permissions: [mongoose.Schema.Types.ObjectId]
});

const permissionSchema = new mongoose.Schema({
    authority: String,
    date: Date,
    message: String,
    professor: mongoose.Schema.Types.ObjectId,
    permission1:{
        type:Boolean,
        default: false
    },
    permission2:{
        type:Boolean,
        default: false
    },
});

// Define models
const Student = mongoose.model('Student', studentSchema);
const Professor = mongoose.model('Professor', professorSchema);
const Club = mongoose.model('Club', clubSchema);
const Event = mongoose.model('Event', eventSchema);
const Permission = mongoose.model('Permission', permissionSchema);

// Define routes
app.post('/students', async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.status(201).send(student);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post('/professors', async (req, res) => {
    try {
        const professor = new Professor(req.body);
        await professor.save();
        res.status(201).send(professor);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post('/clubs', async (req, res) => {
    try {
        const club = new Club(req.body);
        await club.save();
        res.status(201).send(club);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.get('/all/clubs', async (req, res) => {
    try {
        const allData = await Club.find({}); // Use "Club" instead of "club"
        res.json({ data: allData });
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
});

app.get('/all/students', async (req, res) => {
    try {
        const allStudents = await Student.find({});
        res.json({ students: allStudents });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/all/professors', async (req, res) => {
    try {
        const allProfessors = await Professor.find({});
        res.json({ professors: allProfessors });
    } catch (error) {
        console.error("Error fetching professors:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/all/events', async (req, res) => {
    try {
        const allEvents = await Event.find({});
        res.json({ events: allEvents });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/all/permissions', async (req, res) => {
    try {
        const allPermissions = await Permission.find({});
        res.json({ permissions: allPermissions });
    } catch (error) {
        console.error("Error fetching permissions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/events', async (req, res) => {
    try {
        const clubName = req.body.clubName; // Assuming clubName is provided in the request body
        const club = await Club.findOne({ name: clubName });

        if (!club) {
            return res.status(404).send('Club not found');
        }

        // Create the event using the club's ObjectId
        const eventData = {
            ...req.body,
            club: club._id
        };
        const event = new Event(eventData);
        await event.save();
        res.status(201).send(event);
    } catch (error) {
        res.status(400).send(error);
    }
});


app.post('/permissions', async (req, res) => {
    try {
        const clubName = req.body.clubName;
        const eventName = req.body.eventName;
        const authority = req.body.authority;
        const date = req.body.date;
        const message = req.body.message;

        // Find the club by name
        const club = await Club.findOne({ name: clubName });
        if (!club) {
            return res.status(404).send('Club not found');
        }

        // Find the event by name
        const event = await Event.findOne({ name: eventName, club: club._id });
        if (!event) {
            return res.status(404).send('Event not found in this club');
        }

        // Create the permission
        const permissionData = {
            authority: authority,
            date: date,
            message: message,
            professor: club.professorInCharge // Assuming permission is granted by the club's professor in charge
        };
        const permission = new Permission(permissionData);
        await permission.save();

        // Update the event's permission list with the new permission ObjectId
        event.permissions.push(permission._id);
        await event.save();

        res.status(201).send(permission);
    } catch (error) {
        res.status(400).send(error);
    }
});


// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
