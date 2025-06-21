import os
from supabase import create_client, Client
from ..core.config import settings

class FileService:
    def __init__(self):
        self.supabase_url: str = settings.supabase_url
        self.supabase_key: str = settings.supabase_key
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    def upload_file(self, bucket_name: str, file_path: str, file_name: str) -> str:
        try:
            with open(file_path, 'rb') as f:
                res = self.supabase.storage.from_(bucket_name).upload(file_name, f.read())
            # Supabase storage upload returns a dictionary with path, id, etc.
            # We need to construct the public URL
            public_url = self.supabase.storage.from_(bucket_name).get_public_url(file_name)
            return public_url
        except Exception as e:
            print(f"Error uploading file to Supabase: {e}")
            raise e

    def download_file(self, bucket_name: str, file_name: str, destination_path: str):
        try:
            res = self.supabase.storage.from_(bucket_name).download(file_name)
            with open(destination_path, 'wb') as f:
                f.write(res)
            return destination_path
        except Exception as e:
            print(f"Error downloading file from Supabase: {e}")
            raise e

    def delete_file(self, bucket_name: str, file_name: str):
        try:
            res = self.supabase.storage.from_(bucket_name).remove([file_name])
            return res
        except Exception as e:
            print(f"Error deleting file from Supabase: {e}")
            raise e