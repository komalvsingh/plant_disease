from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import time
from pathlib import Path
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr
from googletrans import Translator
from gtts import gTTS
import tempfile
import uuid

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update this with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for storing audio files
UPLOAD_DIR = Path("audio_files")
UPLOAD_DIR.mkdir(exist_ok=True)

# Define input schema
class QueryModel(BaseModel):
    message: str

# Initialize translator
translator = Translator()

# Load dataset
DATA_FILE = "disease.txt"


def load_and_store_data():
    loader = TextLoader(DATA_FILE)
    docs = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(docs)
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = Chroma.from_documents(texts, embeddings, persist_directory="./chroma_db")
    return db

# Load data into ChromaDB
if not os.path.exists("./chroma_db"):
    db = load_and_store_data()
else:
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

retriever = db.as_retriever()

def detect_language(text):
    """Detect the language of input text"""
    try:
        detection = translator.detect(text)
        return detection.lang
    except Exception as e:
        print(f"Language detection error: {e}")
        return 'en'

def generate_audio_response(text, lang='en'):
    """Generate audio file from text and return the filename"""
    try:
        # Generate unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = UPLOAD_DIR / filename
        
        # Generate audio file
        tts = gTTS(text=text, lang=lang)
        tts.save(str(filepath))
        
        return filename
    except Exception as e:
        print(f"Error generating audio: {e}")
        return None

@app.post("/voice-input")
async def process_voice(file: UploadFile = File(...)):
    # Create a temporary file with .wav extension
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    try:
        # Write uploaded file content
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        # Initialize speech recognizer
        recognizer = sr.Recognizer()
        
        # Convert speech to text
        with sr.AudioFile(temp_file.name) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source)
            audio = recognizer.record(source)
            
        # Try Hindi first, then English
        try:
            text = recognizer.recognize_google(audio, language="hi-IN")
            detected_lang = 'hi'
        except sr.UnknownValueError:
            try:
                text = recognizer.recognize_google(audio)
                detected_lang = 'en'
            except sr.UnknownValueError:
                raise Exception("Could not understand the audio")
        except Exception as e:
            text = recognizer.recognize_google(audio)
            detected_lang = 'en'

        # Get response from ChromaDB
        docs = retriever.get_relevant_documents(text)
        if not docs:
            response_text = "Sorry, I couldn't find an answer."
        else:
            response_text = docs[0].page_content

        # Translate response if needed
        if detected_lang == 'hi':
            try:
                response_text = translator.translate(response_text, dest='hi').text
            except Exception as e:
                print(f"Translation error: {e}")
                # Fallback to English if translation fails
                detected_lang = 'en'

        # Generate audio response
        audio_filename = generate_audio_response(response_text, detected_lang)

        return {
            "transcribed_text": text,
            "text_response": response_text,
            "audio_file_path": audio_filename,
            "detected_language": detected_lang
        }

    except Exception as e:
        print(f"Error processing voice: {e}")
        error_message = "Sorry, I encountered an error while processing your voice input. Please try again."
        error_audio = generate_audio_response(error_message, "en")
        return {
            "error": str(e),
            "text_response": error_message,
            "audio_file_path": error_audio,
            "detected_language": "en"
        }
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_file.name)
        except Exception as e:
            print(f"Error removing temp file: {e}")

@app.post("/chat")
async def chat(query: QueryModel):
    try:
        # Detect language
        detected_lang = detect_language(query.message)
        
        # Get response from ChromaDB
        docs = retriever.get_relevant_documents(query.message)
        response_text = docs[0].page_content if docs else "Sorry, I couldn't find an answer."

        # Translate response if needed
        if detected_lang == 'hi':
            try:
                response_text = translator.translate(response_text, dest='hi').text
            except Exception as e:
                print(f"Translation error: {e}")
                detected_lang = 'en'

        # Generate audio response
        audio_filename = generate_audio_response(response_text, detected_lang)

        return {
            "text_response": response_text,
            "audio_file_path": audio_filename,
            "detected_language": detected_lang
        }
    except Exception as e:
        print(f"Error in chat: {e}")
        error_message = "Sorry, I encountered an error. Please try again."
        error_audio = generate_audio_response(error_message, "en")
        return {
            "error": str(e),
            "text_response": error_message,
            "audio_file_path": error_audio,
            "detected_language": "en"
        }

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        return {"error": "Audio file not found"}
    return FileResponse(str(file_path))

def cleanup_audio_files():
    """Clean up old audio files"""
    try:
        current_time = time.time()
        for file in UPLOAD_DIR.glob("*.mp3"):
            # Remove files older than 1 hour
            if current_time - file.stat().st_mtime > 3600:
                file.unlink()
    except Exception as e:
        print(f"Error cleaning up audio files: {e}")

# Cleanup old audio files periodically
@app.on_event("startup")
async def startup_event():
    cleanup_audio_files()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)