const fs = require("fs");

function replaceContents(file, replacement, cb) {
    fs.readFile(replacement, (err, contents) => {
        if (err) return cb(err);
        fs.writeFile(file, contents, cb);
    });
}

replaceContents(
    'node_modules/@daostack/subgraph/node_modules/@daostack/migration/migration.json',
    './migration.json',
    err => {
    if (err) {
      console.log('failed to copy migration file');
    }
    console.log('done');
});