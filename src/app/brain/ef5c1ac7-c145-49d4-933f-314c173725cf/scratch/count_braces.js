
import fs from 'fs';

const content = fs.readFileSync('d:/Github/ceekulacademy/src/app/pages/personal/create/create.html', 'utf8');

let braceCount = 0;
let interpolationOpen = false;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') {
    if (content[i+1] === '{') {
        interpolationOpen = true;
        i++;
    } else if (!interpolationOpen) {
        braceCount++;
        console.log(`Open brace at line ${content.substring(0, i).split('\n').length}`);
    }
  } else if (char === '}') {
    if (content[i+1] === '}') {
        interpolationOpen = false;
        i++;
    } else if (!interpolationOpen) {
        braceCount--;
        console.log(`Close brace at line ${content.substring(0, i).split('\n').length}`);
    }
  }
}

console.log(`Final brace count: ${braceCount}`);
