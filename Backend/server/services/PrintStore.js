// Print store: customers upload PDFs or photos, choose copies / colour / orientation,
// and the print jobs ride along in the normal cart and order.
//
//   PrintJobs.Status : DRAFT (uploaded, not in cart) -> IN_CART -> ORDERED
//   Prices           : Settings.PrintPriceBW / PrintPriceColor (per printed page)
//   Delivery time    : prints only -> PRINT_ONLY_MINUTES; with other items -> +PRINT_EXTRA_MINUTES
//                      (services/DeliveryTime.js)
const crypto = require('crypto');
const pool = require('../utils/db');
const media = require('../utils/media');
const storage = require('../utils/s3');

const PRINT_ONLY_MINUTES = 20;
const PRINT_EXTRA_MINUTES = 10;
const MAX_FILE_MB = 20;
const MAX_COPIES = 50;
const FILE_TYPES = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const money = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

async function config() {
    const rows = await queryAsync(
        "SELECT SettingKey, SettingValue FROM Settings WHERE SettingKey IN ('PrintPriceBW', 'PrintPriceColor', 'PrintStoreEnabled')"
    ).catch(() => []);
    const s = {};
    rows.forEach((r) => { s[r.SettingKey] = r.SettingValue; });
    return {
        Enabled: s.PrintStoreEnabled === undefined ? true : String(s.PrintStoreEnabled) !== '0',
        PriceBW: parseFloat(s.PrintPriceBW) || 3,
        PriceColor: parseFloat(s.PrintPriceColor) || 10,
        PaperGSM: 70,
        SingleSided: true,
        MaxFileMB: MAX_FILE_MB,
        MaxCopies: MAX_COPIES,
        PrintOnlyMinutes: PRINT_ONLY_MINUTES,
        ExtraMinutesWithItems: PRINT_EXTRA_MINUTES,
    };
}

/** Pages in a PDF (pdf-lib); a photo is one page. */
async function countPages(buffer, mimeType) {
    if (mimeType !== 'application/pdf') return 1;
    const { PDFDocument } = require('pdf-lib');
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });
    return doc.getPageCount();
}

const fileKeyFor = (userId, mimeType) => `PrintFiles/${userId}/${crypto.randomUUID()}.${FILE_TYPES[mimeType]}`;

/** Key belongs to this customer's print folder (uploads go through a signed link). */
const ownsKey = (userId, key) => typeof key === 'string' && key.startsWith(`PrintFiles/${userId}/`) && !key.includes('..');

async function readFile(key) {
    const stream = await storage.stream(key);
    const chunks = [];
    let size = 0;
    for await (const chunk of stream) {
        size += chunk.length;
        if (size > MAX_FILE_MB * 1024 * 1024) throw new Error('too_large');
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

function priceJob(job, cfg) {
    const unit = job.ColorMode === 'COLOR' ? cfg.PriceColor : cfg.PriceBW;
    const pages = Math.max(1, parseInt(job.Pages, 10) || 1);
    const copies = Math.min(MAX_COPIES, Math.max(1, parseInt(job.Copies, 10) || 1));
    return { UnitPrice: unit, Copies: copies, LineTotal: money(unit * pages * copies) };
}

/** A print job as the apps show it (with a short-lived link to the file). */
function present(job) {
    const pages = parseInt(job.Pages, 10) || 1;
    const copies = parseInt(job.Copies, 10) || 1;
    return {
        PrintJobID: job.PrintJobID,
        FileName: job.FileName,
        MimeType: job.MimeType,
        Pages: pages,
        Copies: copies,
        PrintedPages: pages * copies,
        ColorMode: job.ColorMode,
        Orientation: job.Orientation,
        UnitPrice: money(job.UnitPrice),
        LineTotal: money(job.LineTotal),
        Status: job.Status,
        FileUrl: media.urlFor(job.FileKey),
    };
}

/** Jobs in a cart, re-priced at today's prices. */
async function cartJobs(cartId) {
    if (!cartId) return [];
    const [cfg, rows] = await Promise.all([
        config(),
        queryAsync("SELECT * FROM PrintJobs WHERE CartID = ? AND Status = 'IN_CART' ORDER BY PrintJobID", [cartId]).catch(() => []),
    ]);
    return rows.map((job) => present({ ...job, ...priceJob(job, cfg) }));
}

async function orderJobs(orderId) {
    const rows = await queryAsync('SELECT * FROM PrintJobs WHERE OrderID = ? ORDER BY PrintJobID', [orderId]).catch(() => []);
    return rows.map(present);
}

/** Locks the cart's jobs (and their prices) to the placed order. */
async function attachToOrder(cartId, orderId, jobs) {
    for (const job of jobs) {
        await queryAsync(
            "UPDATE PrintJobs SET OrderID = ?, Status = 'ORDERED', UnitPrice = ?, Copies = ?, LineTotal = ? WHERE PrintJobID = ? AND CartID = ?",
            [orderId, job.UnitPrice, job.Copies, job.LineTotal, job.PrintJobID, cartId]
        );
    }
}

/** Delivery fee for a cart with prints only (product carts use PricingEngine). */
async function printOnlyDeliveryFee(printTotal, distanceKm) {
    const [shop] = await queryAsync('SELECT * FROM AdminShopToggleSettings LIMIT 1').catch(() => []);
    const settings = await queryAsync(
        "SELECT SettingKey, SettingValue FROM Settings WHERE SettingKey IN ('DeliveryCharges', 'FreeDelivery_CartAmount')"
    ).catch(() => []);
    const s = {};
    settings.forEach((r) => { s[r.SettingKey] = r.SettingValue; });
    const free = parseFloat(s.FreeDelivery_CartAmount || 499);
    if (printTotal >= free) return 0;
    const base = parseFloat((shop && shop.BaseDeliveryCharge) || s.DeliveryCharges || 25);
    const perKm = parseFloat((shop && shop.PricePerKm) || 5);
    const km = Math.max(1, parseFloat(distanceKm) || 1);
    return Math.ceil(base + km * perKm);
}

module.exports = {
    FILE_TYPES, MAX_FILE_MB, MAX_COPIES, PRINT_ONLY_MINUTES, PRINT_EXTRA_MINUTES,
    config, countPages, fileKeyFor, ownsKey, readFile, priceJob, present,
    cartJobs, orderJobs, attachToOrder, printOnlyDeliveryFee, queryAsync,
};
