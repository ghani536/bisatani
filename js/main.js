const storage = {
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
    get(k) { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; },
    clear() { localStorage.clear(); }
};
window.storage = storage;
const toast = { success(m){alert(m)}, error(m){alert(m)}, info(m){console.log(m)} };
window.toast = toast;
