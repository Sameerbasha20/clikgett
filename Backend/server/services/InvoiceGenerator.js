'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const pool = require('../utils/db');

/**
 * Generates and streams a professional, branded PDF transaction receipt / tax invoice.
 */
async function generateReceiptPdf(orderId, res) {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Fetch Order Details
            const orderQuery = `
                SELECT o.*, LPAD(o.OrderID, 4, '0') AS OrderSequence,
                       u.FirstName, u.LastName, u.MobileNumber as UserMobile, u.EmailID as UserEmail
                FROM Orders o
                LEFT JOIN Users u ON o.UserID = u.UserID
                WHERE o.OrderID = ?
                LIMIT 1
            `;

            pool.query(orderQuery, [orderId], async (err, orderRows) => {
                if (err) {
                    console.error('Error fetching order for receipt:', err);
                    return res.status(500).json({ Status: 0, Message: 'Database error fetching order' });
                }

                if (!orderRows || orderRows.length === 0) {
                    return res.status(404).json({ Status: 0, Message: `Order #${orderId} not found` });
                }

                const order = orderRows[0];

                // 2. Fetch Order Items
                const itemsQuery = `
                    SELECT oi.*
                    FROM OrderItems oi
                    WHERE oi.OrderID = ?
                `;

                pool.query(itemsQuery, [orderId], (err2, itemRows) => {
                    if (err2) {
                        console.error('Error fetching order items for receipt:', err2);
                        return res.status(500).json({ Status: 0, Message: 'Database error fetching order items' });
                    }

                    const items = itemRows || [];

                    // Setup HTTP Response Headers for direct PDF download
                    const filename = `Receipt_ORD_${order.OrderSequence || order.OrderID}.pdf`;
                    if (typeof res.setHeader === 'function') {
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    }

                    // 3. Create PDF Document (Standard A4)
                    const doc = new PDFDocument({
                        size: 'A4',
                        margin: 40,
                        info: {
                            Title: `Transaction Receipt - ClikGett #${order.OrderSequence}`,
                            Author: 'ClikGett Hyperlocal Retail',
                            Subject: 'Order Transaction Receipt',
                        }
                    });

                    doc.pipe(res);

                    // Colors
                    const primaryColor = '#7C3AED'; // ClikGett violet/purple
                    const secondaryColor = '#4B5563'; // Dark grey
                    const lightBg = '#F3F4F6';
                    const borderColor = '#E5E7EB';

                    // Top Banner / Header
                    doc.rect(40, 40, 515, 65).fill(lightBg);

                    // Brand Title
                    doc.fillColor(primaryColor)
                        .fontSize(22)
                        .font('Helvetica-Bold')
                        .text('ClikGett', 55, 52);

                    doc.fillColor(secondaryColor)
                        .fontSize(9)
                        .font('Helvetica')
                        .text('Superfast Grocery & Essentials Delivery', 55, 78)
                        .text('Support: support@clikgett.com | Kurnool, AP', 55, 90);

                    // Receipt Title & Order Info (Right aligned)
                    doc.fillColor('#111827')
                        .fontSize(16)
                        .font('Helvetica-Bold')
                        .text('TRANSACTION RECEIPT', 320, 50, { align: 'right', width: 220 });

                    const orderDateStr = order.CreatedAt
                        ? moment(order.CreatedAt).utcOffset(330).format('DD MMM YYYY, hh:mm A')
                        : moment().utcOffset(330).format('DD MMM YYYY, hh:mm A');

                    doc.fontSize(9)
                        .font('Helvetica')
                        .fillColor(secondaryColor)
                        .text(`Receipt No: INV-${order.OrderSequence}`, 320, 72, { align: 'right', width: 220 })
                        .text(`Order Date: ${orderDateStr}`, 320, 84, { align: 'right', width: 220 })
                        .text(`Txn ID: ${order.PaymentTransactionID || 'TXN-' + order.OrderID}`, 320, 96, { align: 'right', width: 220 });

                    doc.y = 125;

                    // Customer & Delivery Information Cards
                    const cardY = 125;
                    const cardHeight = 85;

                    // Card 1: Billed To
                    doc.rect(40, cardY, 250, cardHeight).strokeColor(borderColor).lineWidth(1).stroke();
                    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text('Customer Details', 50, cardY + 10);

                    const customerName = [order.FirstName, order.LastName].filter(Boolean).join(' ') || 'Valued Customer';
                    const customerMobile = order.MobileNumber || order.UserMobile || 'N/A';
                    const customerEmail = order.UserEmail || 'N/A';

                    doc.fillColor(secondaryColor).fontSize(8.5).font('Helvetica')
                        .text(`Name: ${customerName}`, 50, cardY + 28)
                        .text(`Phone: ${customerMobile}`, 50, cardY + 42)
                        .text(`Email: ${customerEmail}`, 50, cardY + 56);

                    // Card 2: Order & Delivery Summary
                    doc.rect(305, cardY, 250, cardHeight).strokeColor(borderColor).lineWidth(1).stroke();
                    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text('Delivery & Payment Info', 315, cardY + 10);

                    const deliveryType = order.ScheduleStatus === 'Scheduled' && order.ScheduledDateTime
                        ? `Scheduled (${moment(order.ScheduledDateTime).utcOffset(330).format('DD MMM YYYY')})`
                        : 'Express Delivery (15-30 Mins)';

                    const paymentMode = order.PaymentMethod || 'Cash on Delivery';
                    const paymentStatus = order.PaymentStatus || (order.PaymentMethod === 'Cash on Delivery' ? 'Pay on Delivery' : 'Completed');

                    const addressSnippet = [order.FlatNo, order.LandMark, order.Address].filter(Boolean).join(', ') || 'Registered Address';
                    const truncatedAddress = addressSnippet.length > 55 ? addressSnippet.substring(0, 52) + '...' : addressSnippet;

                    doc.fillColor(secondaryColor).fontSize(8.5).font('Helvetica')
                        .text(`Type: ${deliveryType}`, 315, cardY + 28)
                        .text(`Payment: ${paymentMode} (${paymentStatus})`, 315, cardY + 42)
                        .text(`Address: ${truncatedAddress}`, 315, cardY + 56, { width: 230 });

                    // Table of Items
                    const tableTop = 225;
                    doc.rect(40, tableTop, 515, 24).fill(lightBg);

                    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold')
                        .text('#', 50, tableTop + 7)
                        .text('Item Description', 80, tableTop + 7)
                        .text('Unit / Pack', 310, tableTop + 7)
                        .text('Qty', 390, tableTop + 7)
                        .text('Unit Price', 440, tableTop + 7)
                        .text('Total', 500, tableTop + 7, { align: 'right', width: 45 });

                    let currentY = tableTop + 24;

                    if (!items || items.length === 0) {
                        doc.rect(40, currentY, 515, 22).strokeColor(borderColor).lineWidth(0.5).stroke();
                        doc.fillColor(secondaryColor).fontSize(8.5).font('Helvetica-Oblique')
                            .text('No itemized product lines recorded for this order', 50, currentY + 6);
                        currentY += 22;
                    }

                    items.forEach((item, index) => {
                        const rowHeight = 22;
                        if (index % 2 === 1) {
                            doc.rect(40, currentY, 515, rowHeight).fill('#F9FAFB');
                        }

                        doc.rect(40, currentY, 515, rowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();

                        const unitStr = [item.metricvalue, item.metrictype].filter(Boolean).join(' ') || '-';
                        const itemQty = item.Quantity || 1;
                        const unitPrice = parseFloat(item.Price || item.OfferPrice || 0);
                        const itemTotal = unitPrice * itemQty;

                        doc.fillColor(secondaryColor).fontSize(8.5).font('Helvetica')
                            .text((index + 1).toString(), 50, currentY + 6)
                            .text(item.ProductName || `Item #${item.ProductID}`, 80, currentY + 6, { width: 220, ellipsis: true })
                            .text(unitStr, 310, currentY + 6)
                            .text(itemQty.toString(), 390, currentY + 6)
                            .text(`Rs. ${unitPrice.toFixed(2)}`, 440, currentY + 6)
                            .text(`Rs. ${itemTotal.toFixed(2)}`, 500, currentY + 6, { align: 'right', width: 45 });

                        currentY += rowHeight;
                    });

                    // Totals Section
                    const totalsTop = currentY + 15;
                    const totalsWidth = 220;
                    const totalsX = 335;

                    doc.rect(totalsX, totalsTop, totalsWidth, 115).strokeColor(borderColor).lineWidth(1).stroke();

                    const subTotal = parseFloat(order.SubTotal || 0);
                    const deliveryCharge = parseFloat(order.DeliverCharges || 0);
                    const discount = parseFloat(order.Discount || order.PromoAmount || 0);
                    const tip = parseFloat(order.TipAmount || 0);
                    const grandTotal = parseFloat(order.GrandTotal || subTotal + deliveryCharge - discount + tip);

                    let summaryY = totalsTop + 10;
                    const renderSummaryRow = (label, val, isNegative = false, isBold = false) => {
                        doc.fillColor(isBold ? '#111827' : secondaryColor)
                            .fontSize(isBold ? 9.5 : 8.5)
                            .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
                            .text(label, totalsX + 10, summaryY)
                            .text(`${isNegative ? '-' : ''}Rs. ${Math.abs(val).toFixed(2)}`, totalsX + 10, summaryY, { align: 'right', width: totalsWidth - 20 });
                        summaryY += 16;
                    };

                    renderSummaryRow('Items Subtotal:', subTotal);
                    renderSummaryRow('Delivery Charges:', deliveryCharge === 0 ? 0 : deliveryCharge);
                    if (discount > 0) {
                        renderSummaryRow('Coupon / Discount:', discount, true);
                    }
                    if (tip > 0) {
                        renderSummaryRow('Delivery Partner Tip:', tip);
                    }

                    // Grand Total Line
                    doc.rect(totalsX, summaryY + 2, totalsWidth, 26).fill(lightBg);
                    doc.fillColor(primaryColor)
                        .fontSize(11)
                        .font('Helvetica-Bold')
                        .text('Grand Total Paid:', totalsX + 10, summaryY + 8)
                        .text(`Rs. ${grandTotal.toFixed(2)}`, totalsX + 10, summaryY + 8, { align: 'right', width: totalsWidth - 20 });

                    // Left Side: Status & Security Stamp
                    const stampX = 50;
                    const stampY = totalsTop + 10;
                    doc.rect(stampX, stampY, 250, 70).fill('#F0FDF4');
                    doc.rect(stampX, stampY, 250, 70).strokeColor('#86EFAC').lineWidth(1).stroke();

                    doc.fillColor('#15803D')
                        .fontSize(11)
                        .font('Helvetica-Bold')
                        .text('✔ ORDER COMPLETED & VERIFIED', stampX + 12, stampY + 12);

                    doc.fillColor('#166534')
                        .fontSize(8)
                        .font('Helvetica')
                        .text(`Payment: ${paymentMode} | Status: ${paymentStatus}`, stampX + 12, stampY + 30)
                        .text('Thank you for choosing ClikGett!', stampX + 12, stampY + 44);

                    // Footer
                    const footerY = 740;
                    doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(borderColor).lineWidth(1).stroke();

                    doc.fillColor('#9CA3AF')
                        .fontSize(8)
                        .font('Helvetica')
                        .text('This is a computer-generated transaction receipt and does not require a physical signature.', 40, footerY + 10, { align: 'center', width: 515 })
                        .text('ClikGett Technologies Private Limited | Helpline: +91 91234 56789 | Email: support@clikgett.com', 40, footerY + 22, { align: 'center', width: 515 });

                    doc.end();
                    resolve();
                });
            });
        } catch (err) {
            console.error('Exception in generateReceiptPdf:', err);
            if (!res.headersSent) {
                res.status(500).json({ Status: 0, Message: 'Internal server error generating receipt' });
            }
            reject(err);
        }
    });
}

module.exports = {
    generateReceiptPdf,
};
