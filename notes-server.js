// notes-server.js - "שרת" חיקוי שמנהל פתקים.
// כל הנתונים נשמרים ב-localStorage, והממשק האמיתי נכנס כאן.
// המטרה היא לדמות REST API עם שיטות GET/POST/PUT/DELETE אך ללא צורך בשרת אמיתי.

const NotesServer = {
    // מושך את כל הפתקים של המשתמש המחובר (מוגדר ב-AuthServer.currentUser).
    // החזרה היא Promise שמכיל מערך אובייקטים.
    list() {
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText || '[]'));
                    } else {
                        reject(xhr.status);
                    }
                }
            };
            xhr.ontimeout = () => {
                reject('timeout');
            };
            xhr.open('GET', '/notes/list');
            xhr.send();
        });
    },
    // יוצר פתק חדש בעל כותרת וצבע. מחזיר Promise עם האובייקט שנשמר.
    create(title, color) {
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
                    else reject(xhr.status);
                }
            };
            xhr.ontimeout = () => reject('timeout');
            xhr.open('POST', '/notes/create');
            xhr.send({ title, color });
        });
    },
    // מעדכן פתק קיים (כולל תוכן וצבע). יש להעביר אובייקט note עם השדה id.
    update(note) {
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
                    else reject(xhr.status);
                }
            };
            xhr.ontimeout = () => reject('timeout');
            xhr.open('PUT', `/notes/${note.id}`);
            xhr.send(note);
        });
    },
    // מושך פתק בודד לפי id. נחוץ בעת טעינת דף עריכה ישירות.
    get(id) {
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) resolve(JSON.parse(xhr.responseText || '{}'));
                    else reject(xhr.status);
                }
            };
            xhr.ontimeout = () => reject('timeout');
            xhr.open('GET', `/notes/${id}`);
            xhr.send();
        });
    },
    // מבצע מחיקת פתק לפי id. מחזיר Promise שמסיים ללא תוכן.
    delete(id) {
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) resolve();
                    else reject(xhr.status);
                }
            };
            xhr.ontimeout = () => reject('timeout');
            xhr.open('DELETE', `/notes/${id}`);
            xhr.send({ id });
        });
    },
    // handler invoked by Network when בקשה מגיעה לנתיבי /notes.
    // מקבל את אובייקט xhr, הנתיב, הגוף המפוענח ושיטת ה-HTTP.
    handleRequest(xhr, url, body, method) {
        // וודא שמשתמש מחובר; אם לא, נחזיר 401
        const user = AuthServer.currentUser;
        if (!user) {
            xhr.handleResponse(401, JSON.stringify({ error: 'not authenticated' }));
            return;
        }

        // GET /notes/list – מחזיר את כל הפתקים של המשתמש.
        if (url === '/notes/list') {
            const all = DB.getNotes();
            const mine = all.filter(n => n.user === user);
            xhr.handleResponse(200, JSON.stringify(mine));
            return;
        }
        // POST /notes/create – יצירת פתק חדש
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
        // עבור נתיבים כמו /notes/:id – נשתמש בביטוי רגולרי
        const match = url.match(/^\/notes\/(\d+)$/);
        if (match) {
            const noteId = Number(match[1]);
            if (method === 'GET') {
                // החזרת פתק ספציפי במידה והוא שייך למשתמש
                const all = DB.getNotes();
                const found = all.find(n => n.id === noteId && n.user === user);
                if (found) {
                    xhr.handleResponse(200, JSON.stringify(found));
                } else {
                    xhr.handleResponse(404, JSON.stringify({ error: 'not found' }));
                }
                return;
            }
            if (method === 'PUT') {
                // עדכון פתק קיים
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
                // מחיקת פתק
                DB.deleteNote(noteId);
                xhr.handleResponse(200, JSON.stringify({ success: true }));
                return;
            }
        }
        // אם אין התאמה – נחזיר 404
        xhr.handleResponse(404, JSON.stringify({ error: 'not found' }));
    }
};

window.NotesServer = NotesServer;
