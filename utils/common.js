const subStrEmpID = (inputStr) => {
    const match = inputStr.match(/^([a-zA-Z]+)(\d+)$/);

    if (match) {
        const lettersPart = match[1];
        const numbersPart = parseInt(match[2], 10);
        const result = [lettersPart, numbersPart.toString()];
        return result;
    } else {
        return null;
    }W
}
module.exports = {
    subStrEmpID
}