"""SpeakFlow API — NVIDIA-powered business English speaking coach"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import speech, conversation, lessons, users, sessions, webhooks, leagues, notifications, translate, voicechat, recommend, vision

app = FastAPI(
    title="SpeakFlow API",
    version="2.0.0",
    description="NVIDIA-powered business English speaking coach (11 NVIDIA services)",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://speakflow.app",
        "https://speakflow-lake.vercel.app",   # current Vercel deployment
        "https://*.vercel.app",                 # preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [
    speech.router,
    conversation.router,
    lessons.router,
    users.router,
    sessions.router,
    webhooks.router,
    leagues.router,
    notifications.router,
    translate.router,
    voicechat.router,
    recommend.router,
    vision.router,
]:
    app.include_router(router)


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "powered_by": [
            "NVIDIA Riva ASR (pronunciation scoring)",
            "NVIDIA Riva ASR Multilingual (25 languages)",
            "NVIDIA NIM — Llama 3.1 70B (conversation coaching)",
            "NVIDIA Magpie TTS (Max's voice)",
            "NVIDIA Riva Translate (12 languages)",
            "NVIDIA Nemotron VoiceChat (Pro speech-to-speech)",
            "NVIDIA NIM Embeddings nv-embedqa-e5-v5 (lesson recommendations)",
            "NVIDIA Llama Guard 4 12B (content safety)",
            "NVIDIA NemoGuard 8B (topic control)",
            "NVIDIA Llama 3.2 Vision 11B (slide analysis — Pro)",
            "NVIDIA Nemotron 70B Reward (quality scoring)",
        ],
        "version": "2.0.0",
    }


@app.get("/")
def root():
    """Root endpoint — redirect hint."""
    return {
        "message": "SpeakFlow API",
        "docs": "/docs",
        "health": "/health",
    }
