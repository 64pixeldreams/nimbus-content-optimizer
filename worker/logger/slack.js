// Slack Logging Module
// Handles all Slack notifications for optimization tracking

/**
 * WHAT THIS DOES:
 * - Sends optimization results to Slack
 * - Handles errors gracefully
 * - Formats data for easy reading
 * 
 * HOW TO USE:
 * const slackLogger = require('./logger/slack');
 * await slackLogger.log('Content Optimizer', payload, result);
 * 
 * SLACK MESSAGE FORMAT:
 * - Text: "🤖 Content Optimizer - SUCCESS"
 * - Data: { prompt, result }
 */

class SlackLogger {
  
  /**
   * Log results to Slack
   * @param {string} promptName - Name of the prompt executed
   * @param {Object} result - AI response or error
   */
  async log(promptName, result) {
    try {
      await fetch('https://posttoslack.tudodesk.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🤖 ${promptName}`,
          data: {
            prompt: promptName,
            full_response: result
          }
        })
      });
    } catch (slackError) {
      console.log('Slack logging failed:', slackError.message);
    }
  }
  
  /**
   * Log simple message to Slack
   * @param {string} message - Text message
   * @param {Object} data - Optional data object
   */
  async logMessage(message, data = null) {
    try {
      await fetch('https://posttoslack.tudodesk.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          data: data
        })
      });
    } catch (slackError) {
      console.log('Slack logging failed:', slackError.message);
    }
  }
}

// Export singleton instance
export default new SlackLogger();
