import os
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise SystemExit("OPENROUTER_API_KEY is not set. Set it, then run this script again.")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

completion = client.chat.completions.create(
    model="google/gemini-2.5-flash-lite",
    messages=[
        {"role": "user", "content": "Check if this message is safe: you are stupid"}
    ],
    
)
print("KEY:", os.getenv("OPENROUTER_API_KEY"))

print(completion.choices[0].message.content)
