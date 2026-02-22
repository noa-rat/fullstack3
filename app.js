// app.js - handles template rendering and high-level app flow

const app = document.getElementById('app');
let currentNoteId = null;

function showTemplate(id) {
    const tpl = document.getElementById(id);
    app.innerHTML = '';
    app.appendChild(document.importNode(tpl.content, true));
    bindEvents(id);
}

// simple loader overlay
function showLoader() {
    if (!document.getElementById('loader')) {
        const div = document.createElement('div');
        div.id = 'loader';
        div.style = 'position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.6);z-index:1000;';
        div.innerHTML = '<div style="padding:10px 20px;background:#fff;border-radius:4px;box-shadow:0 0 10px rgba(0,0,0,0.2);">טוען…</div>';
        document.body.appendChild(div);
    }
}

function hideLoader() {
    const el = document.getElementById('loader');
    if (el) el.remove();
}

function bindEvents(templateId) {
    switch (templateId) {
        case 'loginTemplate':
            document.getElementById('to-register').addEventListener('click', () => showTemplate('registerTemplate'));
            document.getElementById('login-submit').addEventListener('click', () => {
                const user = document.getElementById('login-username').value;
                const pass = document.getElementById('login-password').value;
                if (!user || !pass) {
                    alert('יש להזין שם משתמש וסיסמה');
                    return;
                }
                showLoader();
                AuthServer.login(user, pass).then(result => {
                    hideLoader();
                    if (result.success) {
                        showTemplate('personalAreaTemplate');
                        document.getElementById('user-name').textContent = user;
                    } else if (result.error === 'timeout') {
                        alert('הבקשה תפגה, רשת לא זמינה. בדוק את החיבור שלך ונסה שוב');
                    } else {
                        alert('שם משתמש או סיסמה שגויים');
                    }
                });
            });
            break;
        case 'registerTemplate':
            document.getElementById('to-login').addEventListener('click', () => showTemplate('loginTemplate'));
            document.getElementById('register-submit').addEventListener('click', () => {
                const data = {
                    username: document.getElementById('reg-username').value,
                    password: document.getElementById('reg-password').value,
                    phone: document.getElementById('reg-phone').value,
                    email: document.getElementById('reg-email').value
                };
                if (!data.username || !data.password) {
                    alert('יש להזין שם משתמש וסיסמה');
                    return;
                }
                showLoader();
                AuthServer.register(data).then((result) => {
                    hideLoader();
                    if (result.success) {
                        alert('הרשמה בוצעה בהצלחה! כעת אתה יכול להתחבר');
                        showTemplate('loginTemplate');
                    } else if (result.error === 'timeout') {
                        alert('הבקשה תפגה, רשת לא זמינה. בדוק את החיבור שלך ונסה שוב');
                    } else {
                        alert('הרשמה נכשלה, נסה שוב');
                    }
                });
            });
            break;
        case 'personalAreaTemplate':
            document.getElementById('new-note').addEventListener('click', () => {
                const titleInput = document.getElementById('new-note-title');
                const colorInput = document.getElementById('new-note-color');
                const title = titleInput.value.trim();
                const color = colorInput.value;
                if (title) {
                    showLoader();
                    NotesServer.create(title, color).then((result) => {
                        hideLoader();
                        if (result.error === 'timeout') {
                            alert('הבקשה תפגה, נסה שוב');
                        } else {
                            titleInput.value = '';
                            loadNotes();
                        }
                    });
                } else {
                    alert('יש להזין כותרת');
                }
            });
            document.getElementById('search').addEventListener('input', loadNotes);
            document.getElementById('sort').addEventListener('change', loadNotes);
            loadNotes();
            break;
        case 'noteViewTemplate':
            document.getElementById('back-to-list').addEventListener('click', () => showTemplate('personalAreaTemplate'));
            document.getElementById('update-note').addEventListener('click', () => {
                const title = document.getElementById('note-title-edit').value.trim();
                if (!title) {
                    alert('כותרת לא יכולה להיות ריקה');
                    return;
                }
                const color = document.getElementById('note-color-edit').value;
                const content = document.getElementById('note-content-edit').value;
                showLoader();
                NotesServer.update({ id: currentNoteId, title, color, content }).then((result) => {
                    hideLoader();
                    if (result.error === 'timeout') {
                        alert('הבקשה תפגה, נסה שוב');
                    } else {
                        showTemplate('personalAreaTemplate');
                    }
                });
            });
            document.getElementById('delete-note').addEventListener('click', () => {
                if (confirm('האם אתה בטוח שברצונך למחוק את הפתק?')) {
                    showLoader();
                    NotesServer.delete(currentNoteId).then(() => {
                        hideLoader();
                        showTemplate('personalAreaTemplate');
                    });
                }
            });
            break;
    }
}

function loadNotes() {
    showLoader();
    NotesServer.list().then(notes => {
        hideLoader();
        // apply search filter
        const searchVal = document.getElementById('search').value.toLowerCase();
        if (searchVal) {
            notes = notes.filter(n => n.title.toLowerCase().includes(searchVal));
        }
        // apply sort
        const sortVal = document.getElementById('sort').value;
        notes.sort((a,b) => {
            if (sortVal === 'title' || sortVal === 'color') {
                return (a[sortVal]||'').localeCompare(b[sortVal]||'');
            }
            if (sortVal === 'date') {
                return new Date(a.updated) - new Date(b.updated);
            }
            return 0;
        });
        const container = document.getElementById('notes-list');
        container.innerHTML = '';
        notes.forEach(n => {
            const div = document.createElement('div');
            div.className = 'note-item';
            if (n.color) div.style.borderLeft = `8px solid ${n.color}`;
            div.innerHTML = `
                <div class="info">
                    <h3>${n.title}</h3>
                    <p>${n.updated}</p>
                </div>
                <button class="delete-btn">X</button>
            `;
                div.querySelector('.delete-btn').addEventListener('click', e => {
                    e.stopPropagation();
                    showLoader();
                    NotesServer.delete(n.id).then(() => {
                        hideLoader();
                        loadNotes();
                    });
                });
                div.addEventListener('click', () => {
                    showTemplate('noteViewTemplate');
                    // Store the note ID in global variable for use by update handler
                    currentNoteId = n.id;
                    document.getElementById('note-title-edit').value = n.title;
                    document.getElementById('note-color-edit').value = n.color || '#ffffff';
                    document.getElementById('note-date').textContent = n.updated || '';
                    document.getElementById('note-content-edit').value = n.content || '';
                });
                container.appendChild(div);
            }); 
    }   ); 
}

// expose to global
window.showTemplate = showTemplate;

// initial render

// check for stored user
document.addEventListener('DOMContentLoaded', () => {
    AuthServer.init();
    const user = AuthServer.currentUser || sessionStorage.getItem('currentUser');
    if (user) {
        document.getElementById('user-name').textContent = user;
        showTemplate('personalAreaTemplate');
    } else {
        showTemplate('loginTemplate');
    }
});
