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

// Define api router
const apiRouter = express.Router();

// Generic helper to create CRUD endpoints for a module
const registerCrud = (router, routeName, filename, idPrefix) => {
    // GET all
    router.get(`/${routeName}`, async (req, res) => {
        const data = await readData(filename);
        res.json(data);
    });

    // GET single
    router.get(`/${routeName}/:id`, async (req, res) => {
        const data = await readData(filename);
        const item = data.find(i => i.id === req.params.id);
        if (item) res.json(item);
        else res.status(404).json({ message: `${routeName} not found` });
    });

    // POST create
    router.post(`/${routeName}`, async (req, res) => {
        const data = await readData(filename);
        const newId = generateId(idPrefix);
        const newItem = { id: newId, ...req.body };

        // Auto-populate ID fields in body if needed (e.g. patientId, doctorId, etc.)
        if (routeName === 'patients') newItem.patientId = newId;
        else if (routeName === 'doctors') newItem.doctorId = newId;
        else if (routeName === 'staff') newItem.staffId = newId;

        data.push(newItem);
        await writeData(filename, data);
        res.status(201).json(newItem);
    });

    // PUT update
    router.put(`/${routeName}/:id`, async (req, res) => {
        let data = await readData(filename);
        const index = data.findIndex(i => i.id === req.params.id);
        if (index !== -1) {
            data[index] = { ...data[index], ...req.body };
            await writeData(filename, data);
            res.json(data[index]);
        } else {
            res.status(404).json({ message: `${routeName} not found` });
        }
    });

    // DELETE
    router.delete(`/${routeName}/:id`, async (req, res) => {
        let data = await readData(filename);
        data = data.filter(i => i.id !== req.params.id);
        await writeData(filename, data);
        res.status(204).send();
    });
};

// Register CRUD routes for all modules
registerCrud(apiRouter, 'patients', 'patients.json', 'PAT');
registerCrud(apiRouter, 'doctors', 'doctors.json', 'DOC');
registerCrud(apiRouter, 'appointments', 'appointments.json', 'APT');
registerCrud(apiRouter, 'staff', 'staff.json', 'STF');
registerCrud(apiRouter, 'prescriptions', 'prescriptions.json', 'PRE');
registerCrud(apiRouter, 'medical-history', 'medical-history.json', 'MED');
registerCrud(apiRouter, 'inventory', 'inventory.json', 'INV');
registerCrud(apiRouter, 'billing', 'billing.json', 'BIL');

// Mount router on both /api and / routes to support direct frontend calls and base proxy calls
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Serve main entry page at root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
