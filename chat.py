import os
import uuid
import time
import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import speech_recognition as sr
from deep_translator import GoogleTranslator
from gtts import gTTS
from langdetect import detect

from groq import Groq
from dotenv import load_dotenv

# Langchain and ChromaDB imports
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audio files directory
UPLOAD_DIR = Path("audio_files")
UPLOAD_DIR.mkdir(exist_ok=True)

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ChromaDB Configuration
CHROMA_DIR = Path("./chroma_db")
CHROMA_DIR.mkdir(exist_ok=True)

# Embedding model
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def load_and_store_data(data_file="disease.txt"):
    """
    Load and store data in ChromaDB vector store
    """
    loader = TextLoader(data_file)
    docs = loader.load()
    
    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, 
        chunk_overlap=50
    )
    texts = text_splitter.split_documents(docs)
    
    # Create embeddings
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    
    # Create or update ChromaDB
    db = Chroma.from_documents(
        texts, 
        embeddings, 
        persist_directory=str(CHROMA_DIR)
    )
    return db

# Initialize or load ChromaDB
try:
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    vectorstore = Chroma(
        persist_directory=str(CHROMA_DIR), 
        embedding_function=embeddings
    )
except:
    vectorstore = load_and_store_data()

class QueryModel(BaseModel):
    message: str

def detect_language(text):
    """Detect language of the input text."""
    try:
        return detect(text)
    except:
        return 'en'

def get_translator(target_lang='en'):
    """Get a translator for the specified target language."""
    return GoogleTranslator(source='auto', target=target_lang)

def text_to_speech(text, lang='en'):
    """Convert text to speech and save as an audio file."""
    try:
        # Generate unique filename
        audio_filename = f"{uuid.uuid4()}.mp3"
        filepath = UPLOAD_DIR / audio_filename
        
        # Use gTTS for text-to-speech
        tts = gTTS(text=text[:500], lang=lang, slow=False)
        tts.save(str(filepath))
        
        return audio_filename
    except Exception as e:
        print(f"Text-to-speech error: {e}")
        return None

def retrieve_context(query, top_k=3):
    """
    Retrieve relevant context from ChromaDB
    """
    try:
        # Retrieve top k most similar documents
        docs = vectorstore.similarity_search(query, k=top_k)
        
        # Combine retrieved documents into context
        context = "\n\n".join([doc.page_content for doc in docs])
        return context
    except Exception as e:
        print(f"Context retrieval error: {e}")
        return ""

def generate_groq_response(message, context=""):
    """Generate a response using Groq API with optional context."""
    try:
        # Prepare prompt with context
        full_prompt = f"""Context: {context}

        User Query: {message}

        Based on the provided context and query, please provide a helpful and informative response."""

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful medical information assistant specializing in providing clear, concise, and accurate information about diseases and health conditions. Use the provided context to inform your response."
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            model="llama3-8b-8192"
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API error: {e}")
        return "I'm sorry, but I couldn't process your request at the moment."

@app.post("/chat")
async def chat(query: QueryModel):
    """
    Process chat messages with translation and text-to-speech support.
    """
    try:
        # Detect language of input
        lang = detect_language(query.message)
        
        # Retrieve context from ChromaDB
        context = retrieve_context(query.message)
        
        # Generate response using Groq with context
        response_text = generate_groq_response(query.message, context)
        
        # Translate if not in English
        if lang != 'en':
            try:
                translator = get_translator(lang)
                response_text = translator.translate(response_text)
            except Exception as e:
                print(f"Translation error: {e}")
                lang = 'en'
        
        # Convert to speech
        audio_filename = text_to_speech(response_text, lang)
        
        return {
            "text_response": response_text,
            "context": context,
            "audio_file_path": audio_filename,
            "detected_language": lang
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            "error": str(e),
            "text_response": "Error processing request",
            "audio_file_path": None,
            "detected_language": "en"
        }

@app.post("/voice-input")
async def process_voice(file: UploadFile = File(...)):
    """
    Process voice input, transcribe, and generate a response.
    """
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    try:
        # Save uploaded audio file
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        # Initialize speech recognizer
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_file.name) as source:
            recognizer.adjust_for_ambient_noise(source)
            audio = recognizer.record(source)
        
        # Attempt transcription (with Hindi support)
        try:
            # Try Hindi first
            text = recognizer.recognize_google(audio, language="hi-IN")
            lang = 'hi'
        except:
            # Fallback to default
            text = recognizer.recognize_google(audio)
            lang = 'en'

        # Retrieve context from ChromaDB
        context = retrieve_context(text)

        # Generate response
        response_text = generate_groq_response(text, context)
        
        # Translate if needed
        if lang != 'en':
            try:
                translator = get_translator(lang)
                response_text = translator.translate(response_text)
            except Exception as e:
                print(f"Translation error: {e}")
                lang = 'en'

        # Convert to speech
        audio_filename = text_to_speech(response_text, lang)

        return {
            "transcribed_text": text,
            "text_response": response_text,
            "context": context,
            "audio_file_path": audio_filename,
            "detected_language": lang
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            "error": str(e),
            "text_response": "Error processing request",
            "audio_file_path": None,
            "detected_language": "en"
        }
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """
    Retrieve audio files.
    """
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

@app.post("/update-database")
async def update_database(file: UploadFile = File(...)):
    """
    Update the ChromaDB with a new text file
    """
    try:
        # Save uploaded file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.txt')
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        # Reload database with new file
        global vectorstore
        vectorstore = load_and_store_data(temp_file.name)

        # Clean up temporary file
        os.unlink(temp_file.name)

        return {"status": "Database updated successfully"}
    except Exception as e:
        print(f"Database update error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)