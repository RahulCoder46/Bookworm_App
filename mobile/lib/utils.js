//May 2024
export function formatMemberSince(dateString){
    const date = new Date(dateString);
    const month = date.toLocaleDateString("default", {month: "short"});
    const year = date.getFullYear();
    return `${month} ${year}`;
}

//May 01 2001
export function formatPublishDate(dateString){
    const date = new Date(dateString);
    const month = date.toLocaleDateString("default", {month: "short"});
    const year = date.getFullYear();
    const day = date.getDate();
    return `${month} ${day}, ${year}`;
}