"""Service wrapper around Google Gemini APIs."""

from __future__ import annotations

import json
from typing import Any, Dict, Iterable, Optional

import anyio
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPICallError
from tenacity import AsyncRetrying, RetryError, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.utils.logger import get_logger


class GeminiServiceError(RuntimeError):
	"""Raised when Gemini service calls fail after retries."""


class GeminiService:
	"""Utility methods for interacting with Gemini Vision and Text models."""

	def __init__(self, api_key: Optional[str] = None) -> None:
		settings = get_settings()
		genai.configure(api_key=api_key or settings.gemini_api_key)
		self._vision_model = genai.GenerativeModel("gemini-pro-vision")
		self._text_model = genai.GenerativeModel("gemini-pro")
		self._logger = get_logger(__name__)

	async def extract_from_image(self, image_bytes: bytes, *, mime_type: str = "image/png") -> Dict[str, Any]:
		"""Extract structured information from an image using Gemini Vision."""

		contents = [
			{
				"mime_type": mime_type,
				"data": image_bytes,
			},
			{
				"text": (
					"Identify the question shown in the image and return a JSON object with "
					"fields: question, important_concepts (list), diagrams_present (bool), and annotations."
				),
			},
		]
		response_text = await self._invoke(self._vision_model, contents, operation_name="extract_from_image")
		return self._parse_json_payload(response_text)

	async def extract_from_text(self, prompt: str) -> Dict[str, Any]:
		"""Extract structured details from plain text using Gemini Pro."""

		instruction = (
			"Parse the question below and respond only with JSON in the shape: {"
			"'question': str, 'important_concepts': [str], 'hint': str}.\n\n"
			f"Question: {prompt}"
		)
		response_text = await self._invoke(self._text_model, instruction, operation_name="extract_from_text")
		return self._parse_json_payload(response_text)

	async def generate_answer(self, prompt: str) -> str:
		"""Generate a step-by-step answer using Gemini Pro."""

		response_text = await self._invoke(self._text_model, prompt, operation_name="generate_answer")
		return response_text

	async def _invoke(self, model: genai.GenerativeModel, content: Any, *, operation_name: str) -> str:
		retry = AsyncRetrying(
			stop=stop_after_attempt(3),
			wait=wait_exponential(multiplier=1, min=2, max=10),
			retry=retry_if_exception_type(GoogleAPICallError),
			reraise=True,
		)

		async for attempt in retry:  # pragma: no branch - controlled by tenacity
			with attempt:
				self._logger.info("Calling Gemini", extra={"operation": operation_name})
				response = await anyio.to_thread.run_sync(model.generate_content, content)
				normalized = self._normalise_response(response)
				if not normalized:
					raise GeminiServiceError("Empty response from Gemini")
				return normalized

		raise GeminiServiceError(f"Gemini call failed for operation {operation_name}")

	def _normalise_response(self, response: Any) -> str:
		if response is None:
			return ""
		if hasattr(response, "text") and response.text:
			return str(response.text)
		if hasattr(response, "candidates"):
			for candidate in response.candidates:  # type: ignore[attr-defined]
				if candidate.content and getattr(candidate.content, "parts", None):
					return "".join(part.text for part in candidate.content.parts if getattr(part, "text", None))
		if isinstance(response, Iterable) and not isinstance(response, (str, bytes, dict)):
			return "".join(str(item) for item in response)
		if isinstance(response, dict):
			return json.dumps(response)
		return str(response)

	def _parse_json_payload(self, payload: str) -> Dict[str, Any]:
		try:
			return json.loads(payload)
		except json.JSONDecodeError as exc:  # pragma: no cover - defensive
			self._logger.error("Failed to parse Gemini JSON payload", extra={"error": str(exc)})
			raise GeminiServiceError("Gemini response was not valid JSON") from exc
