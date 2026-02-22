// auth-server.js - "שרת" חיקוי לטיפול באימות ושמירת מצב המשתמש.
// משתמשים ב-FXMLHttpRequest (הגרסה שלנו של XHR) כדי לתקשר עם השרת.
// כל המתודות בקובץ זה פועלות למעשה בתוך הדפדפן, ומבטיחות שחוויית
// הממשק תהיה דומה לשרת אמיתי.

const AuthServer = {
    currentUser: null, // שם המשתמש המחובר כרגע (או null)
    // מבצע קריאה ראשונית כדי לטעון משתמש מחובר מה־sessionStorage אם קיים
    init() {
        const saved = sessionStorage.getItem('currentUser');
        if (saved) {
            AuthServer.currentUser = saved;
        }
    },
    // מחזיר את פרטי המשתמש (טלפון, דוא"ל) על פי השם הנמצא ב-currentUser.
    // משתמש כאן ב-DB.getUsers() כדי לחפש את האובייקט בתיקיית המשתמשים.
    getCurrentUserDetails() {
        const name = AuthServer.currentUser;
        if (!name) return null;
        return DB.getUsers().find(u => u.username === name) || null;
    },
    // פונקציה המבוצעת על ידי הלקוח לביצוע כניסה.
    // מחזירה Promise שמייצג סיום התהליך.
    login(username, password) {
        return new Promise(resolve => {
            const xhr = new FXMLHttpRequest();
            let isResolved = false; // מנגנון למניעת resolution כפול

            // מאזין לשינוי מצב
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && !isResolved) {
                    isResolved = true;
                    const resp = JSON.parse(xhr.responseText || '{}');
                    if (resp.success) {
                        // נרשם כניסה מוצלחת בזיכרון וסשן
                        AuthServer.currentUser = username;
                        sessionStorage.setItem('currentUser', username);
                    }
                    resolve({ success: resp.success, error: null });
                }
            };

            // במקרה של timeout (הזמן עבר מבלי שהתקבלה תשובה)
            xhr.ontimeout = () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve({ success: false, error: 'timeout' });
                }
            };

            // שליחת הבקשה לנתיב /auth/login
            xhr.open('POST', '/auth/login');
            xhr.send({ username, password });
        });
    },
    // רישום משתמש חדש. מקבל אובייקט data המכיל username,password,phone,email.
    // מבצע POST לשרת ומחזיר Promise שמוצלחת אם קיבל סטטוס 200.
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
    // פונקציה שמושתלת בספריית Network; היא זו שמבצעת את ההיגיון
    // בצד "השרת" עבור נתיבי /auth/...
    // הפרמטרים: xhr – האובייקט שמייצג את בקשת הלקוח;
    // url – הנתיב המבוקש; body – גוף הבקשה (כבר מפוענח); method – שיטת HTTP.
    handleRequest(xhr, url, body, method) {
        if (url === '/auth/login') {
            // חפש משתמש התואם שם וסיסמה
            const ok = !!DB.findUser(body.username, body.password);
            if (ok) AuthServer.currentUser = body.username; // סימן כניסה
            xhr.handleResponse(200, JSON.stringify({ success: ok }));
            return;
        }
        if (url === '/auth/register') {
            // פשוט שמור את נתוני המשתמש החדש ב"בסיס הנתונים"
            DB.saveUser(body);
            xhr.handleResponse(200, JSON.stringify({ success: true }));
            return;
        }
        // אם לא ידוע הנתיב - שלח 404
        xhr.handleResponse(404, JSON.stringify({ error: 'not found' }));
    }
};

window.AuthServer = AuthServer;
