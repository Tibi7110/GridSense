from flask import Flask, request, jsonify

app = Flask(__name__)

machine_state = {
    "power": "off"
}

@app.route("/power", methods=["GET"])
def power():
    state = request.args.get("state")
    if state not in ("on", "off"):
        return jsonify({"error": "Invalid state. Use ?state=on or ?state=off"}), 400
    
    machine_state["power"] = state
    return jsonify({
        "status": "success",
        "power": machine_state["power"]
    })

@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "power": machine_state["power"]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)