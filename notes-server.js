// שרת הפתקים
// CRUD

const NotesServer = {
    // C (create) יצירת פתק
    create(title, color) {
        // מבצע פעולה אסינכרונית שלא תעצור את ריצת התוכנית
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            // מאזין לשינויים במצב הבקשה
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // מחזיר את הפתק החדש ללקוח
                        resolve(JSON.parse(xhr.responseText));
                    }
                    else {
                        // מחזיר ללקוח שגיאה
                        reject(xhr.status);
                    }
                }
            };

            // במקרה של פקיעת טיימר ההמתנה לתגובה
            xhr.ontimeout = () => {
                reject('timeout');
            };

            // שולח בקשה לשרת ליצירת פתק חדש
            xhr.open('POST', '/notes/create');
            xhr.send({ title, color });
        });
    },

    // R (read) שליפת פתק בודד
    get(id) {
        // מבצע פעולה אסינכרונית שלא תעצור את ריצת התוכנית
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            // מאזין לשינויים במצב הבקשה
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // מחזיר את הפתק המבוקש ללקוח
                        resolve(JSON.parse(xhr.responseText || '{}'));
                    }
                    else {
                        // מחזיר ללקוח שגיאה
                        reject(xhr.status);
                    }
                }
            };

            // במקרה של פקיעת טיימר ההמתנה לתגובה
            xhr.ontimeout = () => {
                reject('timeout');
            };

            // שולח בקשה לשרת לקבלת פתק
            xhr.open('GET', `/notes/${id}`);
            xhr.send();
        });
    },

    // R (read) שליפת כל הפתקים
    list() {
        // מבצע פעולה אסינכרונית שלא תעצור את ריצת התוכנית
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            // מאזין לשינויים במצב הבקשה
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // מחזיר את רשימת הפתקים ללקוח
                        resolve(JSON.parse(xhr.responseText || '[]'));
                    } else {
                        // מחזיר ללקוח שגיאה
                        reject(xhr.status);
                    }
                }
            };

            // במקרה של פקיעת טיימר ההמתנה לתגובה
            xhr.ontimeout = () => {
                reject('timeout');
            };

            // שולח בקשה לשרת לקבלת רשימת הפתקים
            xhr.open('GET', '/notes/list');
            xhr.send();
        });
    },

    // U (update) עדכון פתק
    update(note) {
        // מבצע פעולה אסינכרונית שלא תעצור את ריצת התוכנית
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            // מאזין לשינויים במצב הבקשה
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // מחזיר את הפתק המעודכן ללקוח
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        // מחזיר ללקוח שגיאה
                        reject(xhr.status);
                    }
                }
            };

            // במקרה של פקיעת טיימר ההמתנה לתגובה
            xhr.ontimeout = () => {
                reject('timeout');
            };

            // שולח בקשה לשרת לעדכון הפתק
            xhr.open('PUT', `/notes/${note.id}`);
            xhr.send(note);
        });
    },

    // D (delete) מחיקה
    delete(id) {
        // מבצע פעולה אסינכרונית שלא תעצור את ריצת התוכנית
        return new Promise((resolve, reject) => {
            const xhr = new FXMLHttpRequest();

            // מאזין לשינויים במצב הבקשה
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // מחזיר ללקוח
                        resolve();
                    }
                    else {
                        // מחזיר ללקוח שגיאה
                        reject(xhr.status);
                    }
                }
            };

            // במקרה של פקיעת טיימר ההמתנה לתגובה
            xhr.ontimeout = () => {
                reject('timeout');
            };

            // שולח בקשה לשרת למחיקת פתק
            xhr.open('DELETE', `/notes/${id}`);
            xhr.send({ id });
        });
    },

    // מטפל בבקשות יצירה, שליפה, עדכון ומחיקה של פתקים
    handleRequest(xhr, url, body, method) {
        // בודק אם קיים משתמש מחובר
        const user = AuthServer.currentUser;
        if (!user) {
            // אם אין משתמש מחובר, מחזיר ללקוח שגיאה - קוד 401
            xhr.handleResponse(401, JSON.stringify({ error: 'not authenticated' }));
            return;
        }

        // Get /notes/list – שליפת רשימת הפתקים
        if (url === '/notes/list') {
            const all = DB.getNotes();
            // מסנן רק את הפתקים של המשתמש הנוכחי
            const mine = all.filter(n => n.user === user);
            // מחזיר את רשימת הפתקים של המשתמש ללקוח
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

            // שומר את הפתק בבסיס הנתונים
            DB.saveNote(note);
            // מחזיר את הפתק החדש ללקוח
            xhr.handleResponse(200, JSON.stringify(note));
            return;
        }
        
        // פעולות על פתק קיים – עדכון, שליפה ומחיקה
        // ביטוי רגולרי המשמש לשליפת מזהה הפתק מהכתובת
        const match = url.match(/^\/notes\/(\d+)$/);
        if (match) {
            const noteId = Number(match[1]);

            // GET /notes/:id – שליפת פתק בודד
            if (method === 'GET') {
                const all = DB.getNotes();
                // מחפש פתק עם אותו מזהה השייך למשתמש הנוכחי
                const found = all.find(n => n.id === noteId && n.user === user);
                if (found) {
                    // מחזיר את הפתק ללקוח
                    xhr.handleResponse(200, JSON.stringify(found));
                } else {
                    // מחזיר שגיאה ללקוח
                    xhr.handleResponse(404, JSON.stringify({ error: 'not found' }));
                }
                return;
            }

            // PUT /notes/:id – עדכון פתק 
            if (method === 'PUT') {
                const updated = {
                    id: noteId,
                    title: body.title,
                    color: body.color,
                    content: body.content,
                    updated: new Date().toLocaleString(),
                    user
                };

                // מעדכן את הפתק בבסיס הנתונים
                DB.updateNote(updated);
                // מחזיר את הפתק המעודכן ללקוח
                xhr.handleResponse(200, JSON.stringify({ success: true, note: updated }));
                return;
            }

            // DELETE /notes/:id – מחיקת פתק
            if (method === 'DELETE') {
                // מוחק את הפתק מבסיס הנתונים
                DB.deleteNote(noteId);
                // מחזיר תשובה ללקוח
                xhr.handleResponse(200, JSON.stringify({ success: true }));
                return;
            }
        }

        // אם לא קיים פתק כזה, מחזיר שגיאה
        xhr.handleResponse(404, JSON.stringify({ error: 'not found' }));
    }
};

// גלובלי כדי לאפשר לקבצים אחרים לקרוא אליו
window.NotesServer = NotesServer;
