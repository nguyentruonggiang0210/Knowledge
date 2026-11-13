FROM python:3.12-slim
WORKDIR /app
COPY tool/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY tool/ ./tool/
VOLUME /app/data
ENV DB_PATH=/app/data/tvweb.db
CMD ["python", "tool/scheduler.py"]
