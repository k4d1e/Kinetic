// apiService.js - Frontend API service for backend communication

class KineticAPI {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  /**
   * Initiate Google OAuth (full page redirect)
   * @returns {void}
   */
  initiateGoogleAuth() {
    // Simply redirect to the OAuth endpoint
    window.location.href = `${this.baseURL}/auth/google`;
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<Object>} - Auth status and user info
   */
  async checkAuth() {
    try {
      const response = await fetch(`${this.baseURL}/auth/status`, {
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Error checking auth:', error);
      return { authenticated: false };
    }
  }

  /**
   * Fetch user's GSC properties
   * @returns {Promise<Array>} - List of properties
   */
  async fetchGSCProperties() {
    try {
      const response = await fetch(`${this.baseURL}/api/gsc/properties`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch properties');
      }

      const data = await response.json();
      return data.properties;
    } catch (error) {
      console.error('Error fetching GSC properties:', error);
      throw error;
    }
  }

  /**
   * Start calibration for a property
   * @param {string} siteUrl - GSC property URL
   * @returns {Promise<Object>} - Calibration response
   */
  async startCalibration(siteUrl) {
    try {
      const response = await fetch(`${this.baseURL}/api/gsc/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ siteUrl })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start calibration');
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting calibration:', error);
      throw error;
    }
  }

  /**
   * Get search analytics data
   * @param {string} siteUrl - GSC property URL
   * @returns {Promise<Object>} - Analytics data
   */
  async getAnalytics(siteUrl) {
    try {
      const response = await fetch(
        `${this.baseURL}/api/gsc/analytics?siteUrl=${encodeURIComponent(siteUrl)}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch analytics');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  /**
   * Get specific metric data
   * @param {string} metric - Metric type (quick-wins, cannibalization, etc.)
   * @param {string} siteUrl - GSC property URL
   * @param {boolean} refresh - Force refresh cache (default: false)
   * @returns {Promise<Array>} - Metric data
   */
  async getMetricData(metric, siteUrl, refresh = false) {
    try {
      const refreshParam = refresh ? '&refresh=true' : '';
      const response = await fetch(
        `${this.baseURL}/api/gsc/data/${metric}?siteUrl=${encodeURIComponent(siteUrl)}${refreshParam}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch ${metric} data`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(`Error fetching ${metric}:`, error);
      throw error;
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KineticAPI;
}
