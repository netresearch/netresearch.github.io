var libraries = [
    require('./libraries/typo3'),
    require('./libraries/magento'),
    require('./libraries/tools'),
    require('./libraries/docker')
];

var ids = [], slugger = require('slugger');
function setId(item) {
    var slug = slugger(item.title), id = slug, i = 1;
    while (ids.indexOf(id) > -1) {
        id = slug + '-' + i;
        i++;
    }
    ids.push(id);
    item.id = id;
}

libraries.forEach(function (item) {
    setId(item);
    item.items.forEach(setId);
});

module.exports = libraries;