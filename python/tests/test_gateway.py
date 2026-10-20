"""Tests for the synthetic local-only Python gateway."""
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from python.demo_gateway import FIXTURE, create_handler


class GatewayTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), create_handler(fixture))
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:{}".format(cls.httpd.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=2)

    def fetch(self, path, method="GET"):
        request = Request(self.base + path, method=method)
        try:
            with urlopen(request, timeout=2) as resp:
                return resp.status, json.load(resp)
        except HTTPError as exc:
            return exc.code, json.load(exc)

    def test_health_declares_synthetic(self):
        status, result = self.fetch("/health")
        self.assertEqual(status, 200)
        self.assertEqual(result["dataset"], "SYNTHETIC_ONLY")

    def test_order_and_stock(self):
        self.assertEqual(self.fetch("/orders/DEMO-0001")[1]["status"], "posted")
        self.assertEqual(self.fetch("/stock/SKU-DEMO-1")[1]["free"], 19)

    def test_unknown_and_bad_ids(self):
        self.assertEqual(self.fetch("/orders/NOPE")[0], 400)
        self.assertEqual(self.fetch("/stock/SKU-DEMO-99")[0], 404)

    def test_writes_denied(self):
        for method in ("POST", "PATCH", "PUT", "DELETE"):
            status, body = self.fetch("/orders/DEMO-0001", method=method)
            self.assertEqual(status, 405)
            self.assertEqual(body["error"], "WRITE_METHOD_FORBIDDEN")


if __name__ == "__main__":
    unittest.main()
