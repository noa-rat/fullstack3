// auth-server.js - pretend server-side API for authentication using FXMLHttpRequest

const AuthServer = {
    currentUser: null,
    init() {
        const saved = sessionStorage.getItem('currentUser');
        if (saved) {
            AuthServer.currentUser = saved;
        }
    },
    login(username, password) {
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    const resp = JSON.parse(xhr.responseText || '{}');
                    if (resp.success) {
                        AuthServer.currentUser = username;
                        sessionStorage.setItem('currentUser', username);
                    }
                    resolve({ success: resp.success, error: null });
                }
            };

            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve({ success: false, error: 'timeout' });
                }
            };

            xhr.open('POST', '/auth/login');
            xhr.send({ username, password });
        });
    },
    register(data) {
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    resolve({ success: xhr.status === 200, error: null });
                }
            };

            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve({ success: false, error: 'timeout' });
                }
            };

            xhr.open('POST', '/auth/register');
            xhr.send(data);
        });
    },
    // handler invoked by Network when a request is routed here
    handleRequest(xhr, url, body, method) {
        if (url === '/auth/login') {
            const ok = !!DB.findUser(body.username, body.password);
            if (ok) AuthServer.currentUser = body.username;
            xhr.handleResponse(200, JSON.stringify({ success: ok }));
            return;
        }
        if (url === '/auth/register') {
            DB.saveUser(body);
            xhr.handleResponse(200, JSON.stringify({ success: true }));
            return;
        }
        xhr.handleResponse(404, JSON.stringify({ error: 'not found' }));
    }
};

window.AuthServer = AuthServer;
