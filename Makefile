.PHONY: install dev test backend frontend

install:
	cd packages/backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd packages/frontend && npm install

backend:
	cd packages/backend && .venv/bin/uvicorn main:app --reload --port 8000 \
		--reload-dir . \
		--reload-exclude ".venv" \
		--reload-exclude "*.pyc" \
		--reload-exclude "__pycache__" \
		--reload-exclude ".worktrees"

frontend:
	cd packages/frontend && npm run dev

dev:
	$(MAKE) backend &
	$(MAKE) frontend &
	wait

test:
	curl http://localhost:8000/health
