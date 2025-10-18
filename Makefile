MAIN=main.py

model:
	rm -rf images
	mkdir -p data
	PREDICT_NEXT_DAY=true python3 $(MAIN)

run:
	python3 use.py

git:
	rm -rf __pycache__/
	rm -rf data/
	git pull --no-rebase
	git add .
	clear
	read -p "Add message: " input; git commit -m "$input"
	git push origin Tibi