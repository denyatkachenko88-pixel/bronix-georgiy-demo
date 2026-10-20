"""Local, read-only fake 1C/OData gateway. NO real ERP access or credentials."""
import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "one_c_demo.json"
SKU_PATTERN = re.compile(r"^SKU-DEMO-[0-9]+$")
ORDER_PATTERN = re.compile(r"^DEMO-[0-9]{4}$")


def create_handler(data):
    if data.get("dataset") != "SYNTHETIC_ONLY":
        raise ValueError("Only synthetic data is permitted")

    class DemoHandler(BaseHTTPRequestHandler):
        def send_json(self, status, payload):
            encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def do_GET(self):
            path = unquote(urlsplit(self.path).path)
            if path == "/health":
                return self.send_json(200, {
                    "status": "ok", "dataset": "SYNTHETIC_ONLY", "mode": "MOCK_GET_ONLY"
                })
            if path.startswith("/orders/"):
                order_id = path[len("/orders/"):]
                if not ORDER_PATTERN.fullmatch(order_id):
                    return self.send_json(400, {"error": "INVALID_ORDER_ID"})
                row = next((r for r in data["orders"] if r["number"] == order_id), None)
                return self.send_json(200, row) if row else self.send_json(404, {"error": "ORDER_NOT_FOUND"})
            if path.startswith("/stock/"):
                sku = path[len("/stock/"):]
                if not SKU_PATTERN.fullmatch(sku):
                    return self.send_json(400, {"error": "INVALID_SKU"})
                row = next((r for r in data["stock"] if r["sku"] == sku), None)
                return self.send_json(200, row) if row else self.send_json(404, {"error": "STOCK_NOT_FOUND"})
            return self.send_json(404, {"error": "NOT_FOUND"})

        def do_POST(self):
            self.send_json(405, {"error": "WRITE_METHOD_FORBIDDEN"})

        def do_PUT(self):
            self.do_POST()

        def do_PATCH(self):
            self.do_POST()

        def do_DELETE(self):
            self.do_POST()

        def log_message(self, _format, *_args):
            pass  # Synthetic demo; no user data to log.

    return DemoHandler


def main():
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    handler = create_handler(data)
    with ThreadingHTTPServer(("127.0.0.1", 8765), handler) as httpd:
        print("SYNTHETIC_1C_GATEWAY=http://127.0.0.1:8765", flush=True)
        print("READ_ONLY=true; NO_CREDENTIALS=true; NO_LIVE_1C=true", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
