SHELL := /bin/bash
.PHONY: run git
MAIN=main.py

run:
	rm -rf images
	mkdir -p data
	PREDICT_NEXT_DAY=true python3 $(MAIN)

git:
	rm -rf __pycache__/ data/
	@echo "Fetching latest from origin/Tibi..."
	@git pull --no-rebase origin Tibi || true
	@git add .
	@msg="$(MSG)"; \
	if [ -z "$$msg" ]; then \
		read -p "Add message: " msg; \
	fi; \
	if git diff --cached --quiet; then \
		echo "No changes to commit."; \
	else \
		git commit -m "$$msg"; \
	fi; \
	gid=$$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo none); \
	if [ "$$gid" = "none" ]; then \
		echo "Setting upstream to origin/Tibi"; \
		git push -u origin Tibi; \
	else \
		git push origin Tibi; \
	fi

