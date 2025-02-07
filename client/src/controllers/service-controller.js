const db = require('../db/db-connection');

// Service controller functions:
async function getServicesByCustomerId(req, res) {
    const { customer_id } = req.params;

    if (!customer_id) {
        return res.status(400).send('Customer ID is required');
    }

    const query = `
        SELECT s.*, c.category_name, sp.user_id AS provider_user_id, u.name AS provider_name, u.phone AS provider_phone
        FROM solicitation s
        LEFT JOIN category c ON s.category_id = c.id
        LEFT JOIN service_provider sp ON s.service_provider_id = sp.id
        LEFT JOIN user u ON sp.user_id = u.id
        WHERE s.customer_id = ?
    `;

    db.query(query, [customer_id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }
        res.json(result);
    });
}

async function cancelServiceById(req, res) {
    const { id } = req.params;

    db.query('UPDATE solicitation SET status = ?, appointment_status = ? WHERE id = ?', ['Cancelled', true, id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Service request not found.' });
        }

        res.json({ success: true, message: 'Service successfully cancelled!' });
    });
}

async function completeServiceById(req, res) {
    const { id } = req.params;

    db.query('UPDATE solicitation SET status = ? WHERE id = ?', ['Completed', id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }
        res.send('Service successfully completed');
    });
}

async function submitSolicitation(req, res) {
    const { category, state, city, service_title, description, date, period, customer_id } = req.body;

    const categoryMap = {
        'Electrician': 1,
        'Painter': 2,
        'Cleaner': 3,
        'Locksmith': 4,
        'Bricklayer': 5,
        'Photographer': 6
    };

    const category_id = categoryMap[category];

    if (!customer_id || !category_id || !state || !city || !date || !service_title || !description || !period) {
        return res.status(400).json({ success: false, message: 'Insufficient data to create a request.' });
    }

    const checkCustomerQuery = 'SELECT id FROM customer WHERE user_id = ?';
    db.query(checkCustomerQuery, [customer_id], (err, results) => {
        if (err) {
            console.error('Error checking customer:', err);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Customer not found.' });
        }

        const insertQuery = `
            INSERT INTO solicitation (
                service_provider_id, customer_id, service_date, category_id,
                title, service_description, appointment_status, status, day_shift
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertQuery,
            [
                null, // service_provider_id
                results[0].id,
                date,
                category_id,
                service_title,
                description,
                false, // appointment_status
                'Searching', // status
                period
            ],
            (err, insertResults) => {
                if (err) {
                    console.error('Error inserting request:', err);
                    return res.status(500).json({ success: false, message: 'Error inserting request.' });
                }
                res.json({ success: true, message: 'Request successfully inserted!' });
            }
        );
    });
}

async function updateServiceStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Searching', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    db.query('UPDATE solicitation SET status = ? WHERE id = ?', [status, id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        res.json({ success: true, message: 'Status updated successfully!' });
    });
}

async function deleteServiceById(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send('Service ID is required');
    }

    db.query('DELETE FROM solicitation WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Service not found');
        }

        res.send('Service deleted successfully');
    });
}

module.exports = {
    getServicesByCustomerId,
    cancelServiceById,
    completeServiceById,
    submitSolicitation,
    updateServiceStatus,
    deleteServiceById
};
