const AWS = require('aws-sdk');
require('dotenv').config();

const AdminCostOverviewController = {
    getCostOverview: async (req, res) => {
        try {
            const accessKey = process.env.ID || process.env.S3AccessKey;
            const secretKey = process.env.SECRET || process.env.S3SecretKey;

            if (!accessKey || !secretKey) {
                return res.json({
                    Status: 1,
                    Connected: false,
                    Message: "AWS credentials not configured on backend environment.",
                    AccountInfo: { Region: "ap-south-1" },
                    Data: null
                });
            }

            const costExplorer = new AWS.CostExplorer({
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
                region: 'us-east-1' // AWS Cost Explorer API endpoint is us-east-1
            });

            // Calculate start and end date for current billing period
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

            costExplorer.getCostAndUsage({
                TimePeriod: {
                    Start: startOfMonth,
                    End: tomorrow
                },
                Granularity: 'MONTHLY',
                Metrics: ['UnblendedCost'],
                GroupBy: [
                    { Type: 'DIMENSION', Key: 'SERVICE' }
                ]
            }, (err, data) => {
                if (err) {
                    console.log("Cost Explorer query note:", err.code, err.message);
                    return res.json({
                        Status: 1,
                        Connected: false,
                        ErrorCode: err.code || 'AccessDenied',
                        Message: `AWS Cost Explorer API requires 'ce:GetCostAndUsage' IAM policy. Current credentials (${err.code}) cannot query billing.`,
                        AccountInfo: {
                            Region: "ap-south-1",
                            IAMUser: "arn:aws:iam::288761749672:user/NewUser (Configured)"
                        },
                        Data: null
                    });
                }

                return res.json({
                    Status: 1,
                    Connected: true,
                    Message: "Live AWS cost overview retrieved successfully",
                    AccountInfo: {
                        Region: "ap-south-1"
                    },
                    Data: data
                });
            });
        } catch (e) {
            console.error("Exception in getCostOverview:", e);
            return res.status(500).json({
                Status: 0,
                Message: "Server error checking AWS billing"
            });
        }
    }
};

module.exports = AdminCostOverviewController;
