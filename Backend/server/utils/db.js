const fs = require('fs');
const mysql = require('mysql');
require('dotenv').config();

// Single shared MySQL pool for the whole backend. All settings come from the
// environment, so moving between local Docker MySQL and AWS RDS is only an
// .env change. Legacy variable names (HOST, PASSWORD, db) are still accepted.
const host = process.env.DB_HOST || process.env.HOST;
const isRemoteRds = /\.rds\.amazonaws\.com$/i.test(String(host || '').replace(/"/g, ''));

// Guard against accidentally pointing local development at production.
if (process.env.NODE_ENV === 'development' && isRemoteRds && process.env.ALLOW_REMOTE_DB !== 'true') {
    console.error('Refusing to start: NODE_ENV=development but DB host is an AWS RDS endpoint. ' +
        'Point DB_HOST at your local MySQL, or set ALLOW_REMOTE_DB=true if this is intentional.');
    process.exit(1);
}

let ssl;
if (process.env.DB_SSL === 'true') {
    // Managed MySQL (e.g. Aiven): the provider's CA certificate, either as a file path
    // (DB_SSL_CA) or pasted into DB_SSL_CA_PEM on hosts without files (Render).
    const ca = process.env.DB_SSL_CA_PEM
        ? process.env.DB_SSL_CA_PEM.replace(/\\n/g, '\n') // allow "\n" when pasted on one line
        : process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined;
    ssl = ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true };
}

const pool = mysql.createPool({
    connectionLimit: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
    password: process.env.DB_PASSWORD || process.env.PASSWORD,
    user: process.env.DB_USER,
    database: process.env.DB_NAME || process.env.db,
    host,
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    ...(ssl ? { ssl } : {})
});

module.exports = pool;
