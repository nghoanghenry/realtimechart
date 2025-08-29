# Use uv slim image (includes /bin/sh and is Docker-friendly)
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Copy and install Python dependencies using uv
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

# Copy the rest of the app source code
COPY . .

# Expose the port the Flask app will run on
EXPOSE 5001

# Start the Flask app with code reload enabled
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000", "--reload"]
