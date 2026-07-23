export function toTitleCase(str) {
    if (!str)
        return str;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
//# sourceMappingURL=format.js.map