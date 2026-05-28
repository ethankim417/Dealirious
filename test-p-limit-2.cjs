const _pLimitMod = require("p-limit");
const pLimitFunc = (typeof _pLimitMod === 'function' ? _pLimitMod : _pLimitMod.default || _pLimitMod);
const limit = pLimitFunc(3);
const asyncFunc = async () => {
  await new Promise(r => setTimeout(r, 100));
  return 1;
};
const p1 = limit(asyncFunc);
console.log('p1 is:', p1, typeof p1.then);
