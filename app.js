// app.js - קובץ הליבה של ממשק המשתמש.
// כאן נטענות תבניות, נקשרים מאזינים, ומופרדות הקריאות לשרת.
// הפעילות האמיתית של האפליקציה מתרחשת דרך פונקציות מוקפדות כאן.

const app = document.getElementById('app'); // אלמנט השורש של ה־SPA
let currentNoteId = null;                   // מזהה הפתק הנוכחי בעיכראות

// מחלק את הממשק לטמפלטים משוריינים בתוך index.html.
// כל קריאה ל-showTemplate מוחקת את התוכן הקודם ומכנסת את התוכן
// של <template id="..."> המתאים. לאחר הכנסת ה־DOM, הפונקציה bindEvents
// מתקשרת את הכפתורים והשדות לפעולות JS.
function showTemplate(id) {
    const tpl = document.getElementById(id);
    app.innerHTML = '';
    app.appendChild(document.importNode(tpl.content, true));
    bindEvents(id);
}

// מנגנון "טוען" פשוט המציג שכבת חצי־שקופה עם טקסט.
// נעשה שימוש בו בכל קריאה לשרת כדי להראות למשתמש שהמערכת עובדת.
function showLoader() {
    if (!document.getElementById('loader')) {
        const div = document.createElement('div');
        div.id = 'loader';
        div.innerHTML = '<div class="loader-box">טוען…</div>';
        document.body.appendChild(div);
    }
}

function hideLoader() {
    const el = document.getElementById('loader');
    if (el) el.remove();
}

