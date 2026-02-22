// notes-server.js - fake notes backend, stored in localStorage and accessed via FXMLHttpRequest

const NotesServer = {
    list() {
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    resolve(JSON.parse(xhr.responseText || '[]'));
                }
            };
            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve([]);
                }
            };
            xhr.open('GET', '/notes/list');
            xhr.send();
        });
    },
    create(title, color) {
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    resolve(JSON.parse(xhr.responseText));
                }
            };
            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve({ error: 'timeout' });
                }
            };
            xhr.open('POST', '/notes/create');
            xhr.send({ title, color });
        });
    },
    update(note) {
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    resolve(JSON.parse(xhr.responseText));
                }
            };
            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve({ error: 'timeout' });
                }
            };
            xhr.open('PUT', `/notes/${note.id}`);
            xhr.send(note);
        });
    },
    delete(id) {
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    resolve();
                }
            };
            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve();
                }
            };
            xhr.open('DELETE', `/notes/${id}`);
            xhr.send({ id });
        });
    },
    handleRequest(xhr, url, body, method) {
        // ensure user is logged-in
        const user = AuthServer.currentUser;
        if (!user) {
            xhr.handleResponse(401, JSON.stringify({ error: 'not authenticated' }));
            return;
        }

        if (url === '/notes/list') {
            const all = DB.getNotes();
            const mine = all.filter(n => n.user === user);
            xhr.handleResponse(200, JSON.stringify(mine));
            return;
        }
        if (url === '/notes/create' && method === 'POST') {
            const note = {
                id: Date.now(),
                title: body.title,
                color: body.color || '',
                updated: new Date().toLocaleString(),
                content: '',
                user
            };
            DB.saveNote(note);
            xhr.handleResponse(200, JSON.stringify(note));
            return;
        }
        // support /notes/:id for update and delete
        const match = url.match(/^\/notes\/(\d+)$/);
        if (match) {
            const noteId = Number(match[1]);
            if (method === 'PUT') {
                const updated = {
                    id: noteId,
                    title: body.title,
                    color: body.color,
                    content: body.content,
                    updated: new Date().toLocaleString(),
                    user
                };
                DB.updateNote(updated);
                xhr.handleResponse(200, JSON.stringify({ success: true, note: updated }));
                return;
            }
            if (method === 'DELETE') {
                DB.deleteNote(noteId);
                xhr.handleResponse(200, JSON.stringify({ success: true }));
                return;
            }
        }
        xhr.handleResponse(404, JSON.stringify({ error: 'not found' }));
    }
};

window.NotesServer = NotesServer;
