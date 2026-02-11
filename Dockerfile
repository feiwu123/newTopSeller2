FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn -r backend/requirements.txt \
  && pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn gunicorn==21.2.0

COPY backend/ backend/
COPY frontend/ frontend/

WORKDIR /app/backend

EXPOSE 6209

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:6209", "app:app"]