function bindEvents(templateId) {
    /*
    כוללת את כל ההתנהגות של הטפסים לפי הטמפלט שמוצג.
    השיטה switch מוודאת שברק השפעה ספציפית לכל מסך.
    */
    switch (templateId) {
        case 'loginTemplate':
            // קישור לכפתור "להרשמה" – לנווט באמצעות Router
            document.getElementById('to-register').addEventListener('click', () => Router.go('registerTemplate'));
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
                        Router.go('personalAreaTemplate');
                        document.getElementById('user-name').textContent = user;
                        const details = AuthServer.getCurrentUserDetails();
                        if (details) {
                            document.getElementById('user-phone').textContent = details.phone || '';
                            document.getElementById('user-email').textContent = details.email || '';
                        }
                    } else if (result.error === 'timeout') {
                        alert('הבקשה תפגה, רשת לא זמינה. בדוק את החיבור שלך ונסה שוב');
                    } else {
                        alert('שם משתמש או סיסמה שגויים');
                    }
                });
            });
            break;
        case 'registerTemplate':
            document.getElementById('to-login').addEventListener('click', () => Router.go('loginTemplate'));
            document.getElementById('register-submit').addEventListener('click', () => {
                // אחזור בטוח על השדות; אם הטמפלט לא נטען יש להגן
                const usernameEl = document.getElementById('reg-username');
                const passwordEl = document.getElementById('reg-password');
                const phoneEl = document.getElementById('reg-phone');
                const emailEl = document.getElementById('reg-email');
                const data = {
                    username: usernameEl ? usernameEl.value : '',
                    password: passwordEl ? passwordEl.value : '',
                    phone: phoneEl ? phoneEl.value : '',
                    email: emailEl ? emailEl.value : ''
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
                        Router.go('loginTemplate');
                    } else if (result.error === 'timeout') {
                        alert('הבקשה תפגה, רשת לא זמינה. בדוק את החיבור שלך ונסה שוב');
                    } else {
                        alert('הרשמה נכשלה, נסה שוב');
                    }
                });
            });
            break;
        case 'personalAreaTemplate':
            // בכל כניסה למסך זה נעדכן את שם המשתמש והפרטים
            const userName = AuthServer.currentUser || sessionStorage.getItem('currentUser');
            if (userName) {
                document.getElementById('user-name').textContent = userName;
                const details = AuthServer.getCurrentUserDetails();
                if (details) {
                    document.getElementById('user-phone').textContent = details.phone || '';
                    document.getElementById('user-email').textContent = details.email || '';
                }
            }

            // אפס רקעים קודמים כאשר חוזרים מרקע צבעוני
            const mainEl = document.querySelector('main');
            if (mainEl) {
                mainEl.style.backgroundColor = '';
            }
            const appEl = document.getElementById('app');
            if (appEl) {
                appEl.style.backgroundColor = '';
            }

            // מאזינים לשדות חיפוש ומיון
            document.getElementById('search').addEventListener('input', loadNotes);
            document.getElementById('sort').addEventListener('change', loadNotes);

            // מאזין לכפתור הוספת פתק
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
                        } else if (result.error) {
                            alert('שגיאה בהוספת הפתק: ' + result.error);
                        } else {
                            titleInput.value = '';
                            colorInput.value = '#ffffff';
                            // reload after creation to reflect in list
                            console.log('Note created successfully, reloading notes...');
                            setTimeout(() => {
                                loadNotes();
                            }, 100);
                        }
                    }).catch(err => {
                        hideLoader();
                        alert('שגיאה בהוספת הפתק');
                        console.error('Create error:', err);
                    });
                } else {
                    alert('יש להזין כותרת');
                }
            });

            // טען את הפתקים ברשימה
            loadNotes();
            break;
        case 'noteViewTemplate':
            // טיפול בנתיב שהתקבל מ-Router
            if (window.nextRouteNoteId) {
                currentNoteId = window.nextRouteNoteId;
                window.nextRouteNoteId = null;
            }

            const backBtn = document.getElementById('back-to-list');
            if (backBtn) {
                backBtn.addEventListener('click', () => Router.go('personalAreaTemplate'));
            }

            const colorInput2 = document.getElementById('note-color-edit');

            // פונקציה שמכינה את המסך מתוך אובייקט פתיק
            const prepareView = note => {
                if (!note) return;
                currentNoteData = note;
                currentNoteId = note.id;

                document.getElementById('note-title-edit').value = note.title || '';
                colorInput2.value = note.color || '#ffffff';
                document.getElementById('note-date').textContent = note.updated || '';
                document.getElementById('note-content-edit').value = note.content || '';

                if (note.color) {
                    const rgb = parseInt(note.color.slice(1), 16);
                    const r = (rgb >> 16) & 255;
                    const g = (rgb >> 8) & 255;
                    const b = rgb & 255;
                    const mainElement = document.querySelector('main');
                    if (mainElement) mainElement.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
                    const appElement = document.getElementById('app');
                    if (appElement) appElement.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
                }
            };

            // טען את הפתק מהמטמון או מהשרת
            if (currentNoteData && currentNoteData.id === currentNoteId) {
                prepareView(currentNoteData);
            } else if (currentNoteId != null) {
                showLoader();
                NotesServer.get(currentNoteId)
                    .then(note => {
                        hideLoader();
                        prepareView(note);
                    })
                    .catch(err => {
                        hideLoader();
                        alert('לא ניתן לטעון את הפתק');
                        Router.go('personalAreaTemplate');
                    });
            }

            document.getElementById('update-note').addEventListener('click', () => {
                const title = document.getElementById('note-title-edit').value.trim();
                if (!title) {
                    alert('כותרת לא יכולה להיות ריקה');
                    return;
                }
                const color = colorInput2.value;
                const content = document.getElementById('note-content-edit').value;
                showLoader();
                NotesServer.update({ id: currentNoteId, title, color, content }).then((result) => {
                    hideLoader();
                    if (result.error === 'timeout') {
                        alert('הבקשה תפגה, נסה שוב');
                    } else {
                        Router.go('personalAreaTemplate');
                    }
                });
            });
            document.getElementById('delete-note').addEventListener('click', () => {
                if (confirm('האם אתה בטוח שברצונך למחוק את הפתק?')) {
                    showLoader();
                    NotesServer.delete(currentNoteId).then(() => {
                        hideLoader();
                        Router.go('personalAreaTemplate');
                    });
                }
            });
            break;
    }
}

