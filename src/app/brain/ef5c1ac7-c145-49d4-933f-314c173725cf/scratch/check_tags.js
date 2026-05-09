
import fs from 'fs';

const content = fs.readFileSync('d:/Github/ceekulacademy/src/app/pages/personal/create/create.html', 'utf8');

const stack = [];
const tagRegex = /<(\/?)([a-z0-9-]+)([^>]*?)(\/?)>/gi;
let match;

while ((match = tagRegex.exec(content)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();
    const isSelfClosing = match[4] === '/' || ['br', 'hr', 'img', 'input', 'link', 'meta'].includes(tagName);

    if (isSelfClosing) continue;

    if (isClosing) {
        if (stack.length === 0) {
            console.log(`Unexpected closing tag </${tagName}> at line ${content.substring(0, match.index).split('\n').length}`);
        } else {
            const last = stack.pop();
            if (last.tagName !== tagName) {
                console.log(`Mismatched closing tag </${tagName}>, expected </${last.tagName}> (opened at line ${last.line}) at line ${content.substring(0, match.index).split('\n').length}`);
            }
        }
    } else {
        stack.push({ tagName, line: content.substring(0, match.index).split('\n').length });
    }
}

while (stack.length > 0) {
    const last = stack.pop();
    console.log(`Unclosed tag <${last.tagName}> opened at line ${last.line}`);
}
