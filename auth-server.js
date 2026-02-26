// שרת המשתמשים

const AuthServer = {

    currentUser: null, // שם המשתמש הנוכחי

    // טוען את שם המשתמש הנוכחי מהסשן-סטורג
    init() {
        const saved = sessionStorage.getItem('currentUser');
        if (saved) {
            AuthServer.currentUser = saved;
        }
    },

    // טוען את פרטי המשתמש מבסיס הנתונים
    getCurrentUserDetails() {
        const name = AuthServer.currentUser;
        if (!name) return null;
        return DB.getUsers().find(u => u.username === name) || null;
    },

    // התחברות
    login(username, password) {
        // מבצע פעולה אסינכרונית שלא עוצרת את ריצת התוכנית
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false; // מונע טיפול כפול בתגובה או בפקיעת הטיימר

            // מאזין לשינויים במצב הבקשה
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    const resp = JSON.parse(xhr.responseText || '{}');
                    if (resp.success) {
                        // מעדכן את שם המשתמש הנוכחי
                        AuthServer.currentUser = username;
                        sessionStorage.setItem('currentUser', username);
                    }

                    // מחזיר את התגובה ללקוח
                    resolve({ success: resp.success, error: null });
                }
            };

            // במקרה של פקיעת טיימר ההמתנה לתגובה
            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                     // מחזיר ללקוח שגיאה
                    resolve({ success: false, error: 'timeout' });
                }
            };

            // שולח בקשת התחברות לשרת
            xhr.open('POST', '/auth/login');
            xhr.send({ username, password });
        });
    },

    // הרשמה
    register(data) {
        // מבצע פעולה אסינכרונית שלא עוצרת את ריצת התוכנית
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false;

            // מאזין לשינויים במצב הבקשה
            xhr.onreadystatechange = () => {
                // מעדכן את המשתמש בתגובת השרת
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    // מחזיר את התגובה ללקוח
                    resolve({ success: xhr.status === 200, error: null });
                }
            };

            // במקרה של פקיעת טיימר ההמתנה לתגובה
            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                    // מחזיר ללקוח שגיאה
                    resolve({ success: false, error: 'timeout' });
                }
            };

            // שולח בקשת הרשמה לשרת
            xhr.open('POST', '/auth/register');
            xhr.send(data);
        });
    },

    // מטפל בבקשות הרשמה או התחברות
    handleRequest(xhr, url, body, method) {
        // התחברות
        if (url === '/auth/login') {
            const ok = !!DB.findUser(body.username, body.password); // מחפש משתמש תואם שם וסיסמה
            if (ok) AuthServer.currentUser = body.username; // אם קיים, מעדכן את שם המשתמש הנוכחי
            xhr.handleResponse(200, JSON.stringify({ success: ok })); // מחזיר תשובה וגורם למאזין האירועים של הלקוח לפעול
            return;
        }

        // הרשמה
        if (url === '/auth/register') {
            DB.saveUser(body); // שומר את המשתמש החדש בבסיס הנתונים
            xhr.handleResponse(200, JSON.stringify({ success: true })); // מחזיר תשובה וגורם למאזין האירועים של הלקוח לפעול
            return;
        }

        // נתיב שגוי - מחזיר קוד 404
        xhr.handleResponse(404, JSON.stringify({ error: 'not found' }));
    }
};

// גלובלי כדי לאפשר לקבצים אחרים לקרוא אליו
window.AuthServer = AuthServer;
