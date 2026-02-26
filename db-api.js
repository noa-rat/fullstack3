// בסיס הנתונים (localStorage)

const DB = {
    // משתמשים
    // מחזיר את כל המשתמשים
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    },

    // שומר משתמש חדש
    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    },

    // מחפש משתמש לפי שם וסיסמה
    findUser(username, password) {
        return this.getUsers().find(u => u.username === username && u.password === password);
    },

    // פתקים
    // מחזיר את כל הפתקים
    getNotes() {
        return JSON.parse(localStorage.getItem('notes') || '[]');
    },

    // שומר פתק חדש
    saveNote(note) {
        const notes = this.getNotes();
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
    },

    // מוחק פתק
    deleteNote(id) {
        let notes = this.getNotes();
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
    },

    // מעדכן פתק
    updateNote(updated) {
        let notes = this.getNotes();
        notes = notes.map(n => (n.id === updated.id ? updated : n));
        localStorage.setItem('notes', JSON.stringify(notes));
    }
};

// גלובלי כדי לאפשר לקבצים אחרים לקרוא אליו
window.DB = DB;
