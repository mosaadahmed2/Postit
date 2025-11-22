FROM python:3.10-slim

WORKDIR /app

# Copy all backend files into /app
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8085"]
