from app.core.celery_app import celery_app

@celery_app.task(acks_late=True)
def add_numbers(x, y):
    print(f"Adding {x} + {y}...")
    return x + y

@celery_app.task(acks_late=True)
def process_image(image_path):
    print(f"Processing image: {image_path}")
    # Simulate a long-running image processing task
    import time
    time.sleep(5)
    result = f"Processed {image_path} successfully."
    print(result)
    return result