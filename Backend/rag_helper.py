from fastapi import FastAPI, UploadFile, File, Form
import shutil
import os
import torch
import faiss
import json
from pydantic import BaseModel
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.core.prompts.prompts import SimpleInputPrompt
from llama_index.embeddings.langchain import LangchainEmbedding
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
import PyPDF2

app = FastAPI()

documents_dir = "uploaded_docs"
os.makedirs(documents_dir, exist_ok=True)

# Llama 2 model setup
system_prompt = """
You are a Q&A assistant. Your goal is to answer questions as
accurately as possible based on the instructions and context provided.
"""
query_wrapper_prompt = SimpleInputPrompt("<|USER|>{query_str}<|ASSISTANT|>")

llm = HuggingFaceLLM(
    context_window=4096,
    max_new_tokens=800,
    generate_kwargs={"temperature": 0.2},
    system_prompt=system_prompt,
    query_wrapper_prompt=query_wrapper_prompt,
    tokenizer_name="meta-llama/Llama-2-7b-chat-hf",
    model_name="meta-llama/Llama-2-7b-chat-hf",
    device_map="auto",
    model_kwargs={"torch_dtype": torch.float16, "load_in_8bit": True}
)

embed_model = LangchainEmbedding(
    HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
)

index = None  # Placeholder for document index

@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = os.path.join(documents_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": "File uploaded successfully", "filename": file.filename}

@app.post("/process_pdf/")
def process_pdf(filename: str = Form(...)):
    file_path = os.path.join(documents_dir, filename)
    if not os.path.exists(file_path):
        return {"error": "File not found"}
    
    with open(file_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        text = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
    
    global index
    documents = [text]
    index = VectorStoreIndex.from_documents(documents)
    return {"message": "PDF processed and indexed successfully"}

class QueryRequest(BaseModel):
    query: str

@app.post("/query/")
def query_rag(request: QueryRequest):
    if index is None:
        return {"error": "No documents indexed yet"}
    
    query_engine = index.as_query_engine()
    response = query_engine.query(request.query)
    return {"answer": response}
