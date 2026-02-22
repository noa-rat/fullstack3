// network.js - מעין "שכבת רשת" מדומה הנועדה לשמש יחד עם FXMLHttpRequest.
// הקוד מייצר האצה מלאכותית (delay) לעיתים ירידות (drop) של חבילות,
// כך שניתן לבדוק כיצד האפליקציה מטפלת ברשת לא יציבה.
// אם דרך זה רוצים להריץ בקשות ממשיות, `fetch` משמש כגיבוי.

class Network {
    // האם יש "לזרוק" את הבקשה (לא לספק תשובה)?
    // ההסתברות אקראית בין 10% ל-50% לכל קריאה.
    static _shouldDrop() {
        const p = 0.1 + Math.random() * 0.4;
        return Math.random() < p;
    }

    // מחזיר זמן עיכוב רנדומלי (במילישניות) כדי לדמות רשת איטית.
    static _randomDelay() {
        // בין שנייה ל-שלוש שניות
        return 1000 + Math.floor(Math.random() * 2000);
    }

    // פונקציית כניסה שמשמיעה בקשות ל"רשת".
    // הפרמטר xhr הוא הדומיין של FXMLHttpRequest שמבקש את השליחה.
    // requestData מכיל {
    //    url, method, body
    // }
    static sendRequest(xhr, requestData) {
        const { url, method, body } = requestData;

        // קודם כל, בדיקה אם נפל המזל – נזרוק את הבקשה ונפסיק כאן
        if (Network._shouldDrop()) {
            console.warn('Network: dropping request to', url);
            return;
        }

        // הפונקציה שתעביר בפועל את הבקשה לאחר עיכוב
        const deliver = () => {
            // אם הגוף הוא JSON string, נפרש אותו לשם הנוחות
            const parsedBody = (body && typeof body === 'string') ? JSON.parse(body) : body;

            // לפני שליחת fetch אמיתי, נתמוך ב"שרתי חיקוי" שמוגדרים בדף
            // (AuthServer ו-NotesServer). הם מוגדרים כעולמים ומשמשים במקום
            // שרת אמיתי.
            if (window.AuthServer && url.startsWith('/auth')) {
                AuthServer.handleRequest(xhr, url, parsedBody, method);
                return;
            }
            if (window.NotesServer && url.startsWith('/notes')) {
                NotesServer.handleRequest(xhr, url, parsedBody, method);
                return;
            }

            // אם לא נמצא שרת חיקוי, ננסה לשלוח קריאה אמיתית ב-fetch.
            fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            })
            .then(res => res.text().then(text => xhr.handleResponse(res.status, text)))
            .catch(err => xhr.handleResponse(500, JSON.stringify({ error: err.message })));
        };

        // קבע עיכוב אקראי והעבר את הבקשה לאחריו
        const delay = Network._randomDelay();
        setTimeout(deliver, delay);
    }
}

// חשוף את האובייקט כגלובלי, כך שאפשר לקרוא אליו מכל מקום
window.Network = Network;
