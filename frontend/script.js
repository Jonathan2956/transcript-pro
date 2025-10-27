/**
 * TranscriptPro Main Application - Complete Hindi Comments के साथ
 * यह main application file है जो सभी functionality manage करती है
 */

class TranscriptProApp {
  constructor() {
    // Services Initialize करें
    this.apiService = new ApiService(); // Backend API calls के लिए
    this.databaseManager = new DatabaseManager(); // Local database के लिए
    this.youtubeService = new YouTubeService(); // YouTube integration के लिए
    this.aiService = new AIService(); // AI processing के लिए
    this.youtubePlayer = window.YouTubePlayer; // YouTube player instance
    
    // Data Storage Variables
    this.currentUser = null; // Logged in user
    this.currentVideo = null; // Current playing video
    this.currentTranscript = null; // Current transcript data
    this.sentences = []; // Processed sentences array
    this.phrases = []; // Extracted phrases array
    this.vocabulary = []; // User vocabulary array
    
    // Application State
    this.isDragging = false; // Window dragging state
    this.dragOffset = { x: 0, y: 0 }; // Drag position offset
    this.currentDragWindow = null; // Currently dragged window
    this.isPlayerInitialized = false; // YouTube player state
    
    // Application Initialize करें
    this.init();
  }

  /**
   * Application Initialize करें - Startup process
   */
  async init() {
    console.log('🚀 TranscriptPro App Initializing...'); // Startup message
    
    try {
      // Local database initialize करें
      await this.databaseManager.init();
      
      // User authentication check करें
      await this.checkAuth();
      
      // Event listeners setup करें
      this.setupEventListeners();
      
      // User preferences load करें
      this.loadPreferences();
      
      // YouTube player events setup करें
      this.setupYouTubePlayerEvents();
      
      console.log('✅ TranscriptPro App Initialized Successfully'); // Success message
      
    } catch (error) {
      console.error('❌ App Initialization Failed:', error); // Error message
      this.showNotification('Application failed to initialize', 'error'); // User notification
    }
  }

  /**
   * YouTube Player Events Setup करें - Real-time sync के लिए
   */
  setupYouTubePlayerEvents() {
    // Player ready event listen करें
    window.addEventListener('youtube-player:ready', (event) => {
      this.isPlayerInitialized = true; // Player ready status set करें
      console.log('✅ YouTube Player Integrated'); // Log message
      this.showNotification('YouTube player ready', 'success'); // User notification
    });

    // Time update events listen करें
    this.youtubePlayer.onTimeUpdate((currentTime) => {
      this.handleVideoTimeUpdate(currentTime); // Time update handle करें
    });

    // State change events listen करें
    this.youtubePlayer.onStateChange((state, event) => {
      this.handlePlayerStateChange(state, event); // State change handle करें
    });

    // Player errors handle करें
    window.addEventListener('youtube-player:error', (event) => {
      this.handlePlayerError(event.detail); // Error handle करें
    });
  }

  /**
   * Video Time Update Handle करें - Real-time transcript sync के लिए
   */
  handleVideoTimeUpdate(currentTime) {
    // Current time display update करें
    document.getElementById('sentenceTime').textContent = this.formatTime(currentTime);
    
    // Progress bar update करें
    const duration = this.youtubePlayer.getDuration(); // Video duration
    const progressPercent = (currentTime / duration) * 100; // Progress percentage
    document.getElementById('sentenceProgressFill').style.width = `${progressPercent}%`;
    
    // Current sentence find और highlight करें
    this.highlightCurrentSentence(currentTime);
  }

  /**
   * Player State Change Handle करें - Play/pause states के लिए
   */
  handlePlayerStateChange(state, event) {
    console.log(`🎬 Player State: ${state}`); // State log करें
    
    switch (state) {
      case 'playing':
        this.startTranscriptSync(); // Transcript sync start करें
        break;
      case 'paused':
        this.stopTranscriptSync(); // Transcript sync stop करें
        break;
      case 'ended':
        this.handleVideoEnd(); // Video end handle करें
        break;
      case 'buffering':
        this.showBufferingState(); // Buffering state show करें
        break;
    }
  }

  /**
   * Player Error Handle करें - YouTube player errors के लिए
   */
  handlePlayerError(error) {
    console.error('❌ YouTube Player Error:', error); // Error log करें
    this.showNotification(`Player error: ${error.message}`, 'error'); // User notification
    
    // Error specific handling
    if (error.code === 100) {
      this.showNotification('Video not found or private', 'error'); // Video not found
    } else if (error.code === 101) {
      this.showNotification('Embedding not allowed by video owner', 'error'); // Embed error
    }
  }

