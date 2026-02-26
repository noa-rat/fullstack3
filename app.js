// מנהל את האפליקציה בצד הלקוח

const app = document.getElementById('app'); // אלמנט השורש של האפליקציה
// עבור מסך תצוגת פתק
let currentNoteId = null; // מזהה הפתק הנוכחי
window.currentNoteData = null; // נתוני הפתק הנוכחי

// מציג את התבנית המתאימה
function showTemplate(id) {
    const tpl = document.getElementById(id);
    app.innerHTML = '';
    app.appendChild(document.importNode(tpl.content, true));
    bindEvents(id); // מתחבר לאירועים של התבנית
}

// מציג תצוגת טעינה בכל שליחת בקשה לשרת
function showLoader() {
    if (!document.getElementById('loader')) {
        const div = document.createElement('div');
        div.id = 'loader';
        div.innerHTML = '<div class="loader-box">טוען…</div>';
        document.body.appendChild(div);
    }
}

// מסיר את תצוגת הטעינה
function hideLoader() {
    const el = document.getElementById('loader');
    if (el) el.remove();
}

// מנהל את האירועים בהתאם לתבנית
function bindEvents(templateId) {
    switch (templateId) {
        // מסך ההתחברות
        case 'loginTemplate':
            // מאזין ללחיצה על הכפתור להרשמה
            document.getElementById('to-register').addEventListener('click', () => Router.go('registerTemplate'));
            // מאזין ללחיצה על כפתור התחברות
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
                    // אם ההתחברות הצליחה
                    if (result.success) {
                        // עובר למסך האזור האישי
                        Router.go('personalAreaTemplate');
                        // מעדכן שם את פרטי המשתמש
                        document.getElementById('user-name').textContent = user;
                        const details = AuthServer.getCurrentUserDetails();
                        if (details) {
                            document.getElementById('user-phone').textContent = details.phone || '';
                            document.getElementById('user-email').textContent = details.email || '';
                        }
                    
                    } 

                    // אם הייתה שגיאה
                    else if (result.error === 'timeout') {
                        alert('הבקשה נכשלה, הרשת לא זמינה. בדוק את החיבור שלך ונסה שוב');
                    } else {
                        alert('שם משתמש או סיסמה שגויים');
                    }
                });
            });
            break;

        // מסך ההרשמה
        case 'registerTemplate':
            // מאזין ללחיצה על הכפתור לחזרה למסך ההתחברות
            document.getElementById('to-login').addEventListener('click', () => Router.go('loginTemplate'));
            // מאזין ללחיצה על כפתור ההרשמה
            document.getElementById('register-submit').addEventListener('click', () => {
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
                    // אם ההרשמה הצליחה
                    if (result.success) {
                        alert('הרשמה בוצעה בהצלחה! כעת אתה יכול להתחבר');
                        // חוזר למסך ההתחברות
                        Router.go('loginTemplate');
                    }

                    // אם הייתה שגיאה
                    else if (result.error === 'timeout') {
                        alert('הבקשה נכשלה, הרשת לא זמינה. בדוק את החיבור שלך ונסה שוב');
                    } else {
                        alert('ההרשמה נכשלה, נסה שוב');
                    }
                });
            });
            break;
        // מסך האזור האישי
        case 'personalAreaTemplate':
            // מעדכן את פרטי המשתמש (כפול כי יש עם זה בעיות לפעמים)
            const userName = AuthServer.currentUser || sessionStorage.getItem('currentUser');
            if (userName) {
                document.getElementById('user-name').textContent = userName;
                const details = AuthServer.getCurrentUserDetails();
                if (details) {
                    document.getElementById('user-phone').textContent = details.phone || '';
                    document.getElementById('user-email').textContent = details.email || '';
                }
            }

            // מאפס את צבע הרקע (למקרה שחוזרים ממסך תצוגת פתק)
            const mainEl = document.querySelector('main');
            if (mainEl) {
                mainEl.style.backgroundColor = '';
            }
            const appEl = document.getElementById('app');
            if (appEl) {
                appEl.style.backgroundColor = '';
            }

            // מאזינים לחיפוש ומיון
            document.getElementById('search').addEventListener('input', loadNotes);
            document.getElementById('sort').addEventListener('change', loadNotes);

            // מאזין לכפתור יצירת פתק
            document.getElementById('new-note').addEventListener('click', () => {
                const titleInput = document.getElementById('new-note-title');
                const colorInput = document.getElementById('new-note-color');
                const title = titleInput.value.trim();
                const color = colorInput.value;
                if (title) {
                    showLoader();
                    NotesServer.create(title, color).then((result) => {
                        hideLoader();
                        // אם הייתה שגיאה
                        if (result.error === 'timeout') {
                            alert('הבקשה נכשלה, הרשת לא זמינה. בדוק את החיבור שלך ונסה שוב');
                        } else if (result.error) {
                            alert('שגיאה בהוספת הפתק: ' + result.error);
                        } 
                        
                        // אם הפתק נוצר 
                        else {
                            // מאפס את שדות הקלט
                            titleInput.value = '';
                            colorInput.value = '#ffffff';
                            // טוען מחדש את רשימת הפתקים
                            setTimeout(() => {
                                loadNotes();
                            }, 100);
                        }
                    
                    // אם הייתה שגיאה
                    }).catch(err => {
                        hideLoader();
                        alert('שגיאה בהוספת הפתק');
                        console.error('Create error:', err);
                    });
                } else {
                    alert('יש להזין כותרת');
                }
            });

            // טוען את הפתקים ברשימה בעת הכניסה לאזור האישי
            loadNotes();
            break;
        
        // מסך תצוגת פתק
        case 'noteViewTemplate':
            // מקבל את מזהה הפתק מהראוטר
            if (window.nextRouteNoteId) {
                currentNoteId = window.nextRouteNoteId;
                window.nextRouteNoteId = null;
            }

            // מאזין לכפתור חזרה לרשימת הפתקים
            const backBtn = document.getElementById('back-to-list');
            if (backBtn) {
                backBtn.addEventListener('click', () => Router.go('personalAreaTemplate'));
            }

            // מאזין לכפתור עדכון הפתק
            const colorInput2 = document.getElementById('note-color-edit');

            // פונקציית עזר שמציגה את פרטי הפתק
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

            // טוען את הפתק
            if (currentNoteData && currentNoteData.id === currentNoteId) {
                prepareView(currentNoteData);
            
            // אם לא שמורים הנתונים, טוען מהשרת
            } else if (currentNoteId != null) {
                showLoader();
                NotesServer.get(currentNoteId)
                    // אם הוחזרה תשובה תקינה
                    .then(note => {
                        hideLoader();
                        prepareView(note);
                    })
                    // אם הייתה שגיאה
                    .catch(err => {
                        hideLoader();
                        alert('שגיאה בטעינת הפתק');
                        Router.go('personalAreaTemplate');
                    });
            }

            // מאזין לכפתור עדכון הפתק
            document.getElementById('update-note').addEventListener('click', () => {
                const title = document.getElementById('note-title-edit').value.trim();
                if (!title) {
                    alert('הזן כותרת');
                    return;
                }
                const color = colorInput2.value;
                const content = document.getElementById('note-content-edit').value;
                showLoader();
                // שולח בקשה לשרת לעדכון הפתק
                NotesServer.update({ id: currentNoteId, title, color, content }).then((result) => {
                    hideLoader();
                    // אם הייתה שגיאה
                    if (result.error === 'timeout') {
                        alert('הבקשה נכשלה, הרשת לא זמינה. בדוק את החיבור שלך ונסה שוב');
                    } else {
                        Router.go('personalAreaTemplate');
                    }
                });
            });
            document.getElementById('delete-note').addEventListener('click', () => {
                if (confirm('למחוק את הפתק?')) {
                    showLoader();
                    NotesServer.delete(currentNoteId).then(() => {
                        hideLoader();
                        // חוזר למסך האזור האישי
                        Router.go('personalAreaTemplate');
                    });
                }
            });
            break;
    }
}

