.PHONY: setup backend frontend install-backend install-frontend

setup: install-backend install-frontend

backend:
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	cd frontend && npm start

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	cd frontend && npm install