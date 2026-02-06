from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()

user_message=""
client = OpenAI()

def generatedLLMResponse(user_message:str)->str:

    response = client.chat.completions.create(
        model="gpt-5-nano",
        messages=[{
            "role": "user", "content": user_message
        }]
    )
    return response.choices[0].message.content


