export function toTitleCase(str) {
    if (!str)
        return str;
    return str.replace(/\w\S*/g, (txt) => {
        // If the word is entirely uppercase (and contains at least one letter), assume it's an acronym and leave it alone
        if (/^[A-Z0-9]+$/.test(txt) && /[A-Z]/.test(txt)) {
            return txt;
        }
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
//# sourceMappingURL=format.js.map