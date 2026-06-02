const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ================= GET CLAIMS =================

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                claims.claim_id,
                claims.claim_date,
                claims.verification_status,
                items.item_name,
                users.name AS claimant_name
            FROM claims
            JOIN found_reports ON claims.found_id = found_reports.found_id
            JOIN items ON found_reports.item_id = items.item_id
            LEFT JOIN users ON claims.user_id = users.user_id
            ORDER BY claims.claim_id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch claims" });
    }
});

// ================= ADD CLAIM =================

router.post("/", async (req, res) => {
    try {
        const { foundId, userId } = req.body;

        await db.query(
            `INSERT INTO claims (found_id, user_id, claim_date, verification_status)
             VALUES (?, ?, CURDATE(), 'Pending')`,
            [foundId, userId || null]
        );

        res.json({ message: "Claim submitted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.sqlMessage || "Failed to submit claim" });
    }
});

// ================= APPROVE CLAIM =================

router.put("/approve/:id", async (req, res) => {
    try {
        await db.query(
            `UPDATE claims SET verification_status = 'Approved' WHERE claim_id = ?`,
            [req.params.id]
        );
        await db.query(
            `UPDATE found_reports
             SET status = 'Claimed'
             WHERE found_id = (SELECT found_id FROM claims WHERE claim_id = ?)`,
            [req.params.id]
        );
        await db.query(
            `UPDATE lost_reports lr
             JOIN found_reports fr ON lr.item_id = fr.item_id
             JOIN claims c ON fr.found_id = c.found_id
             SET lr.status = 'Found'
             WHERE c.claim_id = ?`,
            [req.params.id]
        );
        res.json({ message: "Claim approved" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to approve claim" });
    }
});

// ================= REJECT CLAIM =================

router.put("/reject/:id", async (req, res) => {
    try {
        await db.query(
            `UPDATE claims SET verification_status = 'Rejected' WHERE claim_id = ?`,
            [req.params.id]
        );
        res.json({ message: "Claim rejected" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to reject claim" });
    }
});

// ================= DELETE CLAIM =================

router.delete("/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM claims WHERE claim_id = ?", [req.params.id]);
        res.json({ message: "Claim deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete claim" });
    }
});

module.exports = router;
