// purge.js

// iterate through all .svelte files in ./package directory
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageDir = path.resolve(__dirname, './package');
const files = fs.readdirSync(packageDir);
const svelteFiles = files.filter((file) => file.endsWith('.svelte'));

svelteFiles.forEach((file) => {
    // remove all unused css in <style> tags from this svelte file
    const filePath = path.resolve(packageDir, file);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const styleTagRegex = /<style[^]+?<\/style>/gi;
    const styleTagContents = fileContents.match(styleTagRegex);

    // get rest of file contents
    const restOfFile = fileContents.replace(styleTagRegex, '');

    // skip over any components without style
    if (!styleTagContents) return;

    // get content between <style> tags
    const styleTagContentRegex = /<style[^]+?<\/style>/i;
    const styleTagContent = styleTagContents[0].match(styleTagContentRegex)[0];
    // console.log('styleTagContent', styleTagContent);

    // regex parse out each class statement, keep the leading . and the {} block
    const classRegex = /\.([a-zA-Z0-9_-]+)[^]+?{[^]+?}/gi;
    const classStatements = styleTagContent.match(classRegex);

    // for each class Statement NoNewLines
    // check if it is used in any of the svelte files classes
    // if not, remove it from the style tag
    // if so, keep it in the style tag
    // write the new style tag to the file

    const keep = classStatements.map((statement) => {
        const className = statement.match(/\.([a-zA-Z0-9_-]+)/i)[1];

        // check if the className appears as a whole word in between quotes of class=""
        // exclude hyphenated matches
        // only match on whole words surrounded by spaces or quotes
        const regex = new RegExp(`class="[^]*?(\\s|")${className}(\\s|")[^]*?"`, 'gi');
        return restOfFile.match(regex) ? statement : '';
    });

    // join keep together
    const newStyleTagContent = keep.join('');

    // wrap in <style> tags
    const newStyleTagBlock = `<style>${newStyleTagContent}</style>`;

    // replace old style tag with new style tag
    const newFileContents = fileContents.replace(styleTagContent, newStyleTagBlock);

    // write new file contents to file
    fs.writeFileSync(filePath, newFileContents);
});