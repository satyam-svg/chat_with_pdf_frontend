from typing import Union
from fastapi import FastAPI, File, UploadFile, HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_cohere import CohereEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.llms.cohere import Cohere
from dotenv import load_dotenv
from pydantic import BaseModel
import os
import cohere
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

# Ensure Cohere API Key is loaded
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    raise ValueError("COHERE_API_KEY is not set in the .env file.")

# Constants
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# PostgreSQL Database setup
DATABASE_URL = os.getenv("DATABASE_URL")  # Example: "postgresql://username:password@localhost/dbname"
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the .env file.")

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define PDF metadata table
class PdfMetadata(Base):
    __tablename__ = "pdf_metadata"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    uploaded_at = Column(String)

# Create tables in the database
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware for frontend compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Replace with your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Initialize Cohere client
cohere_client = cohere.Client(COHERE_API_KEY)

# Global variables for LangChain
vectorstore = None
qa_chain = None

# API Endpoints
@app.get("/")
def read_root():
    """Root endpoint to verify API is running."""
    return {"message": "Chat with application PDF using LangChain and Cohere"}

class QuestionRequest(BaseModel):
    question: str  # The question field

@app.post("/upload")
async def upload_and_process_pdf(file: UploadFile = File(None)):
    """
    Endpoint to upload a PDF and process it for QA.
    """
    global vectorstore, qa_chain

    # Check if a file was uploaded
    if not file:
        raise HTTPException(status_code=400, detail="No file was uploaded. Please upload a file.")

    # Validate that the uploaded file is a PDF
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Save the uploaded PDF to the `uploads` directory
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_location, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save the file: {str(e)}")

    # Save PDF metadata to PostgreSQL
    try:
        db = SessionLocal()
        pdf_metadata = PdfMetadata(
            filename=file.filename,
            file_path=file_location,
            uploaded_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # Using the current timestamp
        )
        db.add(pdf_metadata)
        db.commit()
        db.refresh(pdf_metadata)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving metadata to database: {str(e)}")
    finally:
        db.close()

    # Process the PDF using LangChain
    try:
        # Load the PDF content
        loader = PyPDFLoader(file_location)
        documents = loader.load()

        # Create embeddings using Cohere API with a model
        embeddings = CohereEmbeddings(client=cohere_client, model="embed-english-v2.0")

        # Create FAISS vector store from documents and embeddings
        vectorstore = FAISS.from_documents(documents, embeddings)

        # Create a Cohere LLM instance using LangChain's support
        llm = Cohere(client=cohere_client)

        # Create a QA chain for answering questions
        qa_chain = RetrievalQA.from_chain_type(
            retriever=vectorstore.as_retriever(),
            chain_type="stuff",
            llm=llm
        )

        return {"message": "PDF uploaded and processed successfully", "filename": file.filename}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.post("/ask")
async def ask_question(request: QuestionRequest):
    """
    Endpoint to ask questions about the uploaded PDF.
    """
    global qa_chain

    # Ensure that the QA chain is initialized
    if not qa_chain:
        raise HTTPException(status_code=400, detail="No PDF has been processed yet. Please upload a PDF first.")

    # Answer the question using the QA chain
    try:
        answer = qa_chain.run(request.question)
        return {"question": request.question, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")
