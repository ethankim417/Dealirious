const _pLimitMod = require("p-limit");
const pLimitFunc = (typeof _pLimitMod === 'function' ? _pLimitMod : _pLimitMod.default || _pLimitMod);
const limit = pLimitFunc(3);
console.log('Limit function is:', typeof limit, limit);
const p1 = limit(async () => {
  console.log('Task 1 starts');
  await new Promise(r => setTimeout(r, 100));
  console.log('Task 1 finishes');
  return 1;
});
p1.then(console.log).catch(console.error);