// טעינת רשימת הפתקים מהשרת
function loadNotes() {
    showLoader();

    // שולח בקשה לשרת לקבלת רשימת הפתקים
    NotesServer.list()
        .then(notes => {
            hideLoader();

            // אם התגובה לא תקינה, מנסה לטעון מהזכרון
            if (!Array.isArray(notes)) {
                try {
                    const allNotes = JSON.parse(localStorage.getItem('notes') || '[]');
                    const currentUser = AuthServer.currentUser || sessionStorage.getItem('currentUser');
                    notes = allNotes.filter(n => n.user === currentUser);
                } catch (e) {
                    notes = [];
                }
            }

            // מסנן לפי חיפוש
            const searchVal = document.getElementById('search')?.value.toLowerCase() || '';
            if (searchVal) {
                notes = notes.filter(n => n.title.toLowerCase().includes(searchVal));
            }

            // ממיין לפי בחירה
            const sortSelect = document.getElementById('sort');
            if (sortSelect) {
                const sortVal = sortSelect.value;
                notes.sort((a, b) => {
                    // מיון לפי כותרת או צבע (לפי א"ב)
                    if (sortVal === 'title' || sortVal === 'color') {
                        return (a[sortVal] || '').localeCompare(b[sortVal] || '');
                    }
                    // מיון לפי תאריך עדכון)
                    if (sortVal === 'date') {
                        return new Date(a.updated) - new Date(b.updated);
                    }
                    return 0;
                });
            }

            // מציג את הפתקים ברשימה
            const container = document.getElementById('notes-list');
            if (container) {
                container.innerHTML = '';
                notes.forEach(n => {
                    const div = document.createElement('div');
                    div.className = 'note-item';
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

                    // מאזין ללחיצה על כפתור המחיקה של הפתק
                    div.querySelector('.delete-btn').addEventListener('click', e => {
                        e.stopPropagation();
                        showLoader();
                        NotesServer.delete(n.id).then(() => {
                            hideLoader();
                            loadNotes();
                        });
                    });

                    // מאזין ללחיצה על הפתק למעבר למסך תצוגת הפתק
                    div.addEventListener('click', () => {
                        showLoader();
                        NotesServer.get(n.id).then(note => {
                            hideLoader();
                            currentNoteData = note;
                            currentNoteId = note.id;
                            if (note.color) {
                                const rgb = parseInt(note.color.slice(1), 16);
                                const r = (rgb >> 16) & 255;
                                const g = (rgb >> 8) & 255;
                                const b = rgb & 255;

                                // משנה את צבע הרקע בהתאם לצבע הפתק
                                const mainElement = document.querySelector('main');
                                if (mainElement) {
                                    mainElement.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
                                }
                                const appElement = document.getElementById('app');
                                if (appElement) {
                                    appElement.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
                                }
                            } 
                            
                            // אם אין צבע, מאפס את צבע הרקע
                            else {
                                const mainElement = document.querySelector('main');
                                if (mainElement) mainElement.style.backgroundColor = '';
                                const appElement = document.getElementById('app');
                                if (appElement) appElement.style.backgroundColor = '';
                            }
                            Router.go('noteViewTemplate', { id: note.id });
                        
                        // אם הייתה שגיאה
                        }).catch(err => {
                            hideLoader();
                            alert('שגיאה בטעינת הפתק');
                        });
                    });

                    // מוסיף את הפתק לרשימה
                    container.appendChild(div);
                });
            }

        // אם הייתה שגיאה
        }).catch(err => {
            hideLoader();
            alert('שגיאה בטעינת הפתקים. נסה שוב מאוחר יותר');
        });
}

// גלובלי כדי לאפשר לקבצים אחרים לקרוא אליו
window.showTemplate = showTemplate;

// מאתחל את האפליקציה כאשר הדף נטען
document.addEventListener('DOMContentLoaded', () => {
    AuthServer.init(); // טוען את שרת המשתמשים
    // לשרת הפתקים אין פונקצית אתחול
    Router.init(); // טוען את הניווט

    // טוען את המשתמש הנוכחי
    const user = AuthServer.currentUser || sessionStorage.getItem('currentUser');
    if (user) {
        // מנווט לתבנית המתאימה לפי הכתובת הנוכחית
        Router.handleLocation();
        // מעדכן את פרטי המשתמש באזור האישי
        setTimeout(() => {
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.textContent = user;
            const details = AuthServer.getCurrentUserDetails();
            if (details) {
                document.getElementById('user-phone').textContent = details.phone;
                document.getElementById('user-email').textContent = details.email;
            }
        }, 0);
    } 
    
    // אם אין משתמש מחובר, עובר למסך ההתחברות
    else {
        Router.go('loginTemplate');
    }
});
