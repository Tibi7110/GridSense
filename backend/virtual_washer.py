from flask import Flask, request, jsonify

app = Flask(__name__)

machine_state = {"power": "off"}


@app.route("/")
def home():
    return f"""
    <html>
    <head>
        <title>Virtual Washing Machine</title>
        <meta http-equiv="refresh" content="5"> <!-- auto-refresh every 5s -->
        <style>
            body {{ font-family: sans-serif; text-align: center; margin-top: 5em; }}
            .on {{ color: green; }}
            .off {{ color: red; }}
            a {{ padding: 10px; }}
        </style>
    </head>
    <body>
        <h1>Virtual Washing Machine</h1>
        <p>Current power state:
           <strong class="{machine_state['power']}">
               {machine_state['power'].upper()}
           </strong>
        </p>
        <p>
            <a href="/power?state=on">🟢 Turn On</a>
            <a href="/power?state=off">🔴 Turn Off</a>
        </p>
    </body>
    </html>
    """


@app.route("/power", methods=["GET"])
def power():
    state = request.args.get("state")
    if state not in ("on", "off"):
        return jsonify({"error": "Invalid state. Use ?state=on or ?state=off"}), 400

    machine_state["power"] = state

    # Auto‑redirect back to home after 1.5 s
    return f"""
    <html>
    <head>
      <meta http-equiv="refresh" content="1.5; url=/">
    </head>
    <body style="font-family:sans-serif; text-align:center; margin-top:5em;">
        <h2>Status updated ✅</h2>
        <p>Machine is now <b>{machine_state['power'].upper()}</b></p>
        <p>Returning to home...</p>
    </body>
    </html>
    """


@app.route("/status", methods=["GET"])
def status():
    return jsonify({"power": machine_state["power"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)