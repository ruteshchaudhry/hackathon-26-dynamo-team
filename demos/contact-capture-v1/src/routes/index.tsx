import { useCallback } from "react";
import design from "@/design/dynamine-prototype.html?raw";
import { dynamineStore, roles, targets, validateSyncRow } from "@/lib/dynamine-store";

// Keep the supplied document's CSS and markup isolated from the Outlook and
// Dynamics Tailwind styles. Only its sample identity and data source change.
const source = design
  .replace('<span class="avatar" aria-hidden="true">S</span>', '<span class="avatar" aria-hidden="true">AM</span>')
  .replace('<strong>Sam</strong>', '<strong>Alex Morgan</strong>')
  .replaceAll('Hello, Sam.', 'Hello, Alex.');
const scriptStart = source.indexOf('<script type="module">');
const rendererStart = source.indexOf('{\nconst $ = id => document.getElementById(id);', scriptStart);
const scriptEnd = source.indexOf('</script>', rendererStart);
if (scriptStart < 0 || rendererStart < 0 || scriptEnd < 0) throw new Error('DynaMine template is missing its renderer.');
const documentHtml = source.slice(0, scriptStart) + source.slice(scriptEnd + '</script>'.length);
const runtime = `const { store, targets, roles, validate, config } = window.dynamineBridge;
const route = { hash: '#/review' };
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#/"]');
  if (!link) return;
  event.preventDefault();
  route.hash = link.getAttribute('href');
  window.dispatchEvent(new Event('hashchange'));
});
` + source.slice(rendererStart, scriptEnd)
  // Replace the standalone storage with the shared demo adapter; preserve the renderer.
  .replace(/const fallback = new Map\(\);[\s\S]*?const store = createDemoStore\(prototypeStorage\);/, '')
  .replaceAll('location.hash', 'route.hash')
  .replace('render(); session = true;', 'store.enter(); render(); session = true;')
  .replace('  startTransfer();', "  if (store.read().entered) $('enter').click(); else startTransfer();");

const bridge = { store: dynamineStore, targets, roles, validate: validateSyncRow, config: { mode: 'demo' } };

type DesignWindow = Window & { dynamineBridge?: typeof bridge; dynamineMounted?: boolean };

export function WeeklyReview() {
  const mount = useCallback((event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const frame = event.currentTarget;
    const win = frame.contentWindow as DesignWindow | null;
    const doc = frame.contentDocument;
    if (!win || !doc || win.dynamineMounted) return;
    win.dynamineMounted = true;
    win.dynamineBridge = bridge;
    const script = doc.createElement('script');
    script.type = 'module';
    script.textContent = runtime;
    doc.body.append(script);
  }, []);

  return <iframe
    title="DynaMine contact sync"
    srcDoc={documentHtml}
    onLoad={mount}
    className="dynamine-frame"
  />;
}
