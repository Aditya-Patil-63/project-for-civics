const fs = require('fs');
const path = require('path');
const { mysqlPool } = require('./config/db');

const departments = [
    { name: 'Public Works Dept', head: 'R. Kumar', contact: 'pwd-contact@city.gov.in', staff: 14, budget: '₹52L' },
    { name: 'Sanitation', head: 'Sunita S.', contact: 'sanitation@city.gov.in', staff: 28, budget: '₹38.5L' },
    { name: 'Water Board', head: 'Amit Singh', contact: 'water.dept@city.gov.in', staff: 17, budget: '₹42L' },
    { name: 'Electricity Board', head: 'V. Malhotra', contact: 'power@city.gov.in', staff: 16, budget: '₹65L' }
];

const workers = [
    { name: 'R. Gupta', role: 'Field Supervisor', department: 'Public Works', status: 'Active', phone: '+91 98231 76542' },
    { name: 'Suresh P.', role: 'Technician', department: 'Electricity', status: 'Busy', phone: '+91 99887 22331' },
    { name: 'Mahesh Kumar', role: 'Cleaner', department: 'Sanitation', status: 'Offline', phone: '+91 98761 11029' },
    { name: 'Deepak Singh', role: 'Plumber', department: 'Water Board', status: 'Active', phone: '+91 88776 54321' },
    { name: 'Vijay Verma', role: 'Electrician', department: 'Electricity', status: 'Active', phone: '+91 91234 56780' },
    { name: 'Anil Yadav', role: 'Driver', department: 'Sanitation', status: 'Busy', phone: '+91 90001 20002' },
    { name: 'Rajendra P.', role: 'Mason', department: 'Public Works', status: 'Active', phone: '+91 98798 76543' },
    { name: 'Sanjay M.', role: 'Lineman', department: 'Electricity', status: 'Offline', phone: '+91 95544 33221' },
    { name: 'Prakash Sharma', role: 'Pipe Fitter', department: 'Water Board', status: 'Busy', phone: '+91 96655 44332' },
    { name: 'Mohan Lal', role: 'Sweeper', department: 'Sanitation', status: 'Active', phone: '+91 97766 55443' },
    { name: 'A. Tiwari', role: 'Road Inspector', department: 'Public Works', status: 'Active', phone: '+91 98877 66554' },
    { name: 'Kishan Joshi', role: 'Meter Reader', department: 'Water Board', status: 'Busy', phone: '+91 99988 77766' }
];

async function seed() {
    try {
        console.log('Connecting to MySQL and executing schema...');
        const schema = fs.readFileSync(path.join(__dirname, 'config', 'mysql_schema.sql'), 'utf-8');
        const queries = schema.split(';').filter(q => q.trim());
        for (const query of queries) {
            await mysqlPool.query(query);
        }
        
        console.log('Clearing old data...');
        await mysqlPool.query('TRUNCATE TABLE departments');
        await mysqlPool.query('TRUNCATE TABLE workers');

        console.log('Inserting departments...');
        for (const d of departments) {
            await mysqlPool.execute(
                'INSERT INTO departments (name, head, contact, staff, budget) VALUES (?, ?, ?, ?, ?)',
                [d.name, d.head, d.contact, d.staff, d.budget]
            );
        }

        console.log('Inserting workers...');
        for (const w of workers) {
            await mysqlPool.execute(
                'INSERT INTO workers (name, role, department, status, phone) VALUES (?, ?, ?, ?, ?)',
                [w.name, w.role, w.department, w.status, w.phone]
            );
        }

        console.log('Seeding complete!');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        process.exit();
    }
}

seed();
