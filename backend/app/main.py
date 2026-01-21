
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()







# @app.get("/health")
# async def root():
#     return {"message": "ok"}

# @app.get("/chat")

# async def chatting():
#     return {"message" : "hey Im bioChat! How can i help you"}


# getting user's data and sending it to api and sending back responses




class user(BaseModel):
    user_input = input("You :")



@app.post("/chat")
async def messaging(msg: user):
    return f"you asked: ${msg}" 