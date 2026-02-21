const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Render uses port 10000 by default
const PORT = process.env.PORT || 10000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Stock Data Proxy (Stooq)
app.get('/api/price/:ticker', async (req, res) => {
    const { ticker } = req.params;
    console.log(`[Request] Fetching Stock: ${ticker}`);
    
    try {
        const stooqUrl = `https://stooq.com/q/d/l/?s=${ticker}&i=w&c=1`;
        const response = await axios.get(stooqUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            timeout: 10000
        });

        // Debugging: Log the start of the data to the Render console
        console.log(`[Stooq] Data Preview: ${response.data.substring(0, 100).replace(/\n/g, ' ')}`);

        if (response.data.includes("<html") || response.data.length < 50) {
            console.error(`[Error] Stooq returned non-CSV data. Possibly blocked or ticker mismatch.`);
            return res.status(404).send("Data not available from provider.");
        }

        res.setHeader('Content-Type', 'text/plain');
        res.send(response.data);
    } catch (error) {
        console.error(`[Stooq Proxy Error]: ${error.message}`);
        res.status(500).send("Backend Server Error");
    }
});

// Economic Data Proxy (FRED)
app.get('/api/economic', async (req, res) => {
    console.log(`[Request] Fetching Economic Data (FRED)`);
    try {
        const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=JTS1000OSL&cosd=2000-12-01&coed=2025-05-01&fq=Monthly&transformation=lin`;
        const response = await axios.get(url, { timeout: 10000 });
        res.setHeader('Content-Type', 'text/plain');
        res.send(response.data);
    } catch (error) {
        console.error(`[FRED Proxy Error]: ${error.message}`);
        res.status(500).send("Economic Data Unavailable");
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cycle Screener running on port ${PORT}`);
});