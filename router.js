// router.js - עוזר ניווט פשוט עבור ה־SPA באמצעות History API.
// כל קריאה ל־Router.go משנה גם את כתובת הדפדפן, כך שהחץ חזרה/קדימה
// יעבוד והכתובת תוכל לשמש לטעינת דף ישירה.

const Router = {
    // יש לקרוא init() בעת הטעינה הראשונית כדי לקשר לאירוע popstate.
    // האירוע מופעל כשמשתמש לוחץ back/forward או משנה את כתובת הכתובת.
    init() {
        window.addEventListener('popstate', () => {
            Router.handleLocation();
        });
    },
    // ניווט מפורש: קבל templateId (שם התבנית להציג) ואופציונלית data
    // לשימוש פנימי (כגון id של פתק). מבצע pushState כדי לשנות את ה-URL.
    go(templateId, data) {
        // בנתונים נוצר url שייראה יפה בדפדפן. הבעיה היא שבסביבת
        // file:// לא תמיד אפשר לשנות את ה-path ל"/login" כי הקורא
        // מנסה לטעון קובץ בשם /login מהדיסק, מה שיוביל לדף ריק.
        // לכן, כשאנחנו פועלים מקובץ מקומי נעבור למערכת hash קלה.
        let url = '/';
        switch (templateId) {
            case 'loginTemplate':
                url = '/login';
                break;
            case 'registerTemplate':
                url = '/register';
                break;
            case 'personalAreaTemplate':
                url = '/';
                break;
            case 'noteViewTemplate':
                if (data && data.id) url = `/notes/${data.id}`;
                break;
        }

        if (location.protocol === 'file:') {
            // לא לשנות את ה-path ב-history, נשתמש ב-hash במקום.
            // זה שומר אותנו בעמוד המקורי ומונע טעינה של "קובץ" לא קיים.
            let hash = '';
            switch (templateId) {
                case 'loginTemplate':
                    hash = '#login';
                    break;
                case 'registerTemplate':
                    hash = '#register';
                    break;
                case 'personalAreaTemplate':
                    hash = '#';
                    break;
                case 'noteViewTemplate':
                    if (data && data.id) hash = '#notes/' + data.id;
                    break;
            }
            location.hash = hash;
        } else {
            // בעזרת history.pushState נשמור את ה-state בהיסטוריה ונעדכן את הכתובת
            history.pushState({ templateId, data }, '', url);
        }

        if (window.showTemplate) window.showTemplate(templateId);
    },
    // בחינה של הכתובת הנוכחית ושליחת המשתמש למסך המתאים.
    // נקרא גם על ידי init ב-popstate וגם בזמן טעינת הדף.
    handleLocation() {
        // אם אנחנו מקובץ מקומי פשטנו את החישוב ומסתכלים על ה-hash
        if (location.protocol === 'file:') {
            const hash = location.hash.slice(1); // בלי #
            if (hash === 'login') {
                if (window.showTemplate) window.showTemplate('loginTemplate');
                return;
            }
            if (hash === 'register') {
                if (window.showTemplate) window.showTemplate('registerTemplate');
                return;
            }
            if (hash.startsWith('notes/')) {
                const parts = hash.split('/');
                const id = Number(parts[1]);
                if (!isNaN(id)) {
                    window.nextRouteNoteId = id;
                    if (window.showTemplate) window.showTemplate('noteViewTemplate');
                    return;
                }
            }
            if (window.showTemplate) window.showTemplate('personalAreaTemplate');
            return;
        }

        // מצב רגיל (http/https) – כפי שהיה קודם
        const path = location.pathname;
        if (path === '/login') {
            if (window.showTemplate) window.showTemplate('loginTemplate');
            return;
        }
        if (path === '/register') {
            if (window.showTemplate) window.showTemplate('registerTemplate');
            return;
        }
        if (path.startsWith('/notes/')) {
            const parts = path.split('/');
            const id = Number(parts[2]);
            if (!isNaN(id)) {
                // נשמור את id בצד הגלובלי כדי שאפליקציה תדע לטעון אותו
                window.nextRouteNoteId = id;
                if (window.showTemplate) window.showTemplate('noteViewTemplate');
                return;
            }
        }
        // ברירת מחדל: אזור אישי
        if (window.showTemplate) window.showTemplate('personalAreaTemplate');
    }
};

// חשוף גלובלית כדי שהקבצים האחרים יוכלו לקרוא
window.Router = Router;
