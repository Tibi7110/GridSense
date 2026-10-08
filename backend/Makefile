MAIN=main.py
PYTHON ?= $(if $(wildcard venv/bin/python),venv/bin/python,python3)

model:
	mkdir -p data
	MPLBACKEND=Agg PREDICT_NEXT_DAY=true $(PYTHON) $(MAIN)

run:
	python3 use.py

server:
	venv/bin/python virtual_washer.py

power:
	python3 client.py

virtual:
	python3 virtual_washer.py

git:
	rm -rf __pycache__/
	rm -rf data/
	git pull --no-rebase
	git add .
	clear
	git commit -m "Latest version"
	git push origin Tibi
