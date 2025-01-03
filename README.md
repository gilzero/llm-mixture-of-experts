# LLM Mixture of Experts

This project is a web application that demonstrates a Mixture of Experts (MoE) approach using multiple Large Language Models (LLMs). It allows users to submit a query and receive responses from three different LLMs: OpenAI's GPT, Anthropic's Claude, and xAI's Grok.

## Features

*   **Multiple LLM Responses:** Queries are sent to three different LLMs, providing diverse perspectives.
*   **Real-time Response Generation:** Responses are generated and displayed in real-time.
*   **Basic Frontend:** A simple web interface for submitting queries and viewing responses.
*   **Detailed Error Handling:** Comprehensive error handling in both the frontend and backend.
*   **User-Friendly Feedback:** Clear loading indicators and informative error messages.
*   **Modular Code Structure:** Well-organized code with clear separation of concerns.
*   **API Key Management:** Secure API key management using environment variables.
*   **SQLite Database:** Basic database to store queries and responses.

## Technology Stack

*   **Backend:**
    *   FastAPI (Python)
    *   Langchain (for LLM abstraction)
    *   Uvicorn (for running the API)
    *   SQLite (for database)
*   **Frontend:**
    *   HTML
    *   CSS
    *   JavaScript
    *   Bootstrap (for styling)
*   **LLMs:**
    *   OpenAI GPT (using `langchain-openai`)
    *   Anthropic Claude (using `langchain-anthropic`)
    *   xAI Grok (using `openai` library)

## Getting Started

### Prerequisites

*   Python 3.7+
*   Node.js and npm (for `http-server`)
*   API keys for OpenAI, Anthropic, and xAI

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/llm-mixture-of-experts.git
    cd llm-mixture-of-experts
    ```

2.  **Create a virtual environment:**

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install backend dependencies:**

    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Install frontend dependencies:**

    ```bash
    npm install -g http-server
    ```

5.  **Create a `.env` file in the `backend` directory:**

    ```
    OPENAI_API_KEY="your_openai_api_key"
    ANTHROPIC_API_KEY="your_anthropic_api_key"
    XAI_API_KEY="your_xai_api_key"
    ```

    *   Replace the placeholders with your actual API keys.

### Running the Application

1.  **Start the backend:**

    ```bash
    cd backend
    uvicorn main:app --reload
    ```

2.  **Start the frontend server:**

    ```bash
    cd ../frontend
    http-server -p 8081
    ```

3.  **Open the frontend in your browser:**

    *   Go to `http://localhost:8081` in your browser.

4.  **Enter a query and click "Submit."**

## Known Issues

*   **Empty Console Log:** The browser's console log might be empty, making debugging difficult. This is due to the event listener not being triggered correctly.
*   **UI Display Issues:** The frontend might not display the responses correctly, resulting in a blank screen. This is often due to issues with response parsing or UI updates.
*   **API Rate Limits:** The application might encounter API rate limits, resulting in errors. This can be mitigated by managing API usage and spending limits.
*   **Limited Analysis:** The application currently only provides raw responses from the LLMs. There is no analysis or comparison of the responses.
*   **Basic Frontend:** The frontend is very basic and lacks advanced features.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues to suggest improvements or report bugs.


## Contact

If you have any questions or suggestions, please feel free to contact me at i at weiming dot ai.