const express = require('express');
const cors = require('cors');
const axios = require('axios');
const net = require('net');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

function isPrivateIp(ip) {
    // IPv4 checks
    if (ip.includes('.')) {
        const parts = ip.split('.').map(n => Number(n));
        if (parts.length !== 4 || parts.some(n => !Number.isFinite(n) || n < 0 || n > 255)) return true;
        const [a, b] = parts;
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 192 && b === 168) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 169 && b === 254) return true;
        return false;
    }

    // IPv6 checks (best-effort)
    const lowered = ip.toLowerCase();
    if (lowered === '::1') return true;
    if (lowered.startsWith('fc') || lowered.startsWith('fd')) return true; // unique local
    if (lowered.startsWith('fe80')) return true; // link-local
    return false;
}

function isBlockedHostname(hostname) {
    const host = String(hostname || '').toLowerCase();
    if (!host) return true;
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;

    const ipType = net.isIP(host);
    if (ipType) return isPrivateIp(host);
    return false;
}

// Simple in-memory cache for external search results
const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(cacheKey) {
    const entry = searchCache.get(cacheKey);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > SEARCH_CACHE_TTL_MS) {
        searchCache.delete(cacheKey);
        return null;
    }
    return entry.value;
}

function setCached(cacheKey, value) {
    searchCache.set(cacheKey, { createdAt: Date.now(), value });
}

function normalizeLanguage(language) {
    const value = String(language || 'all').toLowerCase();
    if (value === 'hindi' || value === 'hi') return 'hindi';
    if (value === 'english' || value === 'en') return 'english';
    return 'all';
}

function clampLimit(limit, fallback = 25) {
    const parsed = Number(limit);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.min(Math.floor(parsed), 50));
}

async function searchItunes({ term, language, limit }) {
    const normalizedLanguage = normalizeLanguage(language);
    const normalizedLimit = clampLimit(limit, 25);

    // Country impacts ranking and language availability.
    const country = normalizedLanguage === 'hindi' ? 'IN' : normalizedLanguage === 'english' ? 'US' : 'US';

    // For Hindi, adding “bollywood” improves relevance.
    const termWithHint = normalizedLanguage === 'hindi'
        ? `${term} bollywood`
        : term;

    const url = 'https://itunes.apple.com/search';
    const params = {
        term: termWithHint,
        media: 'music',
        entity: 'song',
        limit: normalizedLimit,
        country
    };

    const cacheKey = JSON.stringify({ url, params });
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const response = await axios.get(url, { params, timeout: 12_000 });
    const results = Array.isArray(response.data?.results) ? response.data.results : [];

    // Only return playable previews.
    const mapped = results
        .filter(r => typeof r.previewUrl === 'string' && r.previewUrl.startsWith('http'))
        .map(r => ({
            title: r.trackName || 'Unknown Title',
            artist: r.artistName || 'Unknown Artist',
            url: r.previewUrl,
            artwork: r.artworkUrl100 || r.artworkUrl60 || null,
            source: 'itunes'
        }));

    setCached(cacheKey, mapped);
    return mapped;
}

// Music database (in-memory for now, can be replaced with actual database)
const musicDatabase = [
    {
        id: 1,
        title: 'Lofi Beats',
        artist: 'Lofi Girl',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        genre: 'Lofi',
        duration: 180
    },
    {
        id: 2,
        title: 'Chill Vibes',
        artist: 'Relaxing Music',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        genre: 'Chill',
        duration: 240
    },
    {
        id: 3,
        title: 'Piano Melody',
        artist: 'Piano Music',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        genre: 'Classical',
        duration: 200
    },
    {
        id: 4,
        title: 'Electronic Groove',
        artist: 'Electronic',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        genre: 'Electronic',
        duration: 220
    },
    {
        id: 5,
        title: 'Ambient Sounds',
        artist: 'Ambient',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        genre: 'Ambient',
        duration: 300
    },
    {
        id: 6,
        title: 'Jazz Cafe',
        artist: 'Jazz',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        genre: 'Jazz',
        duration: 250
    }
];

// Routes

// Get all songs
app.get('/api/songs', (req, res) => {
    try {
        res.json({
            success: true,
            data: musicDatabase,
            count: musicDatabase.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching songs',
            error: error.message
        });
    }
});

// Search songs by query
app.get('/api/songs/search', (req, res) => {
    try {
        const query = req.query.q || '';
        
        if (!query.trim()) {
            return res.json({
                success: true,
                data: musicDatabase,
                count: musicDatabase.length
            });
        }
        
        const results = musicDatabase.filter(song => 
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase()) ||
            song.genre.toLowerCase().includes(query.toLowerCase())
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            query: query
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching songs',
            error: error.message
        });
    }
});

// iTunes-powered search (lots of Hindi/English songs + playable preview URLs)
// Example: /api/search?term=arijit&language=hindi&limit=25
app.get('/api/search', async (req, res) => {
    try {
        const term = String(req.query.term || '').trim();
        const language = normalizeLanguage(req.query.language);
        const limit = clampLimit(req.query.limit, 25);

        if (!term) {
            return res.status(400).json({
                success: false,
                message: 'Missing required query param: term'
            });
        }

        const data = await searchItunes({ term, language, limit });
        return res.json({
            success: true,
            data,
            count: data.length,
            term,
            language
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error searching songs (iTunes)',
            error: error.message
        });
    }
});

