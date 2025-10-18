MAIN=main.py

model:
	rm -rf images
	mkdir -p data
	PREDICT_NEXT_DAY=true python3 $(MAIN)

run:
	python3 use.py

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