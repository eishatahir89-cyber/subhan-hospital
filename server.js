import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper function to read/write JSON files
const getFilePath = (filename) => path.join(__dirname, 'data', filename);

const readData = async (filename) => {
    try {
        const data = await fs.readFile(getFilePath(filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
};

const writeData = async (filename, data) => {
    try {
        await fs.writeFile(getFilePath(filename), JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
    }
};

const generateId = (prefix) => `${prefix}-${Date.now()}`;

// === PATIENTS API === //

app.get('/patients', async (req, res) => {
    const patients = await readData('patients.json');
    res.json(patients);
});

app.get('/patients/:id', async (req, res) => {
    const patients = await readData('patients.json');
    const patient = patients.find(p => p.id === req.params.id);
    if (patient) res.json(patient);
    else res.status(404).json({ message: 'Patient not found' });
});

app.post('/patients', async (req, res) => {
    const patients = await readData('patients.json');
    const newPatient = { id: generateId('PAT'), ...req.body };
    patients.push(newPatient);
    await writeData('patients.json', patients);
    res.status(201).json(newPatient);
});

app.put('/patients/:id', async (req, res) => {
    let patients = await readData('patients.json');
    const index = patients.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        patients[index] = { ...patients[index], ...req.body };
        await writeData('patients.json', patients);
        res.json(patients[index]);
    } else {
        res.status(404).json({ message: 'Patient not found' });
    }
});

app.delete('/patients/:id', async (req, res) => {
    let patients = await readData('patients.json');
    patients = patients.filter(p => p.id !== req.params.id);
    await writeData('patients.json', patients);
    res.status(204).send();
});


// === DOCTORS API === //

app.get('/doctors', async (req, res) => {
    const doctors = await readData('doctors.json');
    res.json(doctors);
});

app.get('/doctors/:id', async (req, res) => {
    const doctors = await readData('doctors.json');
    const doctor = doctors.find(d => d.id === req.params.id);
    if (doctor) res.json(doctor);
    else res.status(404).json({ message: 'Doctor not found' });
});

app.post('/doctors', async (req, res) => {
    const doctors = await readData('doctors.json');
    const newDoctor = { id: generateId('DOC'), ...req.body };
    doctors.push(newDoctor);
    await writeData('doctors.json', doctors);
    res.status(201).json(newDoctor);
});

app.put('/doctors/:id', async (req, res) => {
    let doctors = await readData('doctors.json');
    const index = doctors.findIndex(d => d.id === req.params.id);
    if (index !== -1) {
        doctors[index] = { ...doctors[index], ...req.body };
        await writeData('doctors.json', doctors);
        res.json(doctors[index]);
    } else {
        res.status(404).json({ message: 'Doctor not found' });
    }
});

app.delete('/doctors/:id', async (req, res) => {
    let doctors = await readData('doctors.json');
    doctors = doctors.filter(d => d.id !== req.params.id);
    await writeData('doctors.json', doctors);
    res.status(204).send();
});


// === STAFF API === //

app.get('/staff', async (req, res) => {
    const staff = await readData('staff.json');
    res.json(staff);
});

app.get('/staff/:id', async (req, res) => {
    const staffList = await readData('staff.json');
    const staff = staffList.find(s => s.id === req.params.id);
    if (staff) res.json(staff);
    else res.status(404).json({ message: 'Staff not found' });
});

app.post('/staff', async (req, res) => {
    const staffList = await readData('staff.json');
    const newStaff = { id: generateId('STF'), ...req.body };
    staffList.push(newStaff);
    await writeData('staff.json', staffList);
    res.status(201).json(newStaff);
});

app.put('/staff/:id', async (req, res) => {
    let staffList = await readData('staff.json');
    const index = staffList.findIndex(s => s.id === req.params.id);
    if (index !== -1) {
        staffList[index] = { ...staffList[index], ...req.body };
        await writeData('staff.json', staffList);
        res.json(staffList[index]);
    } else {
        res.status(404).json({ message: 'Staff not found' });
    }
});

app.delete('/staff/:id', async (req, res) => {
    let staffList = await readData('staff.json');
    staffList = staffList.filter(s => s.id !== req.params.id);
    await writeData('staff.json', staffList);
    res.status(204).send();
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
