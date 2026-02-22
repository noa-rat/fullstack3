// db-api.js - localStorage-backed database helper for users and notes

const DB = {
    /* users */
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    },
    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    },
    findUser(username, password) {
        return this.getUsers().find(u => u.username === username && u.password === password);
    },

    /* notes */
    getNotes() {
        return JSON.parse(localStorage.getItem('notes') || '[]');
    },
    saveNote(note) {
        const notes = this.getNotes();
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
    },
    deleteNote(id) {
        let notes = this.getNotes();
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
    },
    updateNote(updated) {
        let notes = this.getNotes();
        notes = notes.map(n => (n.id === updated.id ? updated : n));
        localStorage.setItem('notes', JSON.stringify(notes));
    }
};

window.DB = DB;