  /**
   * Video End Handle करें - जब video complete हो जाए
   */
  handleVideoEnd() {
    console.log('🏁 Video ended'); // Log message
    this.stopTranscriptSync(); // Sync stop करें
    
    // Completion statistics save करें
    this.saveCompletionStats();
    
    // Completion message show करें
    this.showNotification('Video completed! Great job! 🎉', 'success');
  }

  /**
   * Buffering State Show करें - जब video buffer कर रहा हो
   */
  showBufferingState() {
    // Buffering indicator show करें (यदि needed हो)
    console.log('⏳ Video buffering...'); // Log message
  }

  /**
   * Video Completion Statistics Save करें - Learning progress के लिए
   */
  async saveCompletionStats() {
    if (!this.currentUser || !this.currentVideo) return; // Validation check
    
    try {
      const progressData = {
        videoId: this.currentVideo.videoId,
        completed: true,
        completionPercentage: 100,
        timeSpent: this.youtubePlayer.getDuration(), // Total video time
        wordsSaved: this.getWordsLearnedCount(), // Words learned count
        phrasesSaved: this.getPhrasesLearnedCount() // Phrases learned count
      };

      // Progress save करें
      await this.apiService.saveProgress(progressData);
      
      console.log('✅ Completion stats saved'); // Success log
      
    } catch (error) {
      console.error('❌ Failed to save completion stats:', error); // Error log
    }
  }

  /**
   * Learned Words Count Get करें - Progress tracking के लिए
   */
  getWordsLearnedCount() {
    // Current session में saved words count return करें
    return this.vocabulary.filter(item => 
      item.type === 'word' && 
      item.context?.some(ctx => ctx.videoId === this.currentVideo?.videoId)
    ).length;
  }

  /**
   * Learned Phrases Count Get करें - Progress tracking के लिए
   */
  getPhrasesLearnedCount() {
    // Current session में saved phrases count return करें
    return this.vocabulary.filter(item => 
      item.type === 'phrase' && 
      item.context?.some(ctx => ctx.videoId === this.currentVideo?.videoId)
    ).length;
  }

