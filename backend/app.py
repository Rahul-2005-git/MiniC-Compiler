from flask import Flask
from flask_cors import CORS
from routes.compile import compile_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

app.register_blueprint(compile_bp, url_prefix='/api')

@app.route('/api/health')
def health():
    return {'status': 'ok', 'version': '1.0.0'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)
