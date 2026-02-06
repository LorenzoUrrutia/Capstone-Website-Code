from flask import Flask, send_from_directory

app = Flask(__name__, static_folder=".", static_url_path="")

@app.get("/")
def home():
    return send_from_directory(".", "index.html")

@app.get("/info")
def info():
    return send_from_directory(".", "info.html")

@app.get("/<path:filename>")
def assets(filename):
    return send_from_directory(".", filename)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
