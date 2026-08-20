const db = require("../config/db");

const createMessage = (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "Semua field (name, email, message) wajib diisi",
        });
    }

    const query = "INSERT INTO messages (name, email, message) VALUES (?, ?, ?)";
    console.log(query)
    

    db.query(query, [name, email, message], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Gagal menyimpan pesan",
                error: err.message,
            });
        }

        res.status(201).json({
            success: true,
            message: "Pesan berhasil dikirim!",
            data: {
                id: result.insertId,
                name,
                email,
                message,
            },
        });
    });
};

module.exports = {
    createMessage,
};