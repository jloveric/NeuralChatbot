"use strict";

let a = [["be", "b"],
    ["see", "c"],
    ["okay", "k"],
    ["and", "n"],
    ["oh", "o"],
    ["are", "r"],
    ["you", "u"],
    ["why", "y"],
    ["to", "2"],
    ["for", "4"],
    ["ate", "8"]]

let tMap = new Map()

for (let i = 0; i < a.length; i++) {
    tMap.set(a[i][1], a[i][0])
}

module.exports = tMap;   