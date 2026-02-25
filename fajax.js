/*
שליחה וקבלה של נתונים בין הלקוח לשרת בלי לעצור את ריצת התוכנית
מצמיד לכל בקשה מספר מזהה, וכך יודע לדחות תשובות ישנות
*/

const RequestTracker = {
    counter: 0,     // מונה שמייצר מספר מזהה לכל בקשה
    lastSeen: {}    // עבור כל כתובת, שומר את המזהה של התגובה האחרונה שהתקבלה בה
}

class FXMLHttpRequest {
    constructor() {
        this.readyState = 0;            // מצב הבקשה
        this.method = "";               // סוג הבקשה (גט, פוסט וכדו')
        this.url = "";                  // כתובת היעד של הבקשה
        this._reqId = 0;                // מזהה הבקשה, משמש לדחיית תשובות ישנות
        this.onreadystatechange = null; // מאזין לשינויים במצב הבקשה
        this.status = 0;                // סטטוס התשובה של השרת
        this.responseText = "";         // תוכן התשובה
        this.timeout = 5000;            // טיימר המתנה לתגובה
        this.ontimeout = null;          // מאזין לסוף טיימר המתנה לתגובה
        this._timer = null;             // מזהה טיימר המתנה לתגובה 
    }

    // מפעיל את המאזין לשינויים במצב הבקשה
    _updateState() {
        if (this.onreadystatechange) {
            this.onreadystatechange();
        }
    }

    // פותח בקשה
    open(method, url) {
        this.method = method;
        this.url = url;
        this.readyState = 1; // OPENED
        this._updateState();
    }

    // שולח בקשה
    send(body = null) {
        // מייצר מזהה בקשה
        this._reqId = ++RequestTracker.counter;

        // מפעיל את הטיימר להמתנה לתגובה
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => this._handleTimeout(), this.timeout);

        // מעביר את הנתונים לשליחה דרך הרשת
        const requestData = {
            method: this.method,
            url: this.url,
            body: body ? JSON.stringify(body) : null
        };
        Network.sendRequest(this, requestData);
    }

    // מטפל בתשובה מהשרת
    handleResponse(status, data) {
        // בודק האם התשובה חדשה או ישנה
        const last = RequestTracker.lastSeen[this.url] || 0;
        if (this._reqId < last) { return; }

        // שומר את מזהה הבקשה החדשה מקושר לכתובת הנוכחית
        RequestTracker.lastSeen[this.url] = this._reqId;

        // מאפס את הטיימר
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        
        // מעדכן את הנתונים של התשובה
        this.status = status;
        this.responseText = data;
        this.readyState = 4; // DONE
        this._updateState();
    }

    // מטפל בפקיעת הטיימר להמתנה לתגובה
    _handleTimeout() {
        this.readyState = 4;
        this.status = 0; // סטטוס לא התקבלה תשובה
        if (this.ontimeout) this.ontimeout();
        this._updateState();
    }
}