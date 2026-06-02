const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ================= GET LOST ITEMS =================

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                lost_reports.lost_id,
                lost_reports.date_lost,
                lost_reports.location_lost,
                lost_reports.status,
                items.item_name,
                items.category,
                items.color,
                users.name AS reporter_name
            FROM lost_reports
            JOIN items ON lost_reports.item_id = items.item_id
            LEFT JOIN users ON lost_reports.user_id = users.user_id
            ORDER BY lost_reports.lost_id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch lost items" });
    }
});

// ================= ADD LOST ITEM =================

router.post("/", async (req, res) => {
    try {
        const { itemName, description, category, color, dateLost, locationLost, userId } = req.body;

        const [itemResult] = await db.query(
            `INSERT INTO items (item_name, description, category, color) VALUES (?, ?, ?, ?)`,
            [itemName, description, category, color]
        );

        const itemId = itemResult.insertId;

        await db.query(
            `INSERT INTO lost_reports (user_id, item_id, date_lost, location_lost, status)
             VALUES (?, ?, ?, ?, 'Pending')`,
            [userId || null, itemId, dateLost, locationLost]
        );

        res.json({ message: "Lost item reported successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.sqlMessage || "Failed to add lost item" });
    }
});

// ================= DELETE LOST REPORT =================

router.delete("/:id", async (req, res) => {
    try {
        const [report] = await db.query("SELECT item_id FROM lost_reports WHERE lost_id = ?", [req.params.id]);
        if (report.length) {
            await db.query("DELETE FROM lost_reports WHERE lost_id = ?", [req.params.id]);
            await db.query("DELETE FROM items WHERE item_id = ?", [report[0].item_id]);
        }
        res.json({ message: "Lost report deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete lost report" });
    }
});

module.exports = router;
