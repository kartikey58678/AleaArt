# Use Python 3.11 slim as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables for Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_APP=python_backend_simple.py \
    FLASK_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Upgrade pip first
RUN pip install --upgrade pip setuptools wheel

# Install Python dependencies
RUN pip install --no-cache-dir \
    torch \
    diffusers \
    transformers \
    scipy \
    flask \
    flask-cors \
    pillow \
    pymongo \
    requests \
    python-dotenv

# Copy Python backend file
COPY --chown=appuser:appuser python_backend_simple.py .

# Create generated_images directory with proper permissions
RUN mkdir -p generated_images && \
    chown -R appuser:appuser generated_images

# Switch to non-root user
USER appuser

# Expose port 8000
EXPOSE 8000

# Health check with extended start period for model loading
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=5)" || exit 1

# Run the Flask server
CMD ["python", "python_backend_simple.py"]

