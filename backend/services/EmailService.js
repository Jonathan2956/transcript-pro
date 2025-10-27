/**
 * Email Service - Users को emails send करने के लिए
 * Welcome emails, password reset, notifications आदि के लिए
 */

const nodemailer = require('nodemailer'); // Email sending library

class EmailService {
  constructor() {
    // Email transporter configure करें
    this.transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'Gmail', // Email service (Gmail, SendGrid, etc.)
      auth: {
        user: process.env.EMAIL_USER, // Email address
        pass: process.env.EMAIL_PASS  // Email password/API key
      }
    });

    // Templates setup करें
    this.templates = {
      welcome: this.getWelcomeTemplate.bind(this),
      passwordReset: this.getPasswordResetTemplate.bind(this),
      learningProgress: this.getLearningProgressTemplate.bind(this),
      vocabularyReminder: this.getVocabularyReminderTemplate.bind(this)
    };
  }

  /**
   * Welcome Email Send करें - New user registration पर
   */
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: `"TranscriptPro" <${process.env.EMAIL_USER}>`, // Sender address
        to: user.email, // Recipient email
        subject: 'Welcome to TranscriptPro! 🎉', // Email subject
        html: this.templates.welcome(user) // Email content
      };

      // Email send करें
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to: ${user.email}`); // Success log
      return result;

    } catch (error) {
      console.error('❌ Welcome email error:', error); // Error log
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  /**
   * Password Reset Email Send करें - Password reset request पर
   */
  async sendPasswordResetEmail(user, resetToken) {
    try {
      // Reset URL create करें
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"TranscriptPro Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request - TranscriptPro',
        html: this.templates.passwordReset(user, resetUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to: ${user.email}`);
      return result;

    } catch (error) {
      console.error('❌ Password reset email error:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  /**
   * Learning Progress Email Send करें - Weekly progress report
   */
  async sendLearningProgressEmail(user, progressData) {
    try {
      const mailOptions = {
        from: `"TranscriptPro Learning" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Your Weekly Learning Progress 📊`,
        html: this.templates.learningProgress(user, progressData)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Learning progress email sent to: ${user.email}`);
      return result;

    } catch (error) {
      console.error('❌ Learning progress email error:', error);
      throw error;
    }
  }

  /**
   * Vocabulary Reminder Email Send करें - Review reminders
   */
  async sendVocabularyReminderEmail(user, dueItems) {
    try {
      const mailOptions = {
        from: `"TranscriptPro Vocabulary" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Vocabulary Review Reminder 📚`,
        html: this.templates.vocabularyReminder(user, dueItems)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Vocabulary reminder sent to: ${user.email}`);
      return result;

    } catch (error) {
      console.error('❌ Vocabulary reminder email error:', error);
      throw error;
    }
  }

  /**
   * Welcome Email Template - New user के लिए
   */
  getWelcomeTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50, #2196F3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #4CAF50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TranscriptPro! 🎉</h1>
            <p>Your journey to language mastery begins now</p>
          </div>
          <div class="content">
            <h2>Hello ${user.username},</h2>
            <p>We're excited to have you on board! Here's what you can do with TranscriptPro:</p>
            
            <div class="feature">
              <h3>🎯 Learn with YouTube</h3>
              <p>Convert any YouTube video into an interactive learning experience with real-time transcripts and translations.</p>
            </div>
            
            <div class="feature">
              <h3>📚 Build Your Vocabulary</h3>
              <p>Save words and phrases, and review them with our smart spaced repetition system.</p>
            </div>
            
            <div class="feature">
              <h3>🤖 AI-Powered Learning</h3>
              <p>Get intelligent transcript improvements, translations, and phrase explanations.</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL}" class="button">Start Learning Now</a>
            </center>
            
            <p>If you have any questions, feel free to reply to this email.</p>
            
            <p>Happy Learning!<br>The TranscriptPro Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password Reset Template - Password reset के लिए
   */
  getPasswordResetTemplate(user, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; }
          .note { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.username},</h2>
            <p>We received a request to reset your password for your TranscriptPro account.</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Your Password</a>
            </center>
            
            <div class="note">
              <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
            </div>
            
            <p>If you didn't request this reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br>The TranscriptPro Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Learning Progress Template - Progress report के लिए
   */
  getLearningProgressTemplate(user, progressData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2196F3, #4CAF50); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .stat { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; text-align: center; }
          .stat-number { font-size: 2em; font-weight: bold; color: #2196F3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Learning Progress 📊</h1>
            <p>Weekly report for ${user.username}</p>
          </div>
          <div class="content">
            <h2>Great progress this week! 🎉</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
              <div class="stat">
                <div class="stat-number">${progressData.videosWatched || 0}</div>
                <div>Videos Watched</div>
              </div>
              <div class="stat">
                <div class="stat-number">${progressData.wordsLearned || 0}</div>
                <div>Words Learned</div>
              </div>
              <div class="stat">
                <div class="stat-number">${progressData.timeSpent || 0}m</div>
                <div>Time Spent</div>
              </div>
              <div class="stat">
                <div class="stat-number">${progressData.phrasesSaved || 0}</div>
                <div>Phrases Saved</div>
              </div>
            </div>
            
            <p>Keep up the great work! Consistent practice is key to language mastery.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                Continue Learning
              </a>
            </center>
            
            <p>Happy Learning!<br>The TranscriptPro Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Vocabulary Reminder Template - Review reminders के लिए
   */
  getVocabularyReminderTemplate(user, dueItems) {
    const itemsList = dueItems.slice(0, 5).map(item => 
      `<li style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
        <strong>${item.originalText}</strong> - ${item.translatedText}
      </li>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF9800, #FF5722); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Vocabulary Review Reminder 📚</h1>
            <p>Time to review your saved words and phrases</p>
          </div>
          <div class="content">
            <h2>Hello ${user.username},</h2>
            <p>You have <strong>${dueItems.length}</strong> items due for review. Regular review helps strengthen your memory!</p>
            
            <h3>Items to review:</h3>
            <ul style="list-style: none; padding: 0;">
              ${itemsList}
            </ul>
            
            ${dueItems.length > 5 ? `<p>... and ${dueItems.length - 5} more items</p>` : ''}
            
            <center>
              <a href="${process.env.FRONTEND_URL}/vocabulary/review" class="button">
                Start Review Session
              </a>
            </center>
            
            <p>Best regards,<br>The TranscriptPro Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Email Service Verify करें - Connection test के लिए
   */
  async verifyConnection() {
    try {
      await this.transporter.verify(); // Connection verify करें
      console.log('✅ Email service connected successfully'); // Success message
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error); // Error message
      return false;
    }
  }
}

module.exports = EmailService;
