const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Render uses port 10000 by default
const PORT = process.env.PORT || 10000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Stock Data Proxy (YAHOO FINANCE)
app.get('/api/price/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        // Strip suffixes like .US if the user types them, Yahoo prefers 'VT' over 'VT.US'
        const cleanTicker = ticker.split('.')[0];
        
        console.log(`[Request] Fetching Yahoo Finance: ${cleanTicker}`);

        // Fetching 15 years of weekly data
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}?interval=1wk&range=15y`;

        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            timeout: 10000
        });

        if (!response.data.chart || !response.data.chart.result) {
            return res.status(404).json({ error: "Ticker not found on Yahoo Finance" });
        }

        res.json(response.data);
    } catch (error) {
        console.error(`[Yahoo Error]: ${error.message}`);
        res.status(500).json({ error: "Failed to fetch stock data" });
    }
});

// Economic Data Proxy (FRED)
app.get('/api/economic', async (req, res) => {
    try {
        const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=JTS1000OSL&cosd=2000-12-01&coed=2025-05-01&fq=Monthly&transformation=lin`;
        const response = await axios.get(url, { timeout: 10000 });
        res.setHeader('Content-Type', 'text/plain');
        res.send(response.data);
    } catch (error) {
        console.error(`[FRED Error]: ${error.message}`);
        res.status(500).send("Economic data unavailable");
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cycle Screener running on port ${PORT}`);
});