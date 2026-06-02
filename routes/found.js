const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ================= GET FOUND ITEMS =================

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                found_reports.found_id,
                found_reports.date_found,
                found_reports.location_found,
                found_reports.status,
                items.item_name,
                items.category,
                items.color,
                items.description,
                users.name AS finder_name
            FROM found_reports
            JOIN items ON found_reports.item_id = items.item_id
            LEFT JOIN users ON found_reports.user_id = users.user_id
            ORDER BY found_reports.found_id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch found items" });
    }
});

// ================= ADD FOUND ITEM =================

router.post("/", async (req, res) => {
    try {
        const { lostReportId, itemName, description, category, color, dateFound, locationFound, userId } = req.body;

        if (lostReportId) {
            // ---- Match mode: link to an existing lost report ----
            const [lostRows] = await db.query(
                "SELECT item_id, user_id FROM lost_reports WHERE lost_id = ?",
                [lostReportId]
            );
            if (!lostRows.length) {
                return res.status(404).json({ error: "Lost report not found" });
            }
            const { item_id, user_id: lostUserId } = lostRows[0];

            const [foundResult] = await db.query(
                `INSERT INTO found_reports (user_id, item_id, date_found, location_found, status)
                 VALUES (?, ?, ?, ?, 'Unclaimed')`,
                [userId || null, item_id, dateFound, locationFound]
            );

            await db.query(
                `INSERT INTO claims (found_id, user_id, claim_date, verification_status)
                 VALUES (?, ?, CURDATE(), 'Pending')`,
                [foundResult.insertId, lostUserId || null]
            );

            return res.json({ message: "Found item matched and claim auto-created" });
        }

        // ---- Fresh mode: brand new item ----
        const [itemResult] = await db.query(
            `INSERT INTO items (item_name, description, category, color) VALUES (?, ?, ?, ?)`,
            [itemName, description, category, color]
        );

        await db.query(
            `INSERT INTO found_reports (user_id, item_id, date_found, location_found, status)
             VALUES (?, ?, ?, ?, 'Unclaimed')`,
            [userId || null, itemResult.insertId, dateFound, locationFound]
        );

        res.json({ message: "Found item reported successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.sqlMessage || "Failed to add found item" });
    }
});

// ================= DELETE FOUND REPORT =================

router.delete("/:id", async (req, res) => {
    try {
        const [report] = await db.query("SELECT item_id FROM found_reports WHERE found_id = ?", [req.params.id]);
        if (report.length) {
            await db.query("DELETE FROM claims WHERE found_id = ?", [req.params.id]);
            await db.query("DELETE FROM found_reports WHERE found_id = ?", [req.params.id]);
            await db.query("DELETE FROM items WHERE item_id = ?", [report[0].item_id]);
        }
        res.json({ message: "Found report deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete found report" });
    }
});

module.exports = router;
