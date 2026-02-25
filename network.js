// מדמה נפילות ועיכובים אקראיים של הודעות ברשת

class Network {
    // מפיל הודעה בהסתברות אקראית בין 10% ל-50%
    static _shouldDrop() {
        const p = 0.1 + Math.random() * 0.4;
        return Math.random() < p;
    }

    // מחזיר זמן עיכוב אקראי בין שניה ל-3 שניות
    static _randomDelay() {
        return 1000 + Math.floor(Math.random() * 2000);
    }

    // שולחת הודעות עם נפלות ועיכובים אקראיים
    static sendRequest(xhr, requestData) {
        const { url, method, body } = requestData;

        // נפילה אקראית
        if (Network._shouldDrop()) { return; }

        // העברת הבקשה
        const deliver = () => {
            // המרת הבקשה למחרוזת
            const parsedBody = (body && typeof body === 'string') ? JSON.parse(body) : body;

            // שליחה לשרת המשתמשים
            if (window.AuthServer && url.startsWith('/auth')) {
                AuthServer.handleRequest(xhr, url, parsedBody, method);
                return;
            }

            // שליחה לשרת הפתקים
            if (window.NotesServer && url.startsWith('/notes')) {
                NotesServer.handleRequest(xhr, url, parsedBody, method);
                return;
            }
        };

        // עיכוב אקראי
        const delay = Network._randomDelay();
        setTimeout(deliver, delay);
    }
}

// גלובלי כדי לאפשר לקבצים אחרים לקרוא אליו
window.Network = Network;
