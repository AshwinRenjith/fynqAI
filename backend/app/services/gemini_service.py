
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from ..core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        try:
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            genai.configure(api_key=settings.gemini_api_key)
            self.text_model = genai.GenerativeModel('gemini-1.5-flash')
            self.vision_model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("Gemini service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini service: {e}")
            raise

    def generate_text(self, prompt: str) -> str:
        try:
            logger.info(f"Generating text for prompt: {prompt[:100]}...")
            
            response = self.text_model.generate_content(
                prompt,
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )
            
            if not response.text:
                logger.error("Gemini API returned empty response")
                return "Error: Received empty response from AI service"
            
            logger.info(f"Generated response length: {len(response.text)} characters")
            return response.text
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}", exc_info=True)
            return f"Error: Could not generate response. {str(e)}"

    def generate_text_with_image(self, prompt: str, image_data: bytes) -> str:
        try:
            import PIL.Image
            import io
            
            logger.info(f"Generating text with image for prompt: {prompt[:100]}...")
            
            # Convert bytes to PIL Image
            image = PIL.Image.open(io.BytesIO(image_data))
            logger.info(f"Image loaded: {image.size} pixels, mode: {image.mode}")
            
            response = self.vision_model.generate_content(
                [prompt, image],
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )
            
            if not response.text:
                logger.error("Gemini API returned empty response for image")
                return "Error: Received empty response from AI service"
            
            logger.info(f"Generated image response length: {len(response.text)} characters")
            return response.text
            
        except Exception as e:
            logger.error(f"Error calling Gemini API with image: {str(e)}", exc_info=True)
            return f"Error: Could not generate response with image. {str(e)}"
