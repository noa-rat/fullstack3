# אפליקציית פתקים (Notes App)

מסמכים אלה מספקים תיעוד מפורט על מבנה הקוד, מנגנוני העבודה והאינטראקציה בין הרכיבים של האפליקציה.
הפרויקט נבנה ללא ספריות חיצוניות – HTML, CSS ו-JavaScript בלבד, עם שכבת חיקוי רשת.

---
## מבט כללי

האפליקציה היא Single Page Application (SPA) קטנה המתנהלת דרך דפדפן. היא מאפשרת:

1. רישום משתמשים חדשים (שם משתמש, סיסמה, טלפון, דוא"ל).
2. התחברות לשירות באמצעות שם משתמש וסיסמה.
3. שמירת "פתקים" פרטיים לכל משתמש, הכוללים:
   - כותרת
   - צבע רקע (בעזרת picker של צבע)
   - תוכן חופשי
   - תאריך עדכון
4. חיפוש וסינון הפתקים ברשימה.
5. מיון לפי כותרת, צבע או תאריך.
6. יצירת פתק חדש, עדכון ומחיקה.
7. ניווט באמצעות סטייט של היסטוריית הדפדפן (History API).
8. שימוש ב־`localStorage` כמסד נתונים פיקטיבי,
   ויצירת "שרת" מדומה שמגיב לבקשות AJAX תוך סימולציה של רשת בעייתית.

האפליקציה מחולקת לקבצים:

```
index.html           – תבניות HTML וטקסט הראשי
style.css            – כללי עיצוב ונראות
fajax.js             – מימוש AJAX מותאם אישית עם timeout ו-tracker
network.js           – סימולציית רשת "בעייתית" (דיליי, ירידות)
auth-server.js       – שרת חיקוי לטיפול באימות
notes-server.js      – שרת חיקוי לניהול פתקים
db-api.js            – גישה ל-localStorage (users/notes)
router.js            – ניווט SPA מבוסס History API
app.js               – לוגיקת ממשק משתמש ו-Routing
README.md            – תיעוד זה
```

---
## טעינת דף ראשונית

בהרצת הדף (`index.html`) נטענים כל הסקריפטים בסדר הבא: `fajax.js, network.js, auth-server.js, notes-server.js, db-api.js, router.js, app.js`.

- `fajax.js` מכין את המחלקה `FXMLHttpRequest` המשמשת לשליחת בקשות אל "הרשת".
- `network.js` לוכד בקשות ומסנכרן אותן עם זמן איחור ו/או איבוד.
- `auth-server.js` ו־`notes-server.js` מאזנים אותן באמצעות `Network.sendRequest`, מבצעים L/R/O בתיקיות `localStorage` ו"מחזירים" תשובות.

בעת загрузки ה־DOM, `app.js` מייצר את האובייקט `Router` ומאתחל אותו (`Router.init()`),
שמוודא ש־`popstate` מטפל בכתובות ידניות.
`AuthServer.init()` מטעין משתמש נכנס מ־`sessionStorage` אם קיים.

- אם יש משתמש מחובר, `Router.handleLocation()` בודק את הכתובת:
  - `/login` מציג טופס כניסה
  - `/register` מציג טופס הרשמה
  - `/notes/:id` מנסה לטעון פתק ספציפי מהשרת
  - אחרת: `/` מציג את האזור האישי עם רשימת הפתקים

- אם אין משתמש מחובר, הגולש מועבר ל־`/login` אוטומטית.

---
## ניווט וכתובות

`router.js` מכיל את לוגיקת ניווט הבאה:

```js
const Router = {
    init() {
        window.addEventListener('popstate', () => Router.handleLocation());
    },
    go(templateId, data) { ... }
    handleLocation() { ... }
};
```

הקריאות ל־`Router.go('template', {...})` מוחלפות ברחבי `app.js` במקום `showTemplate`,
וזוכות לכתובת המשויכת:

- `publicArea` ← `/`
- `loginTemplate` ← `/login`
- `registerTemplate` ← `/register`
- `noteViewTemplate` ← `/notes/:id`

בנוסף, `Router.handleLocation()` קורא ל־`showTemplate` המתאים גם כשמשתמש לוחץ Back/Forward.
הוא מרחיב את חלון הגלובלי ב־`window.nextRouteNoteId` כדי להעביר מזהה
הפתק אל `app.js` בעת אותו ניווט בתוך אירוע ה־popstate.

---
## מבנה `app.js`

הקובץ מהווה "המוח" של ה־SPA; להלן רכיביו המרכזיים:

### משתנים גלובליים

- `const app = document.getElementById('app');` – אלמנט הראשי שאליו נטענות תבניות.
- `let currentNoteId = null;` – מזהה הפתק הנוכחי בהצגה/עריכה.
- `window.currentNoteData = null;` – אובייקט פתיק מטמון, כדי לא לטעון שוב מהרשת אם כבר יש.
- `window.nextRouteNoteId = null;` – מזהה שנמסר מ־`Router.handleLocation()`.

### פונקציות עזר

- `function showTemplate(id)` – מחזירה את <template> הנבחרה לדום ומקשרת אירועים.
- `function showLoader() / hideLoader()` – מוסיפות/מסירות שכבת "טעינה" חצי־שקופה.

### bindEvents(templateId)

מנגנון המקשר בין הכפתורים בטמפלט לפונקציות: שדות ההתחברות, ההרשמה, אזור אישי,
יצירת פתק חדש, עדכון ומחיקה.

- בכל מעבר לטמפלט, הפונקציה קוראת לתגי `document.getElementById` הרלוונטיים
  ומתקינה מאזינים.
- הקשורים ב־`NotesServer` / `AuthServer` / `Router` / `showLoader`.

### loadNotes()

מאתחל רשימת פתקים:

1. קריאה ל־`NotesServer.list()`.
2. בדיקת תקינות (fallback ל־`localStorage` אם משהו מופרע).
3. יישום סינון לפי חיפוש, מיון לפי בחירת המשתמש.
4. בניית הקלפים (אלמנט `.note-item`) עם צבעי רקע וגבול, מאזיני לחיצה ומחיקה.

חזרתיות ושימוש ב-Promise מבטיחים טיפול בשגיאות ובאיטיות.

### השתמשות ב־NotesServer.get() לאחר הוספה של נתיב GET

בעת לחיצה על פתיק:

1. היישום מראה loader.
2. מבצע `NotesServer.get(n.id)` – קריאה ל־`/notes/:id` בשרת.
3. מקבל אובייקט note מלא
   ו
    מעדכן רקע, `currentNoteData` ו־`currentNoteId`.
    קורא ל־`Router.go('noteViewTemplate', {id})` לשינוי הכתובת.

כאשר מגיעים למסך עריכה כתוצאה מ־`Router.handleLocation()` (כגון URL ישיר או חזרה):
- `bindEvents` בודק אם יש לנו כבר `currentNoteData` המתאים; אם לא, טוען אותו מהשרת.

---
## שרתי חיקוי

### db-api.js

מנוהל כobj `DB` עם מתודות פשוטות:

```js
getUsers(), saveUser(u), findUser(u,p)
getNotes(), saveNote(note), deleteNote(id), updateNote(note)
```

הנתונים מאוחסנים ב‑`localStorage` תחת המפתחות `'users'` ו־`'notes'` כ־JSON.
אין אימות מחמיר, מדובר רק למטרת הדגמה.

### auth-server.js

- רישום (`POST /auth/register`) – פשוט "שומר" משתמש חדש ב־DB.
- התחברות (`POST /auth/login`) – מחפש התאמה בשם משתמש+סיסמה, אם נמצא, מגדיר
  `AuthServer.currentUser` ו־`sessionStorage`.

הקריאות מגיעות באמצעות `FXMLHttpRequest.send()` מהלקוח שנוצר ב־network.js.

### notes-server.js

נכון למימוש זה, השרת מטפל ב:

- `GET /notes/list` – מחזיר רק את הפתקים של המשתמש המחובר.
- `POST /notes/create` – יוצר פתק חדש עם מזהה מבוסס `Date.now()` ושומר ב־DB.
- `GET /notes/:id` – מחזיר פתק בודד בהתאם ל־id אם נמצא שייך למשתמש.
- `PUT /notes/:id` – עדכון הפתק (title, color, content).
- `DELETE /notes/:id` – מחיקת פתק.

בסיום כל בקשה נפעל `xhr.handleResponse(status, JSON.stringify(payload))`.

---
## FXMLHttpRequest & Network

`fajax.js` מיישם מחלקה חלופית ל־XMLHttpRequest:

- מאחסן `method, url, timeout` ו־`_reqId` מ־`RequestTracker`.
- `send(body)` מרחיב את הבקשה ב־id ומעביר לרשת:
  ```js
  Network.sendRequest(this, {method,url,body});
  ```
- `handleResponse(status,data)` בודק האם התשובה מיושנת על‑ידי `RequestTracker.lastSeen`.
- תומך ב־`ontimeout` שמפעיל גם רענון אוטומטי של הדף כדי להתמודד עם שגיאה.

`network.js` מחליף את `Network.sendRequest` כך שיקפיץ חצי שנייה עד שלוש שניות,
ולעיתים (בין 10–50%) "יאבד" את הבקשות, כלומר לא יחזיר תשובה כלל.

---
## CSS ועיצוב

העיצוב נמצא ב־`style.css`. עיקרי:

- אתחול (`* { box-sizing:border-box; }`) ו‑Typography בסיסית.
- סגנון גלובלי לכפתורים, שדות טקסט, נספח פירוט.
- מימוש `#new-note-area`, `#controls`, `#notes-list`, `.note-item` וכו'.
- טפסי הכניסה/הרשמה ממוקדים במרכז תוך `form-container` עם צל.
- לוחיות משתמש, רקע דינמי, ״loader״ וכו'.

העיצוב עבר מודרניזציה בשיחות קודמות, כך שכל סטייל שנדרש הוצא ל־CSS
וחלק מהאלמנטים נבחנים כעת ככיתות נפרדות.

---
## התממשקות עם השרת ודפים ישירים

- הלקוח אינו מסתמך על ערכת נתונים מקומית; הוא תמיד שואל את השרת הראשון
  (למעט fallback ל־`localStorage` במקרה של תשובה שבורה מהשרת).
- ניתן לפתוח את הדף ישירות ל־`/notes/123` בדפדפן: ה־Router יזהה את ה‑id,
  ישלח קריאה ל־`NotesServer.get(123)`, ויראה את מסך העריכה עם התוכן.
- אם המשתמש אינו מחובר, קריאות השרת יחזירו סטטוס 401; כרגע הדבר
  גורם לשוגג (הלקוח אינו בודק את זה), אך ניתן להרחיב להתנתק.

---
## ניהול משתמש וסשן

המשתמש המחובר נשמר ב־`AuthServer.currentUser` וגם ב־`sessionStorage`.
כך אם הדף נטען מחדש, התחולה תישמר.
אין טיפול ב־`logout` – אפשר להוסיף כפתור למחוק את ה־session ולהחזיר ל־`/login`.

---
## שינויים עתידיים והרחבות אפשריות

- הוספת דף עריכת פרופיל (שם, טלפון, דוא"ל) עם שמירה ב־DB.
- תמיכה בסיסמת אפס (אימות חוזר) או הצפנת סיסמאות.
- ניהול רישום שנייה/עריכה למשתמש (עדכון טלפון) דרך REST מתאים.
- אפשרות ל"אחזר" פתקים לאחר מחיקה (מנגנון נהלים). 
- הוספת בדיקות אוטומטיות (unit tests) לקבצי JS.
- מעבר ל־ES modules או להשתמש ב־Framework, אם תרצה לפתח את זה.

---

מסמך זה נועד לתת תובנות מפורטות לכל רכיב באפליקציה, כולל הסבר על התקשורת,
נקודות קריטיות בתהליך ה־routing ועליתי שינויים חשובים שבוצעו במהלך הפיתוח.
לכל שאלה נוספת או להמשך פיתוח – שמח לעזור.
