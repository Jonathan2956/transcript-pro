/**
 * YouTube Routes - YouTube से captions extract करने के लिए
 * Real YouTube integration के लिए necessary routes
 */

const express = require('express');
const { exec } = require('child_process'); // System commands run करने के लिए
const fs = require('fs'); // File system operations के लिए
const path = require('path'); // File paths handle करने के लिए
const { auth } = require('../middleware/auth'); // Authentication middleware

const router = express.Router();

/**
 * YouTube video से captions extract करें
 * GET /api/youtube/captions/:videoId
 */
router.get('/captions/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params; // YouTube video ID
    const { language = 'en' } = req.query; // Captions language (default: English)

    console.log(`🎬 Extracting captions for video: ${videoId}`);

    // Temporary file path define करें
    const tempDir = path.join(__dirname, '../temp');
    const outputFile = path.join(tempDir, `captions_${videoId}`);

    // Temporary directory create करें अगर नहीं है
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // yt-dlp command से captions extract करें
    const command = `yt-dlp --write-auto-sub --sub-lang ${language} --skip-download --output "${outputFile}" "https://www.youtube.com/watch?v=${videoId}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ yt-dlp error:', error);
        return res.status(500).json({ 
          error: 'Failed to extract captions from YouTube',
          details: error.message
        });
      }

      // Generated subtitle file find करें
      const subtitleFile = `${outputFile}.${language}.vtt`;
      
      if (!fs.existsSync(subtitleFile)) {
        return res.status(404).json({ 
          error: 'No captions found for this video',
          available: await this.checkAvailableCaptions(videoId)
        });
      }

      // Subtitle file parse करें
      const captions = this.parseVTTFile(subtitleFile);
      
      // Temporary files clean up करें
      this.cleanupTempFiles(outputFile);

      res.json({
        videoId,
        language,
        captions,
        totalEntries: captions.length
      });

    });

  } catch (error) {
    console.error('❌ YouTube captions error:', error);
    res.status(500).json({ 
      error: 'Failed to process YouTube captions',
      message: error.message
    });
  }
});

/**
 * VTT file parse करें और structured data return करें
 */
parseVTTFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const captions = [];
    let currentEntry = null;

    for (const line of lines) {
      // Timestamp line identify करें
      if (line.includes('-->')) {
        if (currentEntry) {
          captions.push(currentEntry);
        }
        
        const [start, end] = line.split(' --> ').map(ts => this.parseVTTTime(ts));
        currentEntry = {
          start: start,
          end: end,
          duration: end - start,
          text: ''
        };
      } 
      // Text line handle करें (empty lines और headers skip करें)
      else if (currentEntry && line.trim() && !line.startsWith('WEBVTT') && !line.startsWith('NOTE')) {
        currentEntry.text += (currentEntry.text ? ' ' : '') + line.trim();
      }
    }

    // Last entry add करें
    if (currentEntry && currentEntry.text) {
      captions.push(currentEntry);
    }

    return captions;

  } catch (error) {
    console.error('VTT parsing error:', error);
    return [];
  }
}

/**
 * VTT timestamp को seconds में convert करें
 * Format: 00:00:10.500 --> 00:00:13.000
 */
parseVTTTime(timestamp) {
  const [time, milliseconds] = timestamp.split('.');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  
  return hours * 3600 + minutes * 60 + seconds + (parseInt(milliseconds) / 1000);
}

/**
 * Available captions check करें
 */
async checkAvailableCaptions(videoId) {
  return new Promise((resolve) => {
    const command = `yt-dlp --list-subs "https://www.youtube.com/watch?v=${videoId}"`;
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve([]);
      } else {
        // Available languages extract करें
        const languages = stdout.split('\n')
          .filter(line => line.includes('vtt'))
          .map(line => line.split(' ')[0])
          .filter(lang => lang);
        
        resolve(languages);
      }
    });
  });
}

/**
 * Temporary files clean up करें
 */
cleanupTempFiles(basePath) {
  try {
    // All related files delete करें
    const files = fs.readdirSync(path.dirname(basePath));
    const pattern = new RegExp(path.basename(basePath));
    
    files.forEach(file => {
      if (pattern.test(file)) {
        fs.unlinkSync(path.join(path.dirname(basePath), file));
      }
    });
  } catch (error) {
    console.warn('Temp cleanup warning:', error.message);
  }
}

/**
 * YouTube video details fetch करें
 * GET /api/youtube/details/:videoId
 */
router.get('/details/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;

    // yt-dlp से video information extract करें
    const command = `yt-dlp --dump-json "https://www.youtube.com/watch?v=${videoId}"`;

    exec(command, (error, stdout) => {
      if (error) {
        return res.status(404).json({ 
          error: 'Video not found or inaccessible'
        });
      }

      try {
        const videoInfo = JSON.parse(stdout);
        
        // Relevant information extract करें
        const videoDetails = {
          videoId: videoInfo.id,
          title: videoInfo.title,
          description: videoInfo.description,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail,
          channel: {
            name: videoInfo.channel,
            id: videoInfo.channel_id,
            url: videoInfo.channel_url
          },
          viewCount: videoInfo.view_count,
          uploadDate: videoInfo.upload_date,
          categories: videoInfo.categories,
          tags: videoInfo.tags
        };

        res.json(videoDetails);

      } catch (parseError) {
        res.status(500).json({ 
          error: 'Failed to parse video information'
        });
      }
    });

  } catch (error) {
    console.error('YouTube details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch video details'
    });
  }
});

module.exports = router;
