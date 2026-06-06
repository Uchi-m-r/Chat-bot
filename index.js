# Edge-TTS produces amazing free neural speech. 
# Shifting pitch higher (+12Hz) and rate (+6%) mimics a soft, sweet companion voice!
communicate = edge_tts.Communicate(
    text=response_text,
    voice="en-US-AnaNeural",
    rate="+6%",
    pitch="+12Hz"
)