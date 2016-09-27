var libraries = [
    require('./libraries/typo3'),
    require('./libraries/magento'),
    require('./libraries/tools'),
    require('./libraries/docker')
];

var ids = [], slugger = require('slugger');
function setIds(items) {
    var ids = [];
    items.forEach(function (item) {
        var slug = slugger(item.title), id = slug, i = 1;
        while (ids.indexOf(id) > -1) {
            id = slug + '-' + i;
            i++;
        }
        ids.push(id);
        item.id = id;
        if (item.items) {
            setIds(item.items);
        }
    });
}

setIds(libraries);

module.exports = libraries;