from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from groq import Groq
from pathlib import Path
import os
from dotenv import load_dotenv
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# YAHAN APNI GROQ API KEY DAALEIN
GROQ_API_KEY =os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# NAYA: Ek Message ka format kaisa hoga
class Message(BaseModel):
    role: str
    content: str

# NAYA: Ab hum sirf ek 'question' string nahi, balki Messages ki poori List maang rahe hain
class UserRequest(BaseModel):
    messages: List[Message]

@app.post("/chat")
async def chat_endpoint(request: UserRequest):
    try:
        profile_data = Path("profile.txt").read_text(encoding="utf-8")
        system_prompt_data = Path("system_prompt.txt").read_text(encoding="utf-8")
    except FileNotFoundError:
        profile_data = "Ritik Jain is a Python and AI developer."
        system_prompt_data = "You are Ritik's professional AI assistant. Always reply in English."

    full_instruction = f"{system_prompt_data}\n\nHere is the information about the candidate:\n{profile_data}"

    def generate_response():
        # 1. Sabse pehle apna system prompt set kiya
        groq_messages = [{"role": "system", "content": full_instruction}]
        
        # 2. Phir frontend se aayi purani baatein (history) list mein add ki
        for msg in request.messages:
            # Frontend mein humne bot ko "ai" bola hai, par Groq strict hai aur isko "assistant" bolta hai
            role = "assistant" if msg.role == "ai" else "user"
            groq_messages.append({"role": role, "content": msg.content})

        stream = client.chat.completions.create(
            messages=groq_messages,
            model="openai/gpt-oss-120b",
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content

    return StreamingResponse(generate_response(), media_type="text/plain")
