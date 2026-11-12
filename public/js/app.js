import { readyPromise } from './bag.js';
import { initBentoArchive } from './bento-archive.js';
import { buildRunwayDom } from './runway-builder.js';
import { registerRunwaySection } from './runway-section.js';

readyPromise.then((cat) => {
  if (!cat) return;
  buildRunwayDom(cat);
  initBentoArchive(cat);
  registerRunwaySection();
});