  /**
   * Load Video - YouTube video load और process करें
   */
  async loadVideo() {
    const videoUrl = document.getElementById('videoUrl').value.trim(); // YouTube URL
    
    // URL validation
    if (!videoUrl) {
      this.showNotification('Please enter a YouTube URL', 'error'); // Error notification
      return;
    }

    try {
      this.showLoading('Extracting video information...'); // Loading show करें
      
      // YouTube video ID extract करें
      const videoId = this.youtubeService.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL'); // Error throw करें
      }

      // YouTube player show और initialize करें
      this.showYouTubePlayer();
      this.youtubePlayer.loadVideo(videoId);

      // Video details fetch करें
      const videoDetails = await this.apiService.getYouTubeDetails(videoId);
      this.currentVideo = { ...videoDetails, videoId, videoUrl };

      // Video information display करें
      this.showVideoInfo(videoDetails);

      // Transcript fetch या create करें
      await this.loadOrCreateTranscript(videoId);

      this.hideLoading(); // Loading hide करें
      this.showNotification('Video loaded successfully!', 'success'); // Success notification

    } catch (error) {
      this.hideLoading(); // Loading hide करें
      this.showNotification(error.message, 'error'); // Error notification
      console.error('Load video error:', error); // Error log
    }
  }

  /**
   * YouTube Player Show करें - Player container display करें
   */
  showYouTubePlayer() {
    const playerContainer = document.getElementById('youtubePlayerContainer');
    playerContainer.style.display = 'block'; // Container show करें
    
    // Close button event add करें
    document.getElementById('closePlayerBtn').addEventListener('click', () => {
      playerContainer.style.display = 'none'; // Container hide करें
      this.youtubePlayer.pause(); // Video pause करें
    });
  }

  /**
   * Transcript Load या Create करें - Existing transcript fetch करें या new create करें
   */
  async loadOrCreateTranscript(videoId) {
    try {
      // Existing transcript fetch करने की try करें
      this.currentTranscript = await this.apiService.getTranscript(videoId);
      this.processTranscript(this.currentTranscript); // Transcript process करें
      
    } catch (error) {
      // Transcript not found, new create करें
      if (error.message.includes('not found')) {
        await this.createNewTranscript(videoId); // New transcript create करें
      } else {
        throw error; // Other errors forward करें
      }
    }
  }

  /**
   * New Transcript Create करें - YouTube से captions extract करके
   */
  async createNewTranscript(videoId) {
    try {
      this.showLoading('Extracting captions from YouTube...'); // Loading message
      
      // YouTube से captions extract करें
      const captionsData = await this.apiService.getYouTubeCaptions(videoId);
      
      this.showLoading('Processing with AI...'); // AI processing message
      
      // AI से transcript process करें
      const aiResult = await this.aiService.processTranscriptWithAI(captionsData.captions);
      
      // Transcript data prepare करें
      const transcriptData = {
        videoId: videoId,
        videoUrl: this.currentVideo.videoUrl,
        title: this.currentVideo.title,
        duration: this.currentVideo.duration,
        originalTranscript: captionsData.captions,
        processedSentences: aiResult.sentences,
        thumbnail: this.currentVideo.thumbnail,
        channel: this.currentVideo.channel
      };

      // Database में save करें
      this.currentTranscript = await this.apiService.saveTranscript(transcriptData);
      this.processTranscript(this.currentTranscript); // Processed transcript display करें

    } catch (error) {
      console.error('Create transcript error:', error); // Error log
      throw new Error('Failed to create transcript: ' + error.message); // User-friendly error
    }
  }

  /**
   * Current Sentence Highlight करें - Video time के based पर
   */
  highlightCurrentSentence(currentTime) {
    // Current time के according sentence find करें
    const currentSentenceIndex = this.sentences.findIndex(sentence => 
      currentTime >= sentence.start && currentTime < sentence.start + sentence.duration
    );

    // Sentence highlight करें यदि found हो और changed हो
    if (currentSentenceIndex !== -1 && currentSentenceIndex !== this.currentSentenceIndex) {
      this.selectSentence(currentSentenceIndex); // Sentence select करें
      this.currentSentenceIndex = currentSentenceIndex; // Current index update करें
    }
  }

  /**
   * Transcript Sync Start करें - Real-time synchronization
   */
  startTranscriptSync() {
    if (this.syncInterval) return; // Already running check
    
    console.log('🔄 Starting transcript sync'); // Log message
    this.isSyncing = true; // Sync status set करें
    
    // Sync interval set करें
    this.syncInterval = setInterval(() => {
      if (this.youtubePlayer.getPlayerState() === 1) { // Playing state check
        const currentTime = this.youtubePlayer.getCurrentTime(); // Current time get करें
        this.highlightCurrentSentence(currentTime); // Sentence highlight करें
      }
    }, 100); // 100ms interval
  }

  /**
   * Transcript Sync Stop करें - Synchronization stop करें
   */
  stopTranscriptSync() {
    if (!this.syncInterval) return; // Not running check
    
    console.log('⏹️ Stopping transcript sync'); // Log message
    this.isSyncing = false; // Sync status set करें
    
    clearInterval(this.syncInterval); // Interval clear करें
    this.syncInterval = null; // Interval reference remove करें
  }

  /**
   * Sentence पर Click करने पर Video Seek करें
   */
  seekToSentence(sentenceIndex) {
    const sentence = this.sentences[sentenceIndex]; // Sentence data get करें
    if (sentence) {
      this.youtubePlayer.seekTo(sentence.start); // Video seek करें
      this.selectSentence(sentenceIndex); // Sentence select करें
    }
  }

  // ... (बाकी methods previous implementation के similar रहेंगे)

  /**
   * Application Destroy करें - Cleanup के लिए
   */
  destroy() {
    // Intervals clear करें
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // YouTube player destroy करें
    if (this.youtubePlayer) {
      this.youtubePlayer.destroy();
    }

    // Event listeners remove करें
    this.removeEventListeners();

    console.log('🧹 TranscriptPro App Destroyed'); // Log message
  }
}

// Application Initialize करें जब DOM ready हो
document.addEventListener('DOMContentLoaded', () => {
  window.transcriptApp = new TranscriptProApp(); // Global instance create करें
});

// Page Unload पर Cleanup करें
window.addEventListener('beforeunload', () => {
  if (window.transcriptApp) {
    window.transcriptApp.destroy(); // App destroy करें
  }
});
