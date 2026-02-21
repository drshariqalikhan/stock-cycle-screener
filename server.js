const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));

// YAHOO FINANCE PROXY
app.get('/api/price/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const cleanTicker = ticker.split('.')[0].toUpperCase();
        console.log(`[Backend] Fetching Yahoo: ${cleanTicker}`);
        
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${cleanTicker}?interval=1wk&range=15y`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 8000
        });

        if (!response.data.chart?.result) throw new Error("No data found");
        res.json(response.data);
    } catch (error) {
        console.error(`[Yahoo Error] ${error.message}`);
        res.status(500).json({ error: "Failed to fetch stock data" });
    }
});

// FRED PROXY
app.get('/api/economic', async (req, res) => {
    try {
        const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=JTS1000OSL&cosd=2000-12-01&coed=2025-05-01&fq=Monthly&transformation=lin`;
        const response = await axios.get(url, { timeout: 8000 });
        res.setHeader('Content-Type', 'text/plain');
        res.send(response.data);
    } catch (error) {
        console.error(`[FRED Error] ${error.message}`);
        res.status(500).send("Economic data unavailable");
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));