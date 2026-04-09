import os
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import HTTPException
from better_profanity import profanity

# ✅ Load environment variables
load_dotenv()

# ✅ Initialize OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# ✅ Load profanity dictionary
profanity.load_censor_words()


async def ai_check(text: str) -> bool:
    """
    AI moderation using OpenRouter (Llama 70B)
    Returns True if SAFE, False if UNSAFE
    """

    prompt = f"""
You are a strict validator for a skill exchange platform.

Your job is to check whether the given input is a valid skill that a person can teach or learn.

Valid skills include:
- programming (e.g., Java, React)
- design (e.g., UI/UX, Photoshop)
- communication (e.g., public speaking)
- academic subjects (e.g., mathematics, physics)
- hobbies (e.g., guitar, cooking)

Invalid inputs include:
- random sentences
- abusive or harmful text
- meaningless words
- unrelated phrases

Rules:
- Be strict
- If unsure, mark as UNSAFE

Reply ONLY in JSON:
{{"status": "PASS"}}
or
{{"status": "UNSAFE"}}

Input: "{text}"
"""

    try:
        completion = client.chat.completions.create(
            model="google/gemini-2.5-flash-lite",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        reply = completion.choices[0].message.content.lower()

        # ✅ Safe parsing
        if "unsafe" in reply:
            return False

        return True

    except Exception as e:
        print("AI moderation error:", e)
        # ✅ Fail-safe (important)
        return True


async def check_content(text: str) -> None:
    """
    Hybrid moderation:
    1. Offline profanity filter
    2. AI moderation
    """

    if not text or not text.strip():
        return

    # ✅ Step 1: Offline profanity check
    if profanity.contains_profanity(text):
        raise HTTPException(
            status_code=400,
            detail="Inappropriate language detected. Please use respectful language.",
        )

    # ✅ Step 2: AI moderation
    is_safe = await ai_check(text)

    if not is_safe:
        raise HTTPException(
            status_code=400,
            detail="Invalid input. Please enter a valid skill (e.g., Python, React, Machine Learning).",
        )
    

async def check_chat_rating(text: str) -> None:
    """
    Hybrid moderation:
    1. Offline profanity filter
    2. AI moderation
    """

    if not text or not text.strip():
        return

    # ✅ Step 1: Offline profanity check
    if profanity.contains_profanity(text):
        raise HTTPException(
            status_code=400,
            detail="Inappropriate language detected. Please use respectful language.",
        )
    
