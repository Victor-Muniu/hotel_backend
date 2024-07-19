const bcrypt = require('bcrypt');
const Staff = require('../models/staff');

const authorizePaymentVoucher = async (req, res, next) => {
    const { password, staffId } = req.body;

    try {
        const staff = await Staff.findById(staffId);

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const authorizedRoles = ['super admin', 'CEO', 'general manager'];

        if (!authorizedRoles.includes(staff.role)) {
            return res.status(403).json({ message: 'You do not have the required role to authorize this payment voucher' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, staff.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = authorizePaymentVoucher;
