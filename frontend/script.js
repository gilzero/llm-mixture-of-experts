/**
 * @fileoverview Expert Query Handler - Manages expert consultation system UI interactions
 * Handles form submission, API communication, and response display with comprehensive error handling
 *
 * @requires DOM elements with IDs: submitButton, queryInput, results, expert1Response, expert2Response, expert3Response
 */

class QueryHandler {
    /**
     * Creates a new QueryHandler instance
     * @param {Object} config - Configuration options
     * @param {string} config.apiEndpoint - API endpoint URL
     * @param {number} config.timeout - Request timeout in milliseconds
     */
    constructor(config = {}) {
        /** @type {string} The API endpoint URL */
        this.apiEndpoint = config.apiEndpoint || 'http://127.0.0.1:8000/query';
        /** @type {number} The request timeout in milliseconds */
        this.timeout = config.timeout || 30000;
        /** @type {Object} DOM elements used by the handler */
        this.elements = {
            submitButton: document.getElementById('submitButton'),
            queryInput: document.getElementById('queryInput'),
            results: document.getElementById('results'),
            expert1Response: document.getElementById('expert1Response'),
            expert2Response: document.getElementById('expert2Response'),
            expert3Response: document.getElementById('expert3Response')
        };

        // Validate required DOM elements
        this.validateElements();

        // Bind event handlers
        this.handleSubmit = this.handleSubmit.bind(this);
        this.attachEventListeners();
    }

    /**
     * Validates that all required DOM elements are present
     * @throws {Error} If any required DOM element is missing
     */
    validateElements() {
        Object.entries(this.elements).forEach(([name, element]) => {
            if (!element) {
                throw new Error(`Required DOM element "${name}" not found`);
            }
        });
    }

    /**
     * Attaches event listeners to DOM elements
     */
    attachEventListeners() {
        this.elements.submitButton.addEventListener('click', this.handleSubmit);
    }

    /**
     * Clears previous responses and error states
     */
    clearPreviousResponses() {
        const { expert1Response, expert2Response, expert3Response, results } = this.elements;
        expert1Response.textContent = '';
        expert2Response.textContent = '';
        expert3Response.textContent = '';
        results.classList.remove('error');
        results.textContent = '';
    }

    /**
     * Validates the query input
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
    }

    /**
     * Updates UI with expert responses
     * @param {Object} data - Response data containing expert responses
     */
    updateUI(data) {
        const { expert1Response, expert2Response, expert3Response, results } = this.elements;

        // Validate response data structure
        if (!data.expert1_response || !data.expert2_response || !data.expert3_response) {
            throw new Error('Invalid response format from server');
        }

        results.textContent = ''; // Clear loading message
        expert1Response.textContent = data.expert1_response;
        expert2Response.textContent = data.expert2_response;
        expert3Response.textContent = data.expert3_response;
    }

    /**
     * Displays error message to user
     * @param {Error} error - Error object
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = '') {
        console.error(`Error ${context}:`, error);
        this.elements.results.textContent = `Error: ${error.message}`;
        this.elements.results.classList.add('error');
    }

    /**
     * Makes API request with timeout handling
     * @param {string} query - User input query
     * @returns {Promise<Object>} Response data
     * @throws {Error} If request fails or times out
     */
    async makeRequest(query) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
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
                    errorMessage += '\nCould not parse error details.';
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Handles form submission and query processing
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();
        const query = this.elements.queryInput.value;

        this.clearPreviousResponses();

        try {
            this.validateQuery(query);

            this.elements.results.textContent = 'Loading...';
            this.elements.submitButton.disabled = true;

            const data = await this.makeRequest(query);
            this.updateUI(data);
        } catch (error) {
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
        const queryHandler = new QueryHandler({
            apiEndpoint: 'http://127.0.0.1:8000/query',
            timeout: 30000
        });
    } catch (error) {
        console.error('Failed to initialize QueryHandler:', error);
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
            resultsElement.textContent = 'Failed to initialize application. Please refresh the page.';
        }
    }
});