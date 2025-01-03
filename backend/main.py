"""
This module defines the FastAPI application for the LLM Mixture of Experts project.
It handles user queries, interacts with multiple LLMs, and manages database operations.
"""

import os
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import sqlite3
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError as OpenAIAPIError, OpenAI
from anthropic import APIError as AnthropicAPIError
from sqlite3 import Error as SQLiteError

load_dotenv()

app = FastAPI(
    title="LLM Mixture of Experts API",
    description="API for querying multiple LLMs and managing responses.",
    version="0.1.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Database setup
DATABASE_FILE = "database/database.db"  # Keep as relative path


def get_db_connection() -> sqlite3.Connection:
    """
    Establishes a connection to the SQLite database.

    Returns:
        sqlite3.Connection: A database connection object.
    """
    db_path = os.path.abspath(DATABASE_FILE)  # Calculate absolute path here
    os.chdir(os.path.dirname(os.path.abspath(__file__))) # Set working directory
    print(f"Database path: {db_path}") # Print the path
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn


def init_db() -> None:
    """
    Initializes the SQLite database by creating the 'responses' table if it doesn't exist.
    """
    # Create the database directory if it doesn't exist
    db_dir = os.path.dirname(os.path.abspath(DATABASE_FILE))
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                expert1_response TEXT,
                expert2_response TEXT,
                expert3_response TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    except SQLiteError as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()


init_db()

# LLM setup
openai_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
anthropic_llm = ChatAnthropic(model="claude-3-5-haiku-20241022", temperature=0, api_key=os.getenv("ANTHROPIC_API_KEY"))

# Initialize xAI client using OpenAI SDK
xai_client = OpenAI(
    api_key=os.getenv("XAI_API_KEY"),
    base_url="https://api.x.ai/v1",
)

class QueryRequest(BaseModel):
    """
    Pydantic model for the request body of the /query endpoint.
    """
    query: str


class QueryResponse(BaseModel):
    """
    Pydantic model for the response body of the /query endpoint.
    """
    query: str
    expert1_response: str
    expert2_response: str
    expert3_response: str


@app.post("/query", response_model=QueryResponse)
async def create_query(query_request: QueryRequest) -> QueryResponse:
    """
    Handles user queries by sending them to multiple LLMs and storing the responses.

    Args:
        query_request (QueryRequest): The user's query.

    Returns:
        QueryResponse: The responses from the LLMs.

    Raises:
        HTTPException: If any error occurs during the process.
    """
    query = query_request.query

    try:
        expert1_response = ""
        expert2_response = ""
        expert3_response = ""

        try:
            expert1_response = openai_llm.invoke([HumanMessage(content=query)]).content
        except OpenAIAPIError as e:
            print(f"OpenAI API Error: {e}")
            expert1_response = f"OpenAI API Error: {e}"

        try:
            expert2_response = anthropic_llm.invoke([HumanMessage(content=query)]).content
        except AnthropicAPIError as e:
            print(f"Anthropic API Error: {e}")
            expert2_response = f"Anthropic API Error: {e}"

        try:
            completion = xai_client.chat.completions.create(
                model="grok-beta",
                messages=[{"role": "user", "content": query}],
            )
            expert3_response = completion.choices[0].message.content
        except OpenAIAPIError as e:
            print(f"xAI API Error: {e}")
            expert3_response = f"xAI API Error: {e}"

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO responses (query, expert1_response, expert2_response, expert3_response) VALUES (?, ?, ?, ?)",
                (query, expert1_response, expert2_response, expert3_response),
            )
            conn.commit()
        except SQLiteError as e:
            print(f"Database Error: {e}")
            raise HTTPException(status_code=500, detail=f"Database Error: {e}")
        finally:
            conn.close()

        return QueryResponse(
            query=query,
            expert1_response=expert1_response,
            expert2_response=expert2_response,
            expert3_response=expert3_response,
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected Error: {e}")