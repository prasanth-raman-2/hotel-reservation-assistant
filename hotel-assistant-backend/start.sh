#!/bin/bash
uvicorn app.main:app --reload --port 8000 --reload-dir app
