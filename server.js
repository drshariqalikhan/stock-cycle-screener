const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));

// Stock Data Proxy (Yahoo Finance JSON v8)
app.get('/api/price/:ticker', async (req, res) => {
    const { ticker } = req.params;
    const cleanTicker = ticker.split('.')[0]; // Converts VT.US to VT
    
    console.log(`[Request] Fetching Yahoo Finance for: ${cleanTicker}`);
    
    try {
        // Using query2 which is often more stable for cloud servers
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${cleanTicker}?interval=1wk&range=15y`;

        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://finance.yahoo.com/'
            },
            timeout: 5000 // 5 second timeout to prevent hanging
        });

        if (response.data && response.data.chart && response.data.chart.result) {
            console.log(`[Success] Received data for ${cleanTicker}`);
            res.json(response.data);
        } else {
            console.error(`[Error] Malformed response for ${cleanTicker}`);
            res.status(404).json({ error: "No data found for this ticker" });
        }
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error(`[Timeout] Yahoo Finance took too long for ${cleanTicker}`);
            res.status(504).json({ error: "Provider timeout" });
        } else if (error.response) {
            console.error(`[Yahoo Blocked] Status: ${error.response.status} for ${cleanTicker}`);
            res.status(error.response.status).json({ error: "Access denied by provider" });
        } else {
            console.error(`[Network Error] ${error.message}`);
            res.status(500).json({ error: "Failed to connect to provider" });
        }
    }
});

// Economic Data Proxy (FRED)
app.get('/api/economic', async (req, res) => {
    console.log(`[Request] Fetching Economic Data (FRED)`);
    try {
        const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=JTS1000OSL&cosd=2000-12-01&coed=2025-05-01&fq=Monthly&transformation=lin`;
        const response = await axios.get(url, { timeout: 5000 });
        console.log(`[Success] Received FRED data`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(response.data);
    } catch (error) {
        console.error(`[FRED Error] ${error.message}`);
        res.status(500).send("Economic data unavailable");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cycle Screener running on port ${PORT}`);
});