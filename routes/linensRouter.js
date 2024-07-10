const express = require('express');
const router = express.Router();
const Linens = require('../house_keeping/ready')


router.get('/linens',async (req, res) => {
    try {
        const linens = await Linens.find();
        res.json(linens);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

router.patch('/linens/:id', async(req, res)=>{
    const id = req.params.id;
    try {
        const updatedLinen = await Linens.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedLinen);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})

module.exports = router;