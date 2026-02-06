from fastapi import FastAPI
from pydantic import BaseModel
from backend.app.llms.llm import generatedLLMResponse

app = FastAPI()

# this is where we define what and type of message we will get. we use class here to define the shape of our input data



class chatResponse(BaseModel):
   message : str

@app.post("/chat")

async def llmResponse(req:chatResponse):
   reply = generatedLLMResponse(req.message)
   return {
      "BioChat": reply 
   }

   