// Immediate debugging
console.log('Script file loaded');

/**
 * @fileoverview Expert Query Handler - Manages expert consultation system UI interactions
 * Enhanced version with improved logging, error handling, and UI feedback
 */

// Store QueryHandler instance globally for debugging access
let queryHandler;

class QueryHandler {
    /**
     * Creates a new QueryHandler instance with enhanced debugging capabilities
     * @param {Object} config - Configuration options
     * @param {string} config.apiEndpoint - API endpoint URL
     * @param {number} config.timeout - Request timeout in milliseconds
     * @param {boolean} config.debug - Enable debug logging
     */
    constructor(config = {}) {
        this.apiEndpoint = config.apiEndpoint || 'http://127.0.0.1:8000/query';
        this.timeout = config.timeout || 30000;
        this.debug = config.debug || false;

        // Initialize DOM elements with enhanced error checking
        this.elements = {
            submitButton: document.getElementById('submitButton'),
            queryInput: document.getElementById('queryInput'),
            results: document.getElementById('results'),
            expert1Response: document.getElementById('expert1Response'),
            expert2Response: document.getElementById('expert2Response'),
            expert3Response: document.getElementById('expert3Response')
        };

        this.validateElements();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.attachEventListeners();

        if (this.debug) {
            console.log('[QueryHandler] Initialized with config:', config);
        }
    }

    /**
     * Logs debug messages when debug mode is enabled
     * @param {string} message - Log message
     * @param {any} data - Optional data to log
     */
    log(message, data) {
        if (this.debug) {
            console.log(`[QueryHandler] ${message}`, data || '');
        }
    }

    /**
     * Validates that all required DOM elements are present
     * @throws {Error} If any required DOM element is missing
     */
    validateElements() {
        Object.entries(this.elements).forEach(([name, element]) => {
            if (!element) {
                const error = new Error(`Required DOM element "${name}" not found`);
                this.log('Element validation failed:', error);
                throw error;
            }
        });
        this.log('All elements validated successfully');
    }

    /**
     * Attaches event listeners to DOM elements with enhanced error handling
     */
    attachEventListeners() {
        try {
            this.elements.submitButton.addEventListener('click', this.handleSubmit);
            this.log('Event listeners attached successfully');
        } catch (error) {
            this.log('Failed to attach event listeners:', error);
            throw error;
        }
    }

    /**
     * Clears previous responses and resets UI state
     */
    clearPreviousResponses() {
        const { expert1Response, expert2Response, expert3Response } = this.elements;

        // Clear response content
        expert1Response.textContent = '';
        expert2Response.textContent = '';
        expert3Response.textContent = '';

        // Reset UI states
        document.querySelectorAll('.expert-response').forEach(element => {
            element.classList.remove('error', 'success');
            element.classList.add('loading');
        });

        this.log('Previous responses cleared');
    }

    /**
     * Validates the query input with enhanced checks
     * @param {string} query - User input query
     * @throws {Error} If query validation fails
     */
    validateQuery(query) {
        if (!query || query.trim().length === 0) {
            throw new Error('Query cannot be empty');
        }
        if (query.length > 1000) {
            throw new Error('Query exceeds maximum length of 1000 characters');
        }
        this.log('Query validation passed:', query);
    }

    /**
     * Updates UI with expert responses and handles various response states
     * @param {Object} data - Response data containing expert responses
     */
    updateUI(data) {
        // Validate response data structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format: missing data');
        }

        const responseElements = {
            expert1: {
                container: document.getElementById('expert1Results'),
                content: this.elements.expert1Response,
                response: data.expert1_response
            },
            expert2: {
                container: document.getElementById('expert2Results'),
                content: this.elements.expert2Response,
                response: data.expert2_response
            },
            expert3: {
                container: document.getElementById('expert3Results'),
                content: this.elements.expert3Response,
                response: data.expert3_response
            }
        };

        // Update each expert's response section
        Object.values(responseElements).forEach(({ container, content, response }) => {
            container.classList.remove('loading');

            if (response && response.trim()) {
                content.textContent = response;
                container.classList.add('success');
            } else {
                content.textContent = 'No response received';
                container.classList.add('error');
            }
        });

        this.log('UI updated with responses:', data);
    }

    /**
     * Displays error message to user with enhanced visual feedback
     * @param {Error} error - Error object
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = '') {
        this.log(`Error ${context}:`, error);

        // Update UI to show error state
        document.querySelectorAll('.expert-response').forEach(element => {
            element.classList.remove('loading');
            element.classList.add('error');
        });

        // Display error message
        const errorMessage = error.message || 'An unexpected error occurred';
        this.elements.results.querySelector('.error-message').textContent =
            `Error: ${errorMessage}${context ? ` (${context})` : ''}`;
    }

    /**
     * Makes API request with enhanced error handling and timeout management
     * @param {string} query - User input query
     * @returns {Promise<Object>} Response data
     * @throws {Error} If request fails or times out
     */
    async makeRequest(query) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            this.log('Making API request:', { query, endpoint: this.apiEndpoint });

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ query }),
                signal: controller.signal
            });

            if (!response.ok) {
                let errorMessage = `HTTP Error: ${response.status} - ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage += `\nDetail: ${errorData.detail || 'No additional details'}`;
                } catch (jsonError) {
                    this.log('Failed to parse error response:', jsonError);
                    errorMessage += '\nCould not parse error details';
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            this.log('API response received:', data);
            return data;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Handles form submission with enhanced error handling and UI feedback
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();
        const query = this.elements.queryInput.value;

        this.log('Submit handler triggered with query:', query);
        this.clearPreviousResponses();

        try {
            this.validateQuery(query);
            this.elements.submitButton.disabled = true;

            const data = await this.makeRequest(query);
            this.updateUI(data);
        } catch (error) {
            this.log('Error in submit handler:', error);
            if (error.name === 'AbortError') {
                this.handleError(new Error('Request timed out. Please try again.'));
            } else {
                this.handleError(error, 'processing query');
            }
        } finally {
            this.elements.submitButton.disabled = false;
        }
    }
}

// Initialize the query handler when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        queryHandler = new QueryHandler({
            apiEndpoint: 'http://127.0.0.1:8000/query',
            timeout: 30000,
            debug: true  // Enable debug logging
        });
        console.log('[App] QueryHandler initialized successfully');
    } catch (error) {
        console.error('[App] Failed to initialize QueryHandler:', error);
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
            resultsElement.textContent = 'Failed to initialize application. Please refresh the page.';
        }
    }
});