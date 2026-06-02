const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ================= GET USERS =================

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM users ORDER BY user_id DESC");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ================= ADD USER =================

router.post("/", async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        await db.query(
            `INSERT INTO users (name, email, phone, address) VALUES (?, ?, ?, ?)`,
            [name, email, phone, address]
        );
        res.json({ message: "User added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.sqlMessage || "Failed to add user" });
    }
});

// ================= DELETE USER =================

router.delete("/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE user_id = ?", [req.params.id]);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

module.exports = router;
