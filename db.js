const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "ashisht_2006",
    database: process.env.DB_NAME     || "lostfounddb"
});

module.exports = db;
