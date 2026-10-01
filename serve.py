"""Servidor local para probar la web SIN caché: python serve.py  ->  http://127.0.0.1:8080/index.html
Multihilo y con cola de conexiones amplia: el navegador abre varias descargas a la vez y un servidor de un solo hilo
acaba rechazando alguna (ERR_CONNECTION_REFUSED), lo que dejaba la página sin scripts."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def log_message(self, *args):   # sin ruido en la consola
        pass


class Server(ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True


if __name__ == '__main__':
    with Server(('127.0.0.1', 8080), NoCache) as srv:
        print('Servidor en http://127.0.0.1:8080/index.html  (Ctrl+C para parar)')
        srv.serve_forever()
