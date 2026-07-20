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

// Generic helper to create CRUD endpoints for a module with full pagination & filtering
const registerCrud = (router, routeName, filename, idPrefix) => {
    // GET all with pagination, search, and filtering
    router.get(`/${routeName}`, async (req, res) => {
        let data = await readData(filename);

        // Apply generic search (q parameter)
        const q = req.query.q ? req.query.q.toLowerCase() : null;
        if (q) {
            data = data.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(q)
                )
            );
        }

        // Apply field-specific filters (any query param that matches a data field)
        const reserved = ['_page', '_limit', 'q', '_sort', '_order'];
        Object.entries(req.query).forEach(([key, val]) => {
            if (!reserved.includes(key) && val) {
                data = data.filter(item =>
                    String(item[key] || '').toLowerCase() === val.toLowerCase()
                );
            }
        });

        // Sort
        const sortField = req.query._sort;
        const sortOrder = req.query._order === 'asc' ? 1 : -1;
        if (sortField) {
            data.sort((a, b) => {
                if (a[sortField] < b[sortField]) return -1 * sortOrder;
                if (a[sortField] > b[sortField]) return 1 * sortOrder;
                return 0;
            });
        }

        const total = data.length;

        // Pagination
        const page = parseInt(req.query._page) || 1;
        const limit = parseInt(req.query._limit) || total;
        const start = (page - 1) * limit;
        const end = start + limit;
        const paged = data.slice(start, end);

        res.set('X-Total-Count', String(total));
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        res.json(paged);
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
        const newItem = { id: newId, ...req.body, createdAt: new Date().toISOString() };

        // Auto-populate ID fields in body
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
            data[index] = { ...data[index], ...req.body, updatedAt: new Date().toISOString() };
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

// ==========================================
// REPORTS AGGREGATE ENDPOINT
// ==========================================
apiRouter.get('/reports', async (req, res) => {
    try {
        const [patients, doctors, staff, appointments, prescriptions, medicalHistory, inventory, billing] = await Promise.all([
            readData('patients.json'),
            readData('doctors.json'),
            readData('staff.json'),
            readData('appointments.json'),
            readData('prescriptions.json'),
            readData('medical-history.json'),
            readData('inventory.json'),
            readData('billing.json')
        ]);

        // Billing stats
        const totalRevenue = billing.filter(b => b.paymentStatus === 'Paid')
            .reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
        const pendingAmount = billing.filter(b => b.paymentStatus === 'Pending')
            .reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);
        const unpaidAmount = billing.filter(b => b.paymentStatus === 'Unpaid')
            .reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);

        // Appointment stats
        const appointmentsByStatus = {
            Scheduled: appointments.filter(a => a.status === 'Scheduled').length,
            Completed: appointments.filter(a => a.status === 'Completed').length,
            Cancelled: appointments.filter(a => a.status === 'Cancelled').length
        };

        // Doctor department breakdown
        const deptCounts = {};
        doctors.forEach(d => {
            deptCounts[d.department] = (deptCounts[d.department] || 0) + 1;
        });

        // Patient gender breakdown
        const genderCounts = {
            Male: patients.filter(p => p.gender === 'Male').length,
            Female: patients.filter(p => p.gender === 'Female').length,
            Other: patients.filter(p => p.gender === 'Other').length
        };

        // Inventory status
        const inventoryByStatus = {
            inStock: inventory.filter(i => parseInt(i.quantity) >= 10).length,
            lowStock: inventory.filter(i => parseInt(i.quantity) > 0 && parseInt(i.quantity) < 10).length,
            outOfStock: inventory.filter(i => parseInt(i.quantity) <= 0).length
        };

        // Staff by department
        const staffByDept = {};
        staff.forEach(s => {
            staffByDept[s.department] = (staffByDept[s.department] || 0) + 1;
        });

        res.json({
            summary: {
                totalPatients: patients.length,
                admittedPatients: patients.filter(p => p.status === 'Admitted').length,
                dischargedPatients: patients.filter(p => p.status === 'Discharged').length,
                totalDoctors: doctors.length,
                activeDoctors: doctors.filter(d => d.status === 'Active').length,
                totalStaff: staff.length,
                totalAppointments: appointments.length,
                totalPrescriptions: prescriptions.length,
                totalInventoryItems: inventory.length,
                totalBillingRecords: billing.length
            },
            financials: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                pendingAmount: parseFloat(pendingAmount.toFixed(2)),
                unpaidAmount: parseFloat(unpaidAmount.toFixed(2)),
                totalBilled: parseFloat((totalRevenue + pendingAmount + unpaidAmount).toFixed(2))
            },
            appointments: appointmentsByStatus,
            departments: deptCounts,
            patients: genderCounts,
            inventory: inventoryByStatus,
            staffByDept
        });
    } catch (err) {
        console.error('Reports error:', err);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Mount router
app.use('/api', apiRouter);

// Serve main entry page at root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// 404 handler
app.use((req, res) => {
    if (req.accepts('html')) {
        res.status(404).sendFile(path.join(__dirname, '404.html'));
    } else {
        res.status(404).json({ message: 'Not Found' });
    }
});

app.listen(PORT, () => {
    console.log(`Subhan Hospital Backend running on http://localhost:${PORT}`);
});
