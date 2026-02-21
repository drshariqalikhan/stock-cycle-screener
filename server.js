const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// Use the port Render provides, or default to 3000 locally
const PORT = process.env.PORT || 3000;

// Serve all files in the "public" folder (index.html, manifest.json, sw.js)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Route: Fetch Stock Price Data from Stooq
 * Example: /api/price/VT.US
 */
app.get('/api/price/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        // Stooq CSV URL: i=w (weekly), c=1 (include headers)
        const stooqUrl = `https://stooq.com/q/d/l/?s=${ticker}&i=w&c=1`;

        const response = await axios.get(stooqUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 second timeout
        });

        // Check if the response actually contains data (Stooq returns 200 even for bad tickers)
        if (response.data.includes("Invalid ticker") || response.data.length < 50) {
            return res.status(404).send("Ticker not found on Stooq");
        }

        res.setHeader('Content-Type', 'text/csv');
        res.send(response.data);
    } catch (error) {
        console.error('Stooq Fetch Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch price data' });
    }
});

/**
 * Route: Fetch Job Openings Data from FRED
 */
app.get('/api/economic', async (req, res) => {
    try {
        // FRED Job Openings (JTS1000OSL)
        const fredUrl = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=JTS1000OSL&cosd=2000-12-01&coed=2025-05-01&fq=Monthly&transformation=lin`;

        const response = await axios.get(fredUrl, {
            timeout: 10000
        });

        res.setHeader('Content-Type', 'text/csv');
        res.send(response.data);
    } catch (error) {
        console.error('FRED Fetch Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch economic data' });
    }
});

/**
 * Catch-all route to serve the PWA for any other requests
 * (Useful if you eventually add client-side routing)
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
// Binding to 0.0.0.0 is critical for Render/Docker environments
app.listen(PORT, '0.0.0.0', () => {
    console.log(`--- Cycle Screener Server Running ---`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Data source: Stooq & FRED`);
});