const pool = require('../utils/db');

function queryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

const SearchAnalyticsController = {
    getAnalytics: async (req, res) => {
        try {
            const { search, filter, limit } = req.query;
            let sql = `
                SELECT 
                    Keyword,
                    Keyword AS SearchTerm,
                    COUNT(*) as SearchCount,
                    COUNT(DISTINCT UserID) as UniqueUsers,
                    MAX(CreatedAt) as LastSearched,
                    MIN(CreatedAt) as FirstSearched,
                    AVG(ResultCount) as AvgResultCount,
                    MIN(ResultCount) as MinResultCount
                FROM SearchLogs
                WHERE Keyword IS NOT NULL AND TRIM(Keyword) != ''
            `;
            const params = [];
            if (search) {
                sql += " AND Keyword LIKE ?";
                params.push(`%${search}%`);
            }
            if (filter === 'zero_results') {
                sql += " AND ResultCount = 0";
            }
            sql += " GROUP BY Keyword";
            
            if (filter === 'recent') {
                sql += " ORDER BY LastSearched DESC, SearchCount DESC";
            } else {
                // Default: Most frequently searched first
                sql += " ORDER BY SearchCount DESC, LastSearched DESC";
            }

            if (limit) {
                sql += " LIMIT ?";
                params.push(parseInt(limit, 10));
            } else {
                sql += " LIMIT 250";
            }

            const rows = await queryAsync(sql, params);
            const list = (rows || []).map((r, index) => {
                const count = parseInt(r.SearchCount, 10) || 0;
                const avgResults = Math.round(parseFloat(r.AvgResultCount || 0));
                return {
                    ...r,
                    Rank: index + 1,
                    SearchTerm: r.Keyword,
                    SearchCount: count,
                    AvgResultCount: avgResults,
                    IsZeroResult: avgResults === 0,
                    DemandLevel: count >= 5 ? 'High' : (count >= 2 ? 'Moderate' : 'Normal')
                };
            });

            return res.json({
                Status: 1,
                status: 1,
                Analytics: list,
                Keywords: list,
                keywords: list,
                data: list
            });
        } catch (err) {
            console.error("Error fetching search analytics:", err);
            return res.status(500).json({ Status: 0, status: 0, Message: "Error fetching search analytics", message: "Error fetching search analytics" });
        }
    },

    getKeywordUsers: async (req, res) => {
        try {
            const keyword = (req.query.keyword || req.params.keyword || '').trim();
            if (!keyword) {
                return res.status(400).json({ Status: 0, Message: "Keyword query parameter is required" });
            }

            const sql = `
                SELECT 
                    sl.SearchID,
                    sl.Keyword,
                    sl.UserID,
                    sl.ResultCount,
                    sl.CreatedAt,
                    COALESCE(u.FirstName, 'Guest') as FirstName,
                    COALESCE(NULLIF(u.LastName, 'NA'), '') as LastName,
                    COALESCE(u.MobileNumber, 'N/A') as MobileNumber,
                    COALESCE(u.EmailID, 'N/A') as EmailID
                FROM SearchLogs sl
                LEFT JOIN Users u ON u.UserID = sl.UserID
                WHERE sl.Keyword = ?
                ORDER BY sl.CreatedAt DESC
                LIMIT 100
            `;
            const rows = await queryAsync(sql, [keyword]);
            return res.json({
                Status: 1,
                Keyword: keyword,
                Searches: rows || []
            });
        } catch (err) {
            console.error("Error fetching keyword user details:", err);
            return res.status(500).json({ Status: 0, Message: "Error fetching customer search details" });
        }
    }
};

module.exports = SearchAnalyticsController;
