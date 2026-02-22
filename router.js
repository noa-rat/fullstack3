// router.js - simple navigation helper
const Router = {
    go(templateId) {
        if (window.showTemplate) window.showTemplate(templateId);
    }
};

window.Router = Router;