// Simple “trending” endpoint so users can browse without typing a query
// Example: /api/trending?language=english&limit=25
app.get('/api/trending', async (req, res) => {
    try {
        const language = normalizeLanguage(req.query.language);
        const limit = clampLimit(req.query.limit, 25);

        const term = language === 'hindi'
            ? 'bollywood hits'
            : language === 'english'
                ? 'top hits'
                : 'top hits';

        const data = await searchItunes({ term, language, limit });
        return res.json({
            success: true,
            data,
            count: data.length,
            language
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching trending songs',
            error: error.message
        });
    }
});

// Audio proxy/stream endpoint (fixes CORS + supports Range requests for <audio>)
// Example: /api/stream?url=https%3A%2F%2Fwww.soundhelix.com%2Fexamples%2Fmp3%2FSoundHelix-Song-1.mp3
app.get('/api/stream', async (req, res) => {
    try {
        const rawUrl = String(req.query.url || '').trim();
        if (!rawUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing required query param: url'
            });
        }

        let target;
        try {
            target = new URL(rawUrl);
        } catch {
            return res.status(400).json({
                success: false,
                message: 'Invalid url'
            });
        }

        if (target.protocol !== 'http:' && target.protocol !== 'https:') {
            return res.status(400).json({
                success: false,
                message: 'Only http/https URLs are supported'
            });
        }

        if (isBlockedHostname(target.hostname)) {
            return res.status(400).json({
                success: false,
                message: 'Blocked target host'
            });
        }

        const upstreamHeaders = {};
        if (req.headers.range) upstreamHeaders.Range = req.headers.range;

        const upstream = await axios.get(target.toString(), {
            responseType: 'stream',
            headers: upstreamHeaders,
            timeout: 20_000,
            validateStatus: () => true
        });

        // Expose headers so browsers (and devtools) can see range details.
        res.set('Access-Control-Expose-Headers', 'Accept-Ranges,Content-Range,Content-Length,Content-Type');

        const passthroughHeaderNames = [
            'content-type',
            'content-length',
            'accept-ranges',
            'content-range',
            'etag',
            'last-modified',
            'cache-control'
        ];
        for (const name of passthroughHeaderNames) {
            const value = upstream.headers?.[name];
            if (value) res.set(name, value);
        }

        res.status(upstream.status);

        upstream.data.on('error', () => {
            if (!res.headersSent) res.status(502);
            res.end();
        });

        return upstream.data.pipe(res);
    } catch (error) {
        return res.status(502).json({
            success: false,
            message: 'Error streaming audio',
            error: error.message
        });
    }
});

// Get song by ID
app.get('/api/songs/:id', (req, res) => {
    try {
        const song = musicDatabase.find(s => s.id === parseInt(req.params.id));
        
        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Song not found'
            });
        }
        
        res.json({
            success: true,
            data: song
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching song',
            error: error.message
        });
    }
});

// Get songs by genre
app.get('/api/songs/genre/:genre', (req, res) => {
    try {
        const genre = req.params.genre.toLowerCase();
        const results = musicDatabase.filter(song => 
            song.genre.toLowerCase() === genre
        );
        
        res.json({
            success: true,
            data: results,
            count: results.length,
            genre: genre
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching songs by genre',
            error: error.message
        });
    }
});

// Add new song (POST)
app.post('/api/songs', (req, res) => {
    try {
        const { title, artist, url, genre, duration } = req.body;
        
        // Validation
        if (!title || !artist || !url) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, artist, url'
            });
        }
        
        const newSong = {
            id: musicDatabase.length > 0 ? Math.max(...musicDatabase.map(s => s.id)) + 1 : 1,
            title,
            artist,
            url,
            genre: genre || 'Unknown',
            duration: duration || 0
        };
        
        musicDatabase.push(newSong);
        
        res.status(201).json({
            success: true,
            message: 'Song added successfully',
            data: newSong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding song',
            error: error.message
        });
    }
});

// Delete song
app.delete('/api/songs/:id', (req, res) => {
    try {
        const index = musicDatabase.findIndex(s => s.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Song not found'
            });
        }
        
        const deletedSong = musicDatabase.splice(index, 1)[0];
        
        res.json({
            success: true,
            message: 'Song deleted successfully',
            data: deletedSong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting song',
            error: error.message
        });
    }
});

// Update song
app.put('/api/songs/:id', (req, res) => {
    try {
        const song = musicDatabase.find(s => s.id === parseInt(req.params.id));
        
        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Song not found'
            });
        }
        
        // Update fields
        if (req.body.title) song.title = req.body.title;
        if (req.body.artist) song.artist = req.body.artist;
        if (req.body.url) song.url = req.body.url;
        if (req.body.genre) song.genre = req.body.genre;
        if (req.body.duration) song.duration = req.body.duration;
        
        res.json({
            success: true,
            message: 'Song updated successfully',
            data: song
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating song',
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎵 Music Backend Server running on http://localhost:${PORT}`);
    console.log(`📚 Total songs in database: ${musicDatabase.length}`);
});
