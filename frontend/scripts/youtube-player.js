/**
 * YouTube Player Integration - Real YouTube video player के लिए
 * YouTube IFrame API का use करके video play करता है
 */

class YouTubePlayerIntegration {
  constructor() {
    this.player = null; // YouTube player instance
    this.isPlayerReady = false; // Player ready status
    this.currentVideoId = null; // Current playing video ID
    this.onTimeUpdateCallbacks = []; // Time update listeners
    this.onStateChangeCallbacks = []; // State change listeners
    
    this.init(); // Player initialize करें
  }

  /**
   * YouTube Player Initialize करें
   */
  init() {
    // YouTube IFrame API script load करें अगर नहीं loaded है
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      // Global callback function set करें
      window.onYouTubeIframeAPIReady = () => {
        this.createPlayer(); // Player create करें जब API ready हो
      };
    } else {
      this.createPlayer(); // Player create करें अगर API already loaded है
    }
  }

  /**
   * YouTube Player Create करें
   */
  createPlayer() {
    // Player container check करें
    let playerContainer = document.getElementById('youtube-player');
    
    // Container create करें अगर नहीं exists
    if (!playerContainer) {
      playerContainer = document.createElement('div');
      playerContainer.id = 'youtube-player';
      playerContainer.style.position = 'fixed';
      playerContainer.style.bottom = '20px';
      playerContainer.style.right = '20px';
      playerContainer.style.width = '320px';
      playerContainer.style.height = '180px';
      playerContainer.style.zIndex = '1000';
      playerContainer.style.borderRadius = '8px';
      playerContainer.style.overflow = 'hidden';
      playerContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      document.body.appendChild(playerContainer);
    }

    // YouTube Player Instance Create करें
    this.player = new YT.Player('youtube-player', {
      height: '180',
      width: '320',
      playerVars: {
        'playsinline': 1, // Inline playback
        'enablejsapi': 1, // JavaScript API enable
        'origin': window.location.origin, // Security origin
        'rel': 0, // Related videos disable
        'modestbranding': 1, // YouTube branding reduce
        'controls': 1 // Player controls show
      },
      events: {
        'onReady': this.onPlayerReady.bind(this), // Player ready event
        'onStateChange': this.onPlayerStateChange.bind(this), // State change event
        'onError': this.onPlayerError.bind(this) // Error event
      }
    });
  }

  /**
   * Player Ready Event Handler - जब player load हो जाए
   */
  onPlayerReady(event) {
    this.isPlayerReady = true; // Player ready status set करें
    console.log('✅ YouTube Player Ready'); // Success message
    
    // Time update listener start करें
    this.startTimeUpdateListener();
    
    // Ready event dispatch करें
    this.dispatchEvent('ready', { player: this.player });
  }

  /**
   * Player State Change Event Handler - जब video state change हो
   */
  onPlayerStateChange(event) {
    const states = {
      [-1]: 'unstarted',
      [0]: 'ended',
      [1]: 'playing',
      [2]: 'paused',
      [3]: 'buffering',
      [5]: 'video cued'
    };

    const state = states[event.data] || 'unknown';
    console.log(`🎬 Player State: ${state}`); // State log करें

    // State change callbacks call करें
    this.onStateChangeCallbacks.forEach(callback => {
      callback(state, event);
    });

    // Auto transcript sync start/stop करें
    if (state === 'playing') {
      this.startTranscriptSync();
    } else if (state === 'paused' || state === 'ended') {
      this.stopTranscriptSync();
    }
  }

  /**
   * Player Error Event Handler - जब error हो
   */
  onPlayerError(event) {
    console.error('❌ YouTube Player Error:', event.data); // Error log करें
    
    const errorMessages = {
      2: 'Invalid video ID',
      5: 'HTML5 player error',
      100: 'Video not found',
      101: 'Embedding not allowed',
      150: 'Embedding not allowed'
    };

    const errorMessage = errorMessages[event.data] || 'Unknown error';
    
    // Error event dispatch करें
    this.dispatchEvent('error', { 
      code: event.data, 
      message: errorMessage 
    });
  }

  /**
   * Video Load करें - Specific video play करने के लिए
   */
  loadVideo(videoId, startSeconds = 0) {
    if (!this.isPlayerReady) {
      console.warn('⚠️ Player not ready yet'); // Warning message
      setTimeout(() => this.loadVideo(videoId, startSeconds), 100); // Retry
      return;
    }

    this.currentVideoId = videoId; // Current video ID set करें
    
    // Video load करें
    this.player.loadVideoById({
      videoId: videoId,
      startSeconds: startSeconds
    });

    console.log(`📺 Loading video: ${videoId}`); // Log message
  }

  /**
   * Video Play करें - Video play/resume करने के लिए
   */
  play() {
    if (this.isPlayerReady) {
      this.player.playVideo(); // Play video
    }
  }

  /**
   * Video Pause करें - Video pause करने के लिए
   */
  pause() {
    if (this.isPlayerReady) {
      this.player.pauseVideo(); // Pause video
    }
  }

  /**
   * Video Seek करें - Specific time पर jump करने के लिए
   */
  seekTo(timeInSeconds) {
    if (this.isPlayerReady) {
      this.player.seekTo(timeInSeconds, true); // Seek to time
      console.log(`⏩ Seeking to: ${this.formatTime(timeInSeconds)}`); // Log message
    }
  }

  /**
   * Current Time Get करें - Current playback time
   */
  getCurrentTime() {
    return this.isPlayerReady ? this.player.getCurrentTime() : 0; // Current time return करें
  }

  /**
   * Duration Get करें - Video total duration
   */
  getDuration() {
    return this.isPlayerReady ? this.player.getDuration() : 0; // Duration return करें
  }

  /**
   * Player State Get करें - Current player state
   */
  getPlayerState() {
    return this.isPlayerReady ? this.player.getPlayerState() : -1; // State return करें
  }

  /**
   * Time Update Listener Start करें - Real-time updates के लिए
   */
  startTimeUpdateListener() {
    // Clear existing interval
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }

    // New interval set करें (100ms)
    this.timeUpdateInterval = setInterval(() => {
      if (this.isPlayerReady && this.getPlayerState() === 1) { // Playing state
        const currentTime = this.getCurrentTime(); // Current time get करें
        
        // Time update callbacks call करें
        this.onTimeUpdateCallbacks.forEach(callback => {
          callback(currentTime); // Callback call करें
        });
      }
    }, 100); // 100ms interval
  }

  /**
   * Transcript Sync Start करें - Transcript के साथ sync करने के लिए
   */
  startTranscriptSync() {
    console.log('🔄 Starting transcript sync'); // Log message
    this.isSyncing = true; // Sync status set करें
  }

  /**
   * Transcript Sync Stop करें - Sync stop करने के लिए
   */
  stopTranscriptSync() {
    console.log('⏹️ Stopping transcript sync'); // Log message
    this.isSyncing = false; // Sync status set करें
  }

  /**
   * Time Update Callback Add करें - Time updates listen करने के लिए
   */
  onTimeUpdate(callback) {
    this.onTimeUpdateCallbacks.push(callback); // Callback add करें
  }

  /**
   * State Change Callback Add करें - State changes listen करने के लिए
   */
  onStateChange(callback) {
    this.onStateChangeCallbacks.push(callback); // Callback add करें
  }

  /**
   * Custom Event Dispatch करें - Event system के लिए
   */
  dispatchEvent(eventName, data) {
    // Custom event create करें
    const event = new CustomEvent(`youtube-player:${eventName}`, {
      detail: data
    });
    
    // Event dispatch करें
    window.dispatchEvent(event);
  }

  /**
   * Time Format करें - Seconds को MM:SS format में
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60); // Minutes calculate करें
    const secs = Math.floor(seconds % 60); // Seconds calculate करें
    return `${mins}:${secs.toString().padStart(2, '0')}`; // Formatted time return करें
  }

  /**
   * Player Destroy करें - Cleanup के लिए
   */
  destroy() {
    // Intervals clear करें
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }

    // Player destroy करें
    if (this.player) {
      this.player.destroy();
    }

    // Callbacks clear करें
    this.onTimeUpdateCallbacks = [];
    this.onStateChangeCallbacks = [];

    console.log('🧹 YouTube Player Destroyed'); // Log message
  }
}

// Global instance create करें
window.YouTubePlayer = new YouTubePlayerIntegration();
