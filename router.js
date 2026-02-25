// מנווט לתבנית המתאימה לפי הכתובת
// מעדכן את הכתובת בהתאם לתבנית שנבחרה

const Router = {
    // טוען את מאזין האירועים כדי לטפל בניווט
    init() {
        window.addEventListener('popstate', () => {
            Router.handleLocation();
        });
    },

    // מקבל שם של תבנית ומנווט לכתובת המתאימה
    go(templateId, data) {
        let path = '';
        switch (templateId) {
            case 'loginTemplate':
                path = 'login';
                break;
            case 'registerTemplate':
                path = 'register';
                break;
            case 'noteViewTemplate':
                if (data && data.id) path = `notes/${data.id}`;
                break;
            case 'personalAreaTemplate':
            default:
                path = ''; // האזור האישי הוא ברירת המחדל 
        }

        // משתמש בסימן סולמית כדי לייצג כתובת של תבנית
        if (location.protocol === 'file:') {
            location.hash = path ? `#${path}` : '#';
        } else {
            // בשרת רגיל, נשתמש בסלאש רגיל
            const url = `/${path}`;
            // הוספת היסטוריה כדי לאפשר ניווט אחורה וקדימה
            history.pushState({ templateId, data }, '', url);
        }   

        // מציג התבנית המתאימה
        if (window.showTemplate) window.showTemplate(templateId);
    },

    // מנווט את המשתמש לתבנית המתאימה לפי הכתובת הנוכחית
    handleLocation() {
        let route = (location.protocol === 'file:') 
                        ? location.hash.slice(1) 
                        : location.pathname.startsWith('/')
                            ? location.pathname.slice(1) 
                            : location.pathname;
        
        if (route === 'login') {
            if (window.showTemplate) window.showTemplate('loginTemplate');
            return;
        }
        if (route === 'register') {
            if (window.showTemplate) window.showTemplate('registerTemplate');
            return;
        }
        if (route.startsWith('notes/')) {
            const parts = route.split('/');
            const id = Number(parts[1]);
            if (!isNaN(id)) {
                window.nextRouteNoteId = id;
                if (window.showTemplate) window.showTemplate('noteViewTemplate');
                return;
            }
        }

        // ברירת המחדל היא האזור האישי
        if (window.showTemplate) window.showTemplate('personalAreaTemplate');
    }
};

// גלובלי כדי שהקבצים האחרים יוכלו לקרוא
window.Router = Router;
