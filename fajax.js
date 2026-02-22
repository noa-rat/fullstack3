/*
 מערכת פשוטה למעקב אחרי בקשות (Request Tracker).
 מעבירים לכל קריאה מספר מזהה עוקב, וכאשר המערכת מקבלת תגובה
 מכל שרת היא משווה את המזהה האחרון שנרשם עבור אותו נתיב.
 אם תגובה נכנסת היא\"ישנה\" (הינדסה אחרי בקשה חדשה יותר לאותו URL),
 היא תידחה ללא הודעה. זה מונע מצב שבו רשת איטית מחזירה תשובה
 מאוחרת שמטשטשת על התוצאה העדכנית.
*/
const RequestTracker = {
    counter: 0,            // מונה גלובלי שמייצר מזהה ייחודי לכל קריאה
    lastSeen: {}           // מפה מ-URL למזהה הבקשה האחרונה שטופלה עבורו
};

// מחלקה שמחקה את התנהגות האובייקט XMLHttpRequest
// אך מוסיפה התנהגות מותאמת עבור הסימולציה שלנו (timeout, tracking).
class FXMLHttpRequest {
    constructor() {
        // שדות ציבוריים שדומים לאלו של XHR
        this.readyState = 0;      // 0=UNSENT, 1=OPENED, 4=DONE
        this.status = 0;          // סטטוס HTTP ביציאה / קוד שגיאה
        this.responseText = "";  // גוף התשובה
        this.onreadystatechange = null; // callback למעקב אחרי readyState
        this.ontimeout = null;    // callback בעת תפוגת זמן

        // מאפייני בקשה משלנו
        this.method = "";        // GET/POST/PUT/DELETE וכו'
        this.url = "";           // הנתיב שנשלח אליו
        this.timeout = 5000;      // זמן ברירת מחדל לחכות (במילישניות)
        this._timer = null;       // מזהה של setTimeout לשם ביטול
        this._reqId = 0;          // מזהה אינטרימרי שנלקח מ-RequestTracker
    }

    // מקביל ל-open של XHR. מאחסן את השיטה והכתובת
    // ומעדכן את מצב ה־readyState ל־1 (OPENED).
    open(method, url) {
        this.method = method;
        this.url = url;
        this.readyState = 1; // OPENED
        this._updateState();
    }

    // שלח את הבקשה. ניתן להעביר גוף גוף (במקור אובייקט JavaScript).
    // הבקשה תעבור דרך אובייקט Network שמדמה רשת לא אמינה.
    send(body = null) {
        // קודם כל, קבל מזהה בקשה ייחודי
        this._reqId = ++RequestTracker.counter;

        // הכנס טיימר שמפעיל ontimeout אם לא קיבלנו תגובה בזמן
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => this._handleTimeout(), this.timeout);

        // ארוז את הנתונים שנשלחים לרשת במבנה JSON (Network דורש זאת)
        const requestData = {
            method: this.method,
            url: this.url,
            body: body ? JSON.stringify(body) : null
        };
        Network.sendRequest(this, requestData);
        console.log("FAJAX: Request sent to Network...", this.url, "id", this._reqId);
    }

    // המתודה שקורא לו `Network` כאשר מגיעה תשובה מה"שרת".
    // הפרמטרים: status - קוד HTTP, data - מחרוזת JSON או טקסט אחר.
    handleResponse(status, data) {
        // בדוק האם יש כבר תשובה חדשה יותר עבור אותו URL
        const last = RequestTracker.lastSeen[this.url] || 0;
        if (this._reqId < last) {
            // זוהי תגובה מיושנת; התעלם ממנה
            console.warn('FAJAX: ignoring stale response', this.url, this._reqId, '<', last);
            return;
        }
        // רשם את המזהה כהתגובה האחרונה עבור הנתיב הזה
        RequestTracker.lastSeen[this.url] = this._reqId;

        // נקה טיימר (לא צריך יותר להתיז ontimeout)
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        // עדכן את השדות הדומים ל-XHR
        this.status = status;
        this.responseText = data;
        this.readyState = 4; // DONE
        this._updateState();

        // אם התקבל קוד שונה מ-200 נניח שיש בעיה ברשת ונרענן את הדף.
        // זהו תוספת מבצעית שמונעת שהאפליקציה תלך למצב תקוע כששרת
        // חזרה עם שגיאה לא צפויה.
        if (status !== 200) {
            console.warn('FAJAX: non-200 status, reloading page', status);
            setTimeout(() => location.reload(), 100);
        }
    }

    // נקרא כאשר נגמר זמן ההמתנה (timeout) ללא קבלת תגובה.
    _handleTimeout() {
        this.readyState = 4;
        this.status = 0; // מצב ייחודי המשדר "לא התקבלה תשובה"
        if (this.ontimeout) this.ontimeout(); // קריאה חזרה ללקוח אם הוגדרה
        this._updateState();
        // במקרה זה גם נרענן את הדף כי הרשת כנראה נתקלה בבעיות
        console.warn('FAJAX: request timeout, reloading page');
        setTimeout(() => location.reload(), 100);
    }

    // מוסיף שכבה לאמולציה של XHR: אם לקוח קישר ל־onreadystatechange
    // הוא יקבל קריאה בכל שינוי מצב.
    _updateState() {
        if (this.onreadystatechange) {
            this.onreadystatechange();
        }
    }
}