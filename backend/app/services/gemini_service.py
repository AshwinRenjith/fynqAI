
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from ..core.config import settings
import logging

class GeminiService:
    def __init__(self):
        try:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            genai.configure(api_key=settings.gemini_api_key)
            self.text_model = genai.GenerativeModel('gemini-1.5-flash')
            self.vision_model = genai.GenerativeModel('gemini-1.5-flash')
            print(f"Gemini service initialized successfully")
        except Exception as e:
            print(f"Failed to initialize Gemini service: {e}")
            raise

    def generate_text(self, prompt: str) -> str:
        try:
            response = self.text_model.generate_content(
                prompt,
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )
            return response.text
        except Exception as e:
            logging.error(f"Error calling Gemini API: {e}")
            return f"Error: Could not generate response. {e}"

    def generate_text_with_image(self, prompt: str, image_data: bytes) -> str:
        try:
            import PIL.Image
            import io
            
            # Convert bytes to PIL Image
            image = PIL.Image.open(io.BytesIO(image_data))
            
            response = self.vision_model.generate_content(
                [prompt, image],
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )
            return response.text
        except Exception as e:
            logging.error(f"Error calling Gemini API with image: {e}")
            return f"Error: Could not generate response with image. {e}"
