/*
 A minimal request tracker: assigns a sequential id to each send and keeps
 track of the last processed id per URL. Responses with an older id are
 silently ignored.
*/
const RequestTracker = {
    counter: 0,
    lastSeen: {} // map url -> id
};

class FXMLHttpRequest {
    constructor() {
        this.readyState = 0;
        this.status = 0;
        this.responseText = "";
        this.onreadystatechange = null;
        this.ontimeout = null;

        this.method = "";
        this.url = "";
        this.timeout = 5000; // default 5 seconds
        this._timer = null;
        this._reqId = 0;
    }

    open(method, url) {
        this.method = method;
        this.url = url;
        this.readyState = 1; // OPENED
        this._updateState();
    }

    send(body = null) {
        // assign sequential id for this request
        this._reqId = ++RequestTracker.counter;

        // set up timeout
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => this._handleTimeout(), this.timeout);

        // המרת המידע ל-JSON לפני השליחה לרשת
        const requestData = {
            method: this.method,
            url: this.url,
            body: body ? JSON.stringify(body) : null
        };

        Network.sendRequest(this, requestData);
        console.log("FAJAX: Request sent to Network...", this.url, "id", this._reqId);
    }

    // מתודה שה-Network יקרא לה כשהתגובה חוזרת מהשרת
    handleResponse(status, data) {
        // ignore if a newer request for same URL has already completed
        const last = RequestTracker.lastSeen[this.url] || 0;
        if (this._reqId < last) {
            console.warn('FAJAX: ignoring stale response', this.url, this._reqId, '<', last);
            return;
        }
        RequestTracker.lastSeen[this.url] = this._reqId;

        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        this.status = status;
        this.responseText = data;
        this.readyState = 4; // DONE
        this._updateState();
    }

    _handleTimeout() {
        this.readyState = 4;
        this.status = 0;
        if (this.ontimeout) this.ontimeout();
        this._updateState();
    }

    _updateState() {
        if (this.onreadystatechange) {
            this.onreadystatechange();
        }
    }
}