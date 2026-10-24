const fs = require('fs');
const mysql = require('mysql2');
require('dotenv').config();

// Single shared MySQL pool for the whole backend. All settings come from the
// environment, so moving between the local Docker MySQL and a hosted one (Aiven) is
// only an env change. Legacy variable names (HOST, PASSWORD, db) are still accepted.
//
// mysql2 (callback API, same calls as the old `mysql` package) supports MySQL 8.4's
// default caching_sha2_password login. The options below keep the old package's
// results: DECIMAL as numbers and JSON columns as strings (callers JSON.parse them).

// Hosting dashboards sometimes keep quotes around pasted values.
const env = (name) => {
    const v = process.env[name];
    return typeof v === 'string' ? v.trim().replace(/^(['"])(.*)\1$/s, '$2') : v;
};

const host = env('DB_HOST') || env('HOST');
const isRemoteRds = /\.rds\.amazonaws\.com$/i.test(String(host || ''));

// Guard against accidentally pointing local development at the old production database.
if (env('NODE_ENV') === 'development' && isRemoteRds && env('ALLOW_REMOTE_DB') !== 'true') {
    console.error('Refusing to start: NODE_ENV=development but DB host is an AWS RDS endpoint. ' +
        'Point DB_HOST at your local MySQL, or set ALLOW_REMOTE_DB=true if this is intentional.');
    process.exit(1);
}

let ssl;
if (env('DB_SSL') === 'true') {
    // Managed MySQL (e.g. Aiven): the provider's CA certificate, either as a file path
    // (DB_SSL_CA) or pasted into DB_SSL_CA_PEM on hosts without files (Render).
    const pem = env('DB_SSL_CA_PEM');
    const ca = pem
        ? pem.replace(/\\n/g, '\n') // allow "\n" when pasted on one line
        : env('DB_SSL_CA') ? fs.readFileSync(env('DB_SSL_CA')) : undefined;
    ssl = ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true };
}

const pool = mysql.createPool({
    connectionLimit: parseInt(env('DB_POOL_SIZE'), 10) || 10,
    password: env('DB_PASSWORD') || env('PASSWORD'),
    user: env('DB_USER'),
    database: env('DB_NAME') || env('db'),
    host,
    port: Number(env('DB_PORT')) || 3306,
    charset: 'utf8mb4',
    decimalNumbers: true,
    typeCast: (field, next) => (field.type === 'JSON' ? field.string('utf8') : next()),
    ...(ssl ? { ssl } : {})
});

// Hosted MySQL can default to ANSI mode (Aiven: ANSI_QUOTES, PIPES_AS_CONCAT,
// ONLY_FULL_GROUP_BY), which breaks queries that use "double-quoted" strings or loose
// GROUP BYs. Every connection gets the same mode as the local MySQL 8 the code is built on.
const sqlMode = env('DB_SQL_MODE') ||
    'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
pool.on('connection', (connection) => {
    connection.query('SET SESSION sql_mode = ?', [sqlMode]);
});

module.exports = pool;