// פונקציה שאחראית על קריאת כל הפתקים מהשרת והצגתם ברשימה.
// היא מטפלת גם בסינון, מיון ושגיאות (כולל נחיתה במצב "אופליין").
function loadNotes() {
    console.log('loadNotes() called');
    showLoader();

    NotesServer.list()
        .then(notes => {
            hideLoader();

            // safety: if server responded with something unexpected, try localStorage fallback
            if (!Array.isArray(notes)) {
                console.warn('Invalid notes response, attempting to fetch stored notes...', notes);
                try {
                    const allNotes = JSON.parse(localStorage.getItem('notes') || '[]');
                    const currentUser = AuthServer.currentUser || sessionStorage.getItem('currentUser');
                    notes = allNotes.filter(n => n.user === currentUser);
                } catch (e) {
                    notes = [];
                }
            }

            // apply search
            const searchVal = document.getElementById('search')?.value.toLowerCase() || '';
            if (searchVal) {
                notes = notes.filter(n => n.title.toLowerCase().includes(searchVal));
            }

            // apply sort
            const sortSelect = document.getElementById('sort');
            if (sortSelect) {
                const sortVal = sortSelect.value;
                notes.sort((a, b) => {
                    if (sortVal === 'title' || sortVal === 'color') {
                        return (a[sortVal] || '').localeCompare(b[sortVal] || '');
                    }
                    if (sortVal === 'date') {
                        return new Date(a.updated) - new Date(b.updated);
                    }
                    return 0;
                });
            }

            const container = document.getElementById('notes-list');
            if (container) {
                container.innerHTML = '';
                console.log('Rendering notes:', notes.length);
                notes.forEach(n => {
                    const div = document.createElement('div');
                    div.className = 'note-item';
                    // Set background color with 80% opacity
                    if (n.color) {
                        const rgb = parseInt(n.color.slice(1), 16);
                        const r = (rgb >> 16) & 255;
                        const g = (rgb >> 8) & 255;
                        const b = rgb & 255;
                        div.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
                        div.style.borderLeft = `8px solid ${n.color}`;
                    }
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
                        showLoader();
                        NotesServer.get(n.id).then(note => {
                            hideLoader();
                            currentNoteData = note;
                            currentNoteId = note.id;
                            // update background immediately as earlier
                            if (note.color) {
                                const rgb = parseInt(note.color.slice(1), 16);
                                const r = (rgb >> 16) & 255;
                                const g = (rgb >> 8) & 255;
                                const b = rgb & 255;
                                const mainElement = document.querySelector('main');
                                if (mainElement) {
                                    mainElement.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
                                }
                                const appElement = document.getElementById('app');
                                if (appElement) {
                                    appElement.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
                                }
                            } else {
                                const mainElement = document.querySelector('main');
                                if (mainElement) mainElement.style.backgroundColor = '';
                                const appElement = document.getElementById('app');
                                if (appElement) appElement.style.backgroundColor = '';
                            }
                            Router.go('noteViewTemplate', { id: note.id });
                        }).catch(err => {
                            hideLoader();
                            alert('כשל בטעינת הפתק');
                        });
                    });
                    container.appendChild(div);
                });
            }
        })
        .catch(err => {
            hideLoader();
            console.warn('loadNotes encountered error', err);
            alert('לא ניתן לטעון פתקים כרגע. נסה שוב מאוחר יותר.');
        });
}

// חשיפה גלובלית של פונקציות/שדות שחלקים חיצוניים (כמו Router) צריכים
// לגשת אליהן. לעיתים גם מבחנים או דיבוג ישתמשו בזה.
window.showTemplate = showTemplate;
window.currentNoteData = null; // מטמון לחסכון בעבודה רשתית

// טעינת דף ראשונית: אתחל את האובייקטים ואפשר ניווט

document.addEventListener('DOMContentLoaded', () => {
    AuthServer.init();   // טען משתמש אם נמצא בסשן
    Router.init();       // קישור למנגנון היסטוריה

    const user = AuthServer.currentUser || sessionStorage.getItem('currentUser');
    if (user) {
        // במקום להחליט בעצמי, אתן ל-Router לבדוק את הכתובת ולנווט
        Router.handleLocation();
        // עדכן פרטי משתמש בפעם הראשונה (רלוונטי אם היינו על personalArea)
        setTimeout(() => {
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.textContent = user;
            const details = AuthServer.getCurrentUserDetails();
            if (details) {
                document.getElementById('user-phone').textContent = details.phone || '(לא הוזן)';
                document.getElementById('user-email').textContent = details.email || '(לא הוזן)';
            }
        }, 0);
    } else {
        // אין משתמש – נווט למסך כניסה
        Router.go('loginTemplate');
    }
});
