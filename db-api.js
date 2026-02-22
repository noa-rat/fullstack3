// db-api.js - ממשק פשוט ל־localStorage שמשמש כ"בסיס נתונים".
// מכיל פונקציות קריאה/כתיבה למשתמשים ולפתקים. אין כאן לוגיקת אבטחה או
// שאילתה מתוחכמת; הכל נחזה בטרנזקציות של מערכים.

const DB = {
    /* ---- משתמשים ---- */
    // מחזיר מערך של כל המשתמשים שנשמרו ב־localStorage תחת המפתח 'users'.
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    },
    // מוסיף משתמש חדש לרשימה ומאחסן שוב ב־localStorage.
    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    },
    // מחפש משתמש לפי שם וסיסמה. משתמש בעיקר ל"עימות" התחברות.
    findUser(username, password) {
        return this.getUsers().find(u => u.username === username && u.password === password);
    },

    /* ---- פתקים ---- */
    // מחזיר את כל הפתקים (במערך) – סיפרנו אותם כ־JSON תחת המפתח 'notes'.
    getNotes() {
        return JSON.parse(localStorage.getItem('notes') || '[]');
    },
    // שמירת פתק חדש.
    saveNote(note) {
        const notes = this.getNotes();
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
    },
    // מחיקת פתק לפי id.
    deleteNote(id) {
        let notes = this.getNotes();
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
    },
    // עדכון פתק קיים (החלפה של האובייקט המלא).
    updateNote(updated) {
        let notes = this.getNotes();
        notes = notes.map(n => (n.id === updated.id ? updated : n));
        localStorage.setItem('notes', JSON.stringify(notes));
    }
};

// חשיפה גלובלית של האובייקט לשימוש בכל חיקוי שרת
window.DB = DB;
