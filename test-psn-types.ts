import * as fs from 'fs';
import * as path from 'path';

const searchPath = path.resolve('node_modules/psn-api/dist/search/makeUniversalSearch.d.ts');
if (fs.existsSync(searchPath)) {
  console.log(fs.readFileSync(searchPath, 'utf-8'));
} else {
  console.log("Not found:", searchPath);
}
