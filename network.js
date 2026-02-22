// network.js - wrapper around fetch to be used by FXMLHttpRequest

class Network {
    static _shouldDrop() {
        // choose a random drop chance between 10% and 50%
        const p = 0.1 + Math.random() * 0.4;
        return Math.random() < p;
    }

    static _randomDelay() {
        // 1 to 3 seconds
        return 1000 + Math.floor(Math.random() * 2000);
    }

    static sendRequest(xhr, requestData) {
        const { url, method, body } = requestData;

        if (Network._shouldDrop()) {
            console.warn('Network: dropping request to', url);
            return;
        }

        const deliver = () => {
            const parsedBody = (body && typeof body === 'string') ? JSON.parse(body) : body;

            if (window.AuthServer && url.startsWith('/auth')) {
                AuthServer.handleRequest(xhr, url, parsedBody, method);
                return;
            }
            if (window.NotesServer && url.startsWith('/notes')) {
                NotesServer.handleRequest(xhr, url, parsedBody, method);
                return;
            }
            fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            })
            .then(res => res.text().then(text => xhr.handleResponse(res.status, text)))
            .catch(err => xhr.handleResponse(500, JSON.stringify({ error: err.message })));
        };

        const delay = Network._randomDelay();
        setTimeout(deliver, delay);
    }
}

window.Network = Network;
