const db = require('../connection/db-connection');

// obtém todos os serviços de um cliente específico
async function getServicesByCustomerId(req, res) {
    const { customer_id } = req.params;

    if (!customer_id) {
        return res.status(400).send('Customer ID is required');
    }

    db.query('SELECT * FROM services WHERE customer_id = ?', [customer_id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (result.length === 0) {
            return res.status(404).send('No services found for this customer');
        }

        res.json(result);
    });
}

// Exclui um serviço específico
async function deleteServiceById(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send('Service ID is required');
    }

    db.query('DELETE FROM services WHERE id = ?', [id], (err, result) => {
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

module.exports = { getServicesByCustomerId, deleteServiceById };
